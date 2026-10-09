// Self-hosted fonts keep Ukrainian type identical on every device and in PNG.
export const posterFonts = [
  { family: "MI Poster Sans", url: "/assets/share-poster/Montserrat.ttf" },
  { family: "MI Poster Condensed", url: "/assets/share-poster/Oswald.ttf" },
];
export const posterFontCss = posterFonts
  .map(
    (font) =>
      `@font-face{font-family:'${font.family}';src:url('${font.url}') format('truetype');font-weight:100 900;font-style:normal;font-display:block;}`,
  )
  .join("\n");

const embedded = new Map<string, Promise<string>>();
export function posterAssetDataUrl(url: string) {
  if (!embedded.has(url)) {
    const promise = fetch(url)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Unable to load poster asset: ${response.status}`);
        return response.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () =>
              reject(new Error("Unable to embed poster asset"));
            reader.readAsDataURL(blob);
          }),
      )
      .catch((error) => {
        embedded.delete(url);
        throw error;
      });
    embedded.set(url, promise);
  }
  return embedded.get(url)!;
}
