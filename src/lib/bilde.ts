// Bildehjelpere for nettleseren: skalerer ned og gjør om til JPEG-data-URL.

export function tilJpeg(kilde: CanvasImageSource & { videoWidth?: number; naturalWidth?: number; width?: number }, maks = 1568, kvalitet = 0.85): string {
  const w = (kilde as HTMLVideoElement).videoWidth || (kilde as HTMLImageElement).naturalWidth || (kilde as HTMLCanvasElement).width;
  const h = (kilde as HTMLVideoElement).videoHeight || (kilde as HTMLImageElement).naturalHeight || (kilde as HTMLCanvasElement).height;
  const skala = Math.min(1, maks / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * skala);
  c.height = Math.round(h * skala);
  c.getContext("2d")!.drawImage(kilde, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", kvalitet);
}

export function filTilBilde(fil: File): Promise<HTMLImageElement> {
  return new Promise((ok, feil) => {
    const url = URL.createObjectURL(fil);
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => feil(new Error("Kunne ikke lese bildet. Prøv JPEG eller PNG."));
    img.src = url;
  });
}

export async function filTilJpeg(fil: File, maks = 1568): Promise<string> {
  return tilJpeg(await filTilBilde(fil), maks);
}

export async function dataUrlTilJpeg(dataUrl: string, maks: number, kvalitet = 0.7): Promise<string> {
  const img = new Image();
  await new Promise((ok, feil) => { img.onload = ok; img.onerror = feil; img.src = dataUrl; });
  return tilJpeg(img, maks, kvalitet);
}
