import fs from "fs";
import path from "path";
import pkg from "../package.json" with { type: "json" };

const content = `export const CS_WEB_LIB_VERSION = "${pkg.version}";
`;

fs.writeFileSync(path.resolve("src/version.ts"), content);

console.log(`Generated src/version.ts (${pkg.version})`);
