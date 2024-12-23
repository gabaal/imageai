"use server";

import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { actionClient } from "@/server/safe-action";
import z from "zod";
import { checkImageProcessing } from "./url_process";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const genRemoveSchema = z.object({
  prompt: z.string(),
  activeImage: z.string(),
});

export const genRemove = actionClient
  .schema(genRemoveSchema)
  .action(async ({ parsedInput: { prompt, activeImage } }) => {
    const parts = activeImage.split("/upload/");
    //https://res.cloudinary.com/demo/image/upload/e_gen_remove:prompt_fork/docs/avocado-salad.jpg
    const removeUrl = `${parts[0]}/upload/e_gen_remove:${prompt}/${parts[1]}`;
    // Poll the URL to check if the image is processed
    let isProcessed = false;
    const maxAttempts = 60;
    const delay = 500; // 1 second
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      isProcessed = await checkImageProcessing(removeUrl);
      if (isProcessed) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (!isProcessed) {
      throw new Error("Image processing timed out");
    }
    console.log(removeUrl);
    return { success: removeUrl };
  });
