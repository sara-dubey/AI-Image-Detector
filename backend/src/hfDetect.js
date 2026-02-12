import { client } from "@gradio/client";
import { SPACE_ID } from "./config.js";

export async function hfDetect({ imageBuffer, mime = "image/png" }) {
  const app = await client(SPACE_ID);

  const blob = new Blob([imageBuffer], { type: mime });

  // Space uses gr.Interface(fn=predict,...), endpoint is usually "/predict"
  const result = await app.predict("/predict", [blob]);

  const data = Array.isArray(result?.data) ? result.data[0] : result?.data;

  return {
    space: SPACE_ID,
    result: data,
  };
}
