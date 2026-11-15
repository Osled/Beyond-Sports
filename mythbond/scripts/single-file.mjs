// Bundles dist/ into one self-contained HTML fragment (dist/mythbond.html) for sharing as a single page.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const dir = "dist/assets/";
const files = readdirSync(dir);
const css = files.filter((f) => f.endsWith(".css")).map((f) => readFileSync(dir + f, "utf8")).join("\n");
let js = files.filter((f) => f.endsWith(".js")).map((f) => readFileSync(dir + f, "utf8")).join("\n");
// Inline bundled art as data URIs.
for (const f of files.filter((f) => f.endsWith(".png"))) {
  const uri = "data:image/png;base64," + readFileSync(dir + f).toString("base64");
  js = js.split(`"./assets/${f}"`).join(JSON.stringify(uri)).split(`"/assets/${f}"`).join(JSON.stringify(uri));
  js = js.split(`new URL("${f}",import.meta.url).href`).join(JSON.stringify(uri));
}
const html = `<title>Mythbond</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=DotGothic16&family=Nunito:wght@400;600;700;800&display=swap">
<style>${css}</style>
<div id="app"></div>
<script type="module">${js.replace(/<\/script/g, "<\\/script")}</script>
`;
writeFileSync("dist/mythbond.html", html);
console.log("dist/mythbond.html", (html.length / 1024).toFixed(1) + " KB");
