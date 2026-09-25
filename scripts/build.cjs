const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, "src", name), "utf8");
const html = read("index.template.html")
  .replace(
    /<style>\s*\/\*__STYLE__\*\/\s*<\/style>/,
    '<link rel="stylesheet" href="style.css">',
  )
  .replace(
    /<script>\s*\/\*__SCRIPT__\*\/\s*<\/script>/,
    '<script src="app.js" defer></script>',
  )
  .replace(
    '<meta charset="utf-8">',
    "<meta charset=\"utf-8\"><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src yen-media: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'\">",
  );
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/index.html"), html);
for (const file of ["app.js", "style.css"]) {
  const content =
    file === "app.js"
      ? read(file).replace(
          "/*__EXTENSIONS__*/",
          () =>
            read("music-ui.js") +
            "\n" +
            read("news-ui.js") +
            "\n" +
            read("snapshot-ui.js") +
            "\n" +
            read("learning-ui.js"),
        )
      : read(file) +
        "\n" +
        read("extensions.css") +
        "\n" +
        read("learning.css");
  fs.writeFileSync(path.join(root, "dist", file), content);
}
console.log("Desktop assets built.");
