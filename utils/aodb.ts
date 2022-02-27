/** AppendOnlyDatabase 只允许依次添加数据的数据库
 *  --------
 *  Database index file format:
 *  - [record count: u32]
 *  - [record end offset: u32]
 *  - ... 
 *  Database file format:
 *  - (
 *  -   [record size: u32]
 *  -   [record data: any]
 *  - )
 *  - ...
*/
import { PromiseLock } from "./lock.js";
import { constants as fsconst } from "fs";
import { Buffer } from "buffer";
import { open, access, readFile, writeFile, FileHandle } from "fs/promises";
import { setTimeout, clearTimeout } from "timers";

const COMMIT_DELAY = 500; // ms
const MAX_CACHE_SIZE = 128;
const INDEX_INIT_SIZE = 128;

class AppendOnlyDatabaseIndex {
    #indexPath: string;
    #index: Buffer;
    constructor (path: string) {
        this.#indexPath = path;
        this.#index = undefined;
    }
    async init () {
        try {
            this.#index = await readFile(this.#indexPath);
        } catch {
            this.#index = Buffer.allocUnsafe(INDEX_INIT_SIZE * 4 + 4);
            this.#index.writeUInt32BE(0, 0);
        }
    }
    getOffsetAndLength (index: number) {
        if (this.#index.readUInt32BE(0) <= index) {
            return [-1, -1];
        }
        const indexOffset = index * 4;
        const offset = index <= 0 ? 0 : this.#index.readUInt32BE(indexOffset);
        const endOffset = this.#index.readUInt32BE(indexOffset + 4);
        return [offset, endOffset - offset];
    }
    addIndex (dataLength: number) {
        const size = this.#index.readUInt32BE(0);
        const newDataEndOffset = (size <= 0 ? 0 : this.#index.readUInt32BE(size * 4)) + dataLength;
        // check if we could fit it
        if (this.#index.byteLength < (size * 4 + 8)) {
            // expand buffer
            const newBuffer = Buffer.allocUnsafe(INDEX_INIT_SIZE * 4 + this.#index.byteLength);
            this.#index.copy(newBuffer);
            this.#index = newBuffer;
        }
        this.#index.writeUInt32BE(newDataEndOffset, size * 4 + 4); // total size is (size * 4 + 8)
        this.#index.writeUInt32BE(size + 1, 0); // update record size
        return size; // new index
    }
    getRecordSize () {
        return this.#index.readUInt32BE(0);
    }
    getLastRecordEndOffset () {
        const size = this.#index.readUInt32BE(0);
        return size <= 0 ? 0 : this.#index.readUInt32BE(size * 4);
    }
    getCheckPoint () {
        return this.getRecordSize();
    }
    backToCheckPoint (checkPoint: number) {
        this.#index.readUInt32BE(checkPoint);
    }
    async commit () {
        const size = this.#index.readUInt32BE(0);
        const l = [];
        for (let i = 0; i <= size; i++) {
            l.push(this.#index.readUint32BE(i * 4));
        }
        await writeFile(this.#indexPath, this.#index);
    }
}

export class AppendOnlyDatabase {
    #path: string;
    #cacheSize: number;
    #commitSize: number;
    #lock: PromiseLock;
    #notSyncedCount: number;
    #syncTimerHandler: NodeJS.Timeout;
    #cache: Array<Buffer>; // string save a lot of memory compare to object
    #dataFileHandler: FileHandle;
    #index: AppendOnlyDatabaseIndex;
    #useJson: boolean;
    constructor (path: string, useJson = true, cacheSize: number = MAX_CACHE_SIZE, commitSize: number = MAX_CACHE_SIZE) {
        this.#path = path;
        this.#cacheSize = cacheSize;
        this.#commitSize = commitSize;
        this.#lock = new PromiseLock();
        this.#notSyncedCount = 0;
        this.#syncTimerHandler = null;
        this.#cache = new Array<Buffer>(); // only the most recent records are stored in cache 
        this.#dataFileHandler = undefined;
        this.#index = new AppendOnlyDatabaseIndex(`${path}.index`);
        this.#useJson = useJson;
    }
    getSize () {
        const savedRecordSize = this.#index.getRecordSize();
        return this.#notSyncedCount + savedRecordSize;
    }
    async init () {
        // init data file
        await this.#lock.lock();
        try {
            try {
                await access(this.#path, fsconst.R_OK | fsconst.W_OK);
                this.#dataFileHandler = await open(this.#path, "r+");
            } catch {
                this.#dataFileHandler = await open(this.#path, "w+");
            }
            await this.#index.init();
        } finally {
            this.#lock.unlock();
        }
    }
    async addRecord (record: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        await this.#lock.lock();
        try {
            if (this.#useJson) {
                const data = JSON.stringify(record);
                this.#cache.push(Buffer.from(data, "utf8"));
            } else {
                this.#cache.push(record);
            }
            this.#notSyncedCount += 1;
            if (this.#notSyncedCount < this.#commitSize) {
                // cache not full, just set the timer.
                if (this.#syncTimerHandler !== null) {
                    this.#syncTimerHandler.refresh();
                } else {
                    this.#syncTimerHandler = setTimeout(this.sync.bind(this), COMMIT_DELAY);
                }
            } else {
                await this.#sync(); // no lock version
            }
            const savedRecordSize = this.#index.getRecordSize();
            return this.#notSyncedCount + savedRecordSize - 1;
        } finally {
            this.#lock.unlock();
        }
    }
    async getRecord (index: number) {
        const res = await this.getRecords(index, 1);
        if (res.length > 0) {
            return res.at(0);
        } else {
            return null;
        }
    }
    async getRecords (index: number, length: number) {
        await this.#lock.lock();
        const result = [];
        try {
            const savedRecordSize = this.#index.getRecordSize();
            const totalSize = this.#notSyncedCount + savedRecordSize;
            if (index < 0) {
                length = length + index;
                index = 0;
            } else if (index > totalSize - 1) {
                return result; // empty
            }
            if (length < 1) {
                return result;
            }
            length = Math.min(length, totalSize - index); // length <= totalSize-index
            let indexInCache = this.#cache.length - (totalSize - index);
            // there is no chance indexInCache >= this.#cache.length
            if (indexInCache < 0) {
                // read from file
                const toIndex = Math.min((index + length), (index - indexInCache)); // index + Math.abs(indexInCache) because indexInCache < 0 // not include
                const offsetAndLength = [];
                for (let i = index; i < toIndex; i++) {
                    offsetAndLength.push(this.#index.getOffsetAndLength(i));
                }
                if (offsetAndLength.length > 0) {
                    const startOffset = offsetAndLength.at(0)[0];
                    const [lastOffset, lastLength] = offsetAndLength.at(-1);
                    const finalOffset = lastOffset + lastLength;
                    const readLength = finalOffset - startOffset;
                    const buffer = Buffer.allocUnsafe(readLength);
                    const { bytesRead } = await this.#dataFileHandler.read({ buffer, position: startOffset, length: readLength });
                    if (bytesRead === readLength) {
                        offsetAndLength.forEach(([off, len]) => {
                            const offsetInBuffer = off - startOffset;
                            if (this.#useJson) {
                                result.push(JSON.parse(buffer.toString("utf8", offsetInBuffer + 4, offsetInBuffer + len))); // skip first 4 bytes, they are record size
                            } else {
                                result.push(Buffer.from(buffer, offsetInBuffer + 4, len - 4));
                            }
                        });
                    }
                }
                length = Math.max(0, (length + indexInCache)); // length - Math.abs(indexInCache) because indexInCache < 0
                indexInCache = 0;
            }
            // get record in cache
            const endIndex = indexInCache + length;
            for (let i = indexInCache; i < endIndex; i++) {
                if (this.#useJson) {
                    result.push(JSON.parse(this.#cache.at(i).toString("utf8")));
                } else {
                    result.push(this.#cache.at(i));
                }
            }
            return result;
        } finally {
            this.#lock.unlock();
        }
    }
    async #sync () {
        const checkPoint = this.#index.getCheckPoint();
        try {
            if (this.#notSyncedCount <= 0) return;
            // write record to file
            const startIndex = this.#cache.length - this.#notSyncedCount;
            for (let i = startIndex; i < this.#cache.length; i++) {
                const record = this.#cache.at(i);
                const baseOffset = this.#index.getLastRecordEndOffset();
                const bufferSizeInfo = Buffer.allocUnsafe(4);
                bufferSizeInfo.writeUInt32BE(record.byteLength);
                let writeSize = (await this.#dataFileHandler.write(bufferSizeInfo, 0, 4, baseOffset)).bytesWritten;
                if (writeSize != 4) throw new Error("AODB write failed!");
                writeSize = (await this.#dataFileHandler.write(record, 0, record.byteLength, baseOffset + 4)).bytesWritten;
                if (writeSize != record.byteLength) throw new Error("AODB write failed!");
                this.#index.addIndex(record.byteLength + 4);
            }
            // flush
            await this.#dataFileHandler.datasync();
            await this.#index.commit();
            // reduce cache
            const cacheOffset = this.#cache.length - this.#cacheSize;
            if (cacheOffset > 0) {
                this.#cache.splice(0, cacheOffset);
            }
            this.#notSyncedCount = 0;
        } catch (e) {
            this.#index.backToCheckPoint(checkPoint); // if any error happened, the index would not be touched.
            throw e;
        }
    }
    async sync () {
        await this.#lock.lock();
        try {
            await this.#sync();
        } finally {
            if (this.#syncTimerHandler !== null) {
                clearTimeout(this.#syncTimerHandler);
                this.#syncTimerHandler = null;
            }
            this.#lock.unlock();
        }
    }
    async close () {
        await this.sync();
        await this.#dataFileHandler.close();
    }
}
