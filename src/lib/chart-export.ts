// Export an SVG chart node to PNG at a target size.
export async function svgToPng(svg: SVGSVGElement, width: number, height: number, bg = "#f4fffb"): Promise<Blob | null> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // ensure viewBox
  if (!clone.getAttribute("viewBox")) {
    const w = svg.clientWidth || width;
    const h = svg.clientHeight || height;
    clone.setAttribute("viewBox", `0 0 ${w} ${h}`);
  }
  const xml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => resolve(b), "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportChartsFromContainer(container: HTMLElement, size: "hd" | "sd") {
  const dims = size === "hd" ? { w: 1920, h: 1080 } : { w: 960, h: 540 };
  const svgs = Array.from(container.querySelectorAll("svg.recharts-surface")) as SVGSVGElement[];
  for (let i = 0; i < svgs.length; i++) {
    const blob = await svgToPng(svgs[i], dims.w, dims.h);
    if (blob) downloadBlob(blob, `pharmaci-chart-${i + 1}-${size}.png`);
  }
}
