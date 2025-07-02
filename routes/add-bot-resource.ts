import { Router, type Request, type Response } from "express";
import authenticateToken from "../middleware/authenticate-token";
import multer from "multer";
import { z } from "zod";
import { createBotResourceServerSchema } from "../lib/schemas/create-bot-resource-schema";
import { generateResource } from "../lib/tools/generate-resource";
import { db } from "../lib/db/queries";
import { botResourceEmbeddings, botResources } from "../lib/db/schema";

const upload = multer({
  storage: multer.memoryStorage(),
});

const router = Router();

router.post(
  "/",
  authenticateToken,
  upload.fields([{ name: "file" }]),
  async (req: Request, res: Response) => {
    let finalData = {
      ...req.body,
      // @ts-ignore
      file: req.files?.file[0] as File,
    };

    let validatedData;

    try {
      validatedData = createBotResourceServerSchema.parse(finalData);
    } catch (error) {
      console.log("Error validating data:", error);
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: error.errors[0]?.message || "Invalid data" });
      } else {
        res.status(400).json({ error: "Invalid data" });
      }
      return;
    }

    let resource;

    try {
      console.log("generating resource");
      resource = await generateResource(
        validatedData.file as Express.Multer.File,
        validatedData.name || "",
        validatedData.description || ""
      );
      console.log("resource generated");
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({ error: "Failed to generate resource" });
      return;
    }

    const { kind, embeddings } = resource;

    try {
      const [insertedResource] = await db
        .insert(botResources)
        .values({
          botId: validatedData.botId,
          name: validatedData.name,
          description: validatedData.description,
          kind: kind as any,
          userId: validatedData.userId,
          fileSize: validatedData.file?.size.toString() || "0",
        })
        .returning();

      console.log("insrted resource", insertedResource);
      await db.insert(botResourceEmbeddings).values(
        embeddings.map((embedding) => ({
          botResourceId: insertedResource!.id,
          ...embedding,
        }))
      );
      console.log("inserted resource embeddings");
      res.status(200).json({ message: "Document added successfully" });
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({ error: "Failed to insert resource" });
      return;
    }
  }
);

export default router;
