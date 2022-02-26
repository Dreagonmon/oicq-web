import { normalize, join, basename, dirname } from "path";
import { statSync, mkdirSync, rmSync, chmodSync, constants, PathLike } from "fs";
// __dirname in esm
import { fileURLToPath } from "url";
// end

export const SRC_ROOT = (() => {
    let tmpRoot: string;
    if ((process as any).pkg) { // eslint-disable-line @typescript-eslint/no-explicit-any
        // for pkg package, from dist/bundle.js
        tmpRoot = dirname((process as any).pkg.entrypoint); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
        try {
            // for dist/bundle.js, as CommonJS
            tmpRoot = dirname(require.main.filename);
        } catch {
            // for dist/index.js, as ESM
            const __dirname = dirname(fileURLToPath(import.meta.url));
            tmpRoot = normalize(join(__dirname, ".."));
        }
    }
    const name = basename(tmpRoot).toLowerCase();
    if (name === "dist" || name === "build") {
        tmpRoot = normalize(join(tmpRoot, ".."));
    }
    return tmpRoot;
})();
export const DATA_ROOT = (() => {
    if ((process as any).pkg) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return join(dirname(process.execPath), "data");
    } else {
        return join(SRC_ROOT, "data");
    }
})();

const isOwnerControlable = (mode: number) => {
    if ((mode & constants.S_IRUSR) <= 0) return false;
    if ((mode & constants.S_IWUSR) <= 0) return false;
    return true;
};

export const ensureDir = (path: PathLike) => {
    const stat = statSync(path, { throwIfNoEntry: false });
    if (stat) {
        if (!stat.isDirectory()) {
            rmSync(path);
            mkdirSync(path, { recursive: true });
        }
        if (!isOwnerControlable(stat.mode)) {
            chmodSync(path, constants.S_IRUSR | constants.S_IWUSR);
        }
    } else {
        mkdirSync(path, { recursive: true });
    }
};

export const initEnv = () => {
    ensureDir(DATA_ROOT);
};

export const getPathInSrc = (...paths: string[]) => {
    const path = normalize(join(SRC_ROOT, ...paths));
    if (!path.startsWith(SRC_ROOT)) {
        throw new Error(`${path} is out of ${SRC_ROOT}`);
    }
    return path;
};

export const getPathInData = (...paths: string[]) => {
    const path = normalize(join(DATA_ROOT, ...paths));
    if (!path.startsWith(DATA_ROOT)) {
        throw new Error(`${path} is out of ${DATA_ROOT}`);
    }
    return path;
};

export const getPathWithin = (root: string, ...paths: string[]) => {
    const path = normalize(join(root, ...paths));
    if (!path.startsWith(root) || !path.startsWith(DATA_ROOT)) {
        throw new Error(`${path} is out of root path.`);
    }
    return path;
};
