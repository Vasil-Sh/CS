import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const OUT_DIR = path.resolve(__dirname, "..", "hltv_logos");
const URL = "https://www.hltv.org/ranking/teams/2026/july/27";

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Opening HLTV ranking page...");
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });

  // Extract team names and logo URLs
  const teams: { rank: number; name: string; url: string }[] =
    await page.evaluate(() => {
      const rows = document.querySelectorAll(".ranked-team");
      const result: { rank: number; name: string; url: string }[] = [];
      rows.forEach((row, i) => {
        const nameEl = row.querySelector(".name");
        const imgEl = row.querySelector("img");
        if (nameEl && imgEl) {
          result.push({
            rank: i + 1,
            name: nameEl.textContent!.trim(),
            url: (imgEl as HTMLImageElement).src,
          });
        }
      });
      return result;
    });

  console.log(`Found ${teams.length} teams`);

  // Download each logo via XHR from within the browser
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const safeName = team.name.replace(/[\\/:*?"<>|]/g, "_");
    const ext = team.url.includes(".svg") ? ".svg" : ".png";
    const fileName = `${team.rank.toString().padStart(3, "0")}_${safeName}${ext}`;
    const filePath = path.join(OUT_DIR, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${teams.length}] SKIP ${fileName} (exists)`);
      continue;
    }

    try {
      const base64 = await page.evaluate(async (url) => {
        return new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = () => {
            const bytes = new Uint8Array(xhr.response);
            let bin = "";
            for (let j = 0; j < bytes.length; j++)
              bin += String.fromCharCode(bytes[j]);
            resolve(btoa(bin));
          };
          xhr.onerror = () => reject(new Error("XHR failed"));
          xhr.send();
        });
      }, team.url);

      fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
      console.log(`[${i + 1}/${teams.length}] OK   ${fileName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[${i + 1}/${teams.length}] FAIL ${fileName} -- ${msg}`);
    }
  }

  await browser.close();
  const files = fs.readdirSync(OUT_DIR);
  console.log(`\nDone! ${files.length} files in ${OUT_DIR}`);
}

main().catch(console.error);
