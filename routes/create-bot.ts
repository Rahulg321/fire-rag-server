import { Router, type Request, type Response } from "express";
import authenticateToken from "../middleware/authenticate-token";
import multer from "multer";
import { createBotServerSchema } from "../lib/schemas/create-bot-schema";
import { scrapeWebsite } from "../lib/ai/firecrawl";
import { generateResource } from "../lib/tools/generate-resource";
import { bot, botResourceEmbeddings, botResources } from "../lib/db/schema";
import { db } from "../lib/db/queries";
import { generateEmbeddingsFromContent } from "../lib/tools/generate-embeddings-from-content";

const upload = multer({
  storage: multer.memoryStorage(),
});

const router = Router();

router.post(
  "/",
  authenticateToken,
  upload.fields([{ name: "dataFile" }]),
  async (req: Request, res: Response) => {
    const finalData = {
      ...req.body,
      url: req.body.url,
      // @ts-ignore
      dataFile: req.files?.dataFile[0] as File,
    };

    let validatedData;

    try {
      validatedData = createBotServerSchema.parse(finalData);
      console.log("Validated Data:", validatedData);
    } catch (error) {
      console.log("Error validating data:", error);
      res.status(400).json({ error: "Invalid data" });
      return;
    }

    let insertedBot;

    try {
      console.log("creating bot document");
      const [insertedOperationBot] = await db
        .insert(bot)
        .values({
          name: validatedData.name,
          description: validatedData.dataFileDescription,
          avatar: validatedData.avatar,
          tone: validatedData.tone,
          greeting: validatedData.greeting,
          urls: validatedData.url ? [validatedData.url] : [],
          instructions: validatedData.instructions,
          userId: validatedData.userId,
        })
        .returning();

      console.log("bot document created");
      insertedBot = insertedOperationBot;
    } catch (error) {
      console.log("Error creating bot document:", error);
      res.status(500).json({ error: "Failed to insert bot" });
      return;
    }

    const { url } = validatedData;
    let scrapedData = "";

    if (url) {
      try {
        console.log("scraping website");
        const scrapeResult = await scrapeWebsite(url);
        scrapedData = JSON.stringify(
          scrapeResult.markdown && scrapeResult.metadata
        );
      } catch (error) {
        console.log("Error scraping website:", error);
        res.status(500).json({ error: "Failed to scrape website" });
        return;
      }
    }

    let websiteEmbeddings;

    if (scrapedData) {
      try {
        console.log("generating website embeddings");
        const { embeddings } = await generateEmbeddingsFromContent(scrapedData);
        console.log("website embeddings generated");
        websiteEmbeddings = embeddings;
      } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ error: "Failed to generate embeddings" });
        return;
      }

      try {
        console.log("inserting website resource");
        const [insertedWebsiteResource] = await db
          .insert(botResources)
          .values({
            botId: insertedBot!.id,
            name: `Website ${validatedData.url}`,
            description: "Website content",
            kind: "url",
            userId: validatedData.userId,
            fileSize: "0",
          })
          .returning();

        console.log("inserting website resource embeddings");
        await db.insert(botResourceEmbeddings).values(
          websiteEmbeddings.map((embedding) => ({
            botResourceId: insertedWebsiteResource!.id,
            ...embedding,
          }))
        );
        console.log("inserted website resource embeddings");
      } catch (error) {
        console.log("Error inserting website resource:", error);
        res.status(500).json({ error: "Failed to insert website resource" });
        return;
      }
    }

    let resource;

    try {
      console.log("generating resource");
      resource = await generateResource(
        validatedData.dataFile as Express.Multer.File,
        validatedData.dataFileTitle || "",
        validatedData.dataFileDescription || ""
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
          botId: insertedBot!.id,
          name: validatedData.dataFileTitle,
          description: validatedData.dataFileDescription,
          kind: kind as any,
          userId: validatedData.userId,
          fileSize: validatedData.dataFile?.size.toString() || "0",
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
    } catch (error) {
      console.log("Error:", error);
      res.status(500).json({ error: "Failed to insert resource" });
      return;
    }

    console.log("=== END CREATE BOT REQUEST ===");
    res.status(200).json({ message: "Bot created successfully" });
  }
);

export default router;
