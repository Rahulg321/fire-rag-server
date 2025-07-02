import { z } from "zod";

const multerFileSchema = z
  .object({
    fieldname: z.string(),
    originalname: z.string(),
    encoding: z.string(),
    mimetype: z.string(),
    size: z.number().max(5 * 1024 * 1024, "File size must be 5MB or less"),
    buffer: z.instanceof(Buffer),
  })
  .optional();

export const createBotResourceServerSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  description: z.string().min(1, "Description is required"),
  botId: z.string().min(1, "Bot ID is required"),
  file: multerFileSchema,
  userId: z.string().min(1, "User ID is required"),
});
