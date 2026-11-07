import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** Skalerer et bilde ned og gir det tilbake som JPEG data-URL. */
export async function tilJpeg(uri: string, bredde: number, kvalitet = 0.7): Promise<string> {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: bredde }).renderAsync();
  const res = await ref.saveAsync({ base64: true, compress: kvalitet, format: SaveFormat.JPEG });
  return `data:image/jpeg;base64,${res.base64}`;
}
