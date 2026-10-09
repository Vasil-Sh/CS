import { posterAssetDataUrl, posterFonts } from "./posterAssets";

/** Paint this deliberately flat card from its measured layout. This avoids
 * html2canvas's Oswald baseline and SVG object-fit rendering differences. */
export async function renderShareCard(
  card: HTMLElement,
): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const artwork = card.querySelector<SVGSVGElement>("svg[data-share-artwork]");
  if (artwork) {
    // Serialize the same SVG shown in the preview: textures, rotation and type
    // stay intact without relying on partial HTML/CSS canvas emulation.
    const copy = artwork.cloneNode(true) as SVGSVGElement;
    const view = artwork.viewBox.baseVal;
    copy.setAttribute("width", String(view.width));
    copy.setAttribute("height", String(view.height));
    copy.removeAttribute("style");
    // SVG images do not resolve external images/fonts when drawn onto canvas.
    // Embed the exact local assets rather than exporting fallback system type.
    await Promise.all(
      Array.from(copy.querySelectorAll("image[data-embed-image]")).map(
        async (image) => {
          image.setAttribute(
            "href",
            await posterAssetDataUrl(image.getAttribute("href")!),
          );
        },
      ),
    );
    const fontStyle = copy.querySelector("style[data-poster-fonts]");
    if (fontStyle)
      fontStyle.textContent = (
        await Promise.all(
          posterFonts.map(
            async (font) =>
              `@font-face{font-family:'${font.family}';src:url('${await posterAssetDataUrl(font.url)}') format('truetype');font-weight:100 900;font-style:normal;}`,
          ),
        )
      ).join("\n");
    const blob = new Blob([new XMLSerializer().serializeToString(copy)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(view.width * 2);
      canvas.height = Math.ceil(view.height * 2);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  await Promise.all(
    Array.from(card.querySelectorAll("img")).map((img) =>
      img.decode().catch(() => undefined),
    ),
  );
  const bounds = card.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const scale = 3;
  canvas.width = Math.ceil(bounds.width * scale);
  canvas.height = Math.ceil(bounds.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.scale(scale, scale);

  const paintText = (node: Text, style: CSSStyleDeclaration) => {
    const value = node.textContent || "";
    if (!value.trim()) return;
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.textBaseline = "alphabetic";
    (
      ctx as CanvasRenderingContext2D & { letterSpacing: string }
    ).letterSpacing =
      style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
    const range = document.createRange();
    let line = "",
      left = 0,
      top = NaN;
    const flush = () => {
      if (!line) return;
      const text =
        style.textTransform === "uppercase" ? line.toUpperCase() : line;
      const metrics = ctx.measureText(text);
      const ascent =
        metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize);
      ctx.fillText(text, left - bounds.left, top - bounds.top + ascent);
    };
    for (let i = 0; i < value.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.width && /\s/.test(value[i])) continue;
      if (Number.isNaN(top) || Math.abs(rect.top - top) > 1) {
        flush();
        line = "";
        left = rect.left;
        top = rect.top;
      }
      line += value[i];
    }
    flush();
    range.detach();
  };
  const paint = (element: HTMLElement) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const x = rect.left - bounds.left,
      y = rect.top - bounds.top;
    if (style.display === "none" || style.visibility === "hidden") return;
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(x, y, rect.width, rect.height);
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
      const width = parseFloat(style[`border${side}Width`]);
      if (!width) continue;
      ctx.fillStyle = style[`border${side}Color`];
      if (side === "Top") ctx.fillRect(x, y, rect.width, width);
      if (side === "Bottom")
        ctx.fillRect(x, y + rect.height - width, rect.width, width);
      if (side === "Left") ctx.fillRect(x, y, width, rect.height);
      if (side === "Right")
        ctx.fillRect(x + rect.width - width, y, width, rect.height);
    }
    if (
      element instanceof HTMLImageElement &&
      element.complete &&
      element.naturalWidth
    ) {
      const ratio = Math.min(
        rect.width / element.naturalWidth,
        rect.height / element.naturalHeight,
      );
      const w = element.naturalWidth * ratio,
        h = element.naturalHeight * ratio;
      ctx.save();
      ctx.filter = style.filter;
      ctx.drawImage(
        element,
        x + (rect.width - w) / 2,
        y + (rect.height - h) / 2,
        w,
        h,
      );
      ctx.restore();
    }
    for (const child of Array.from(element.childNodes)) {
      if (child instanceof HTMLElement) paint(child);
      else if (child instanceof Text) paintText(child, style);
    }
  };
  paint(card);
  return canvas;
}
