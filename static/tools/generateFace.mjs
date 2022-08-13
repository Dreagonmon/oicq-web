/**
 * https://github.com/Icalingua-plus-plus/Icalingua-plus-plus/tree/dev/icalingua/static/face
 */

import { argv } from "node:process";
import { join } from "node:path";
import { readdir, readFile, writeFile } from "node:fs/promises";

const TMP = `
export const FACE: Record<number, string> = {
<placeholder>
};
`;

const main = async () => {
    if (argv.length < 3) {
        return;
    }
    const facePath = argv[2];
    const files = await readdir(facePath);
    const lines = [];
    const ids = [];
    for (const file of files) {
        const filePath = join(facePath, file);
        const content = await readFile(filePath);
        const url = `data:image/apng;base64,${content.toString("base64")}`;
        lines.push(`    ${Number.parseInt(file, 10).toString(10)}: "${url}",`);
        ids.push(Number.parseInt(file, 10));
    }
    const body = lines.join("\n");
    const content = TMP.replace("<placeholder>", body);
    writeFile("face.ts", content, { encoding: "utf-8" });
    console.log(JSON.stringify(ids));
};

await main();
