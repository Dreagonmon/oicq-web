import { createHash, createCipheriv, createDecipheriv, randomFill } from "crypto";

const randomIV: () => Promise<Buffer> = () => {
    return new Promise((resolve, reject) => {
        randomFill(Buffer.allocUnsafe(16), (err, buf) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(buf);
        });
    });
};

export const hashPassword = (ps: string) => {
    return createHash("sha256").update(">SaLt>" + ps).digest("hex");
};

export const createKey = (ps: string) => {
    return createHash("sha256").update("<sAlT<" + ps).digest();
};

export const encrypt = async (key: Buffer, buffer: Buffer) => {
    const iv = await randomIV();
    const cp = createCipheriv("aes-256-cbc", key, iv);
    const enc1 = cp.update(buffer);
    const enc2 = cp.final();
    return Buffer.concat([iv, enc1, enc2]);
};

export const decrypt = (key: Buffer, buffer: Buffer) => {
    const iv = Buffer.from(buffer.buffer, buffer.byteOffset, 16);
    buffer = Buffer.from(buffer.buffer, buffer.byteOffset + 16, buffer.length - 16);
    const dp = createDecipheriv("aes-256-cbc", key, iv);
    const dec1 = dp.update(buffer);
    const dec2 = dp.final();
    return Buffer.concat([dec1, dec2]);
};
