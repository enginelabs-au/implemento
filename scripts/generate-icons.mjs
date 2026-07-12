import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = join(__dirname, "generate-icons.py");
const iconDir = join(__dirname, "../extension/public/icons");
const result = spawnSync("python3", [script], { stdio: "inherit" });

if (result.status !== 0) {
  const iconsExist = [16, 48, 128].every((size) =>
    existsSync(join(iconDir, `icon-${size}.png`)),
  );
  if (iconsExist) {
    console.warn("generate-icons: python step failed; using existing icon PNGs");
  } else {
    process.exit(result.status ?? 1);
  }
}
