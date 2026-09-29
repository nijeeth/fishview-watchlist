import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, "seed-eq.js");

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "FishView/0.1" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

function parse(text) {
  const nse = {};
  const bse = {};
  const eq = new Set(["EQ", "BE", "SM", "ST", "A", "B", "T", "X", "XT", "Z", "TS", "BZ"]);
  for (const line of String(text).split(/\r?\n/)) {
    if (!line) continue;
    const cols = line.split(",");
    const tagged = cols.find((c) => /^(NSE|BSE):[A-Z0-9.&]+-/i.test(String(c).trim()));
    if (!tagged) continue;
    const m = String(tagged).trim().match(/^(NSE|BSE):([A-Z0-9.&]+)-([A-Z0-9]+)$/i);
    if (!m) continue;
    if (!eq.has(m[3].toUpperCase())) continue;
    const t = m[2].toUpperCase();
    const name = String(cols[1] || t).replace(/"/g, "");
    if (m[1].toUpperCase() === "NSE" && !nse[t]) nse[t] = name;
    if (m[1].toUpperCase() === "BSE" && !bse[t]) bse[t] = name;
  }
  return { nse, bse };
}

const [nseCsv, bseCsv] = await Promise.all([
  get("https://public.fyers.in/sym_details/NSE_CM.csv"),
  get("https://public.fyers.in/sym_details/BSE_CM.csv"),
]);
const nseBook = parse(nseCsv);
const bseBook = parse(bseCsv);
const book = { nse: nseBook.nse, bse: bseBook.bse };
const day = new Date().toISOString().slice(0, 10);
const js = `export const SEED_BUILT = ${JSON.stringify(day)};\nexport const SEED_EQ = ${JSON.stringify(book)};\n`;
fs.writeFileSync(out, js);
console.log("nse", Object.keys(book.nse).length, "bse", Object.keys(book.bse).length, "bytes", js.length);
