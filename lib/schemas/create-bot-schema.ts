import { z } from "zod";

// Schema for file objects (for validation)
const fileSchema = z
  .object({
    size: z.number().max(5 * 1024 * 1024, "File size must be 5MB or less"), // 5MB in bytes
    name: z.string().optional(),
  })
  .optional();

// Schema for multer files (server-side)
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

// Schema for File objects (for form handling - client-side)
const fileInputSchema = z.instanceof(File).optional();

// Schema for bot creation (client-side)
export const createBotSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  language: z.string().min(1, "Language is required"),
  greeting: z.string().min(1, "Greeting is required"),
  avatar: z.string().min(1, "Avatar is required"),
  dataFile: fileInputSchema,
  dataFileTitle: z.string().min(1, "Data file title is required"),
  dataFileDescription: z.string().optional(),
  brandFile: fileInputSchema,
  brandFileTitle: z.string().min(1, "Brand file title is required"),
  brandFileDescription: z.string().optional(),
  urls: z
    .array(z.string().url("Invalid URL format"))
    .min(1, "At least one URL is required"),
  tone: z.string().min(1, "Tone is required"),
  instructions: z.string().min(1, "Instructions are required"),
  userId: z.string().min(1, "User ID is required"),
});

// Schema for server-side bot creation (with multer files)
export const createBotServerSchema = z.object({
  name: z.string().min(1, "Bot name is required"),
  language: z.string().min(1, "Language is required"),
  greeting: z.string().min(1, "Greeting is required"),
  avatar: z.string().min(1, "Avatar is required"),
  dataFile: multerFileSchema,
  dataFileTitle: z.string().min(1, "Data file title is required"),
  dataFileDescription: z.string().optional(),
  brandGuidelines: z.string().min(1, "Brand guidelines are required"),
  url: z.string().url("Invalid URL format").optional(),
  tone: z.string().min(1, "Tone is required"),
  instructions: z.string().min(1, "Instructions are required"),
  userId: z.string().min(1, "User ID is required"),
});

// Type inference from the schema
export type CreateBotFormData = z.infer<typeof createBotSchema>;

// Optional: Create a schema for partial updates
export const updateBotSchema = createBotSchema.partial();

// Optional: Create a schema for form validation with custom error messages
export const createBotFormSchema = z
  .object({
    name: z.string().min(1, "Bot name is required"),
    language: z.string().min(1, "Language is required"),
    greeting: z.string().min(1, "Greeting is required"),
    avatar: z.string().optional(),
    dataFile: fileSchema,
    dataFileTitle: z.string().min(1, "Data file title is required"),
    dataFileDescription: z.string().optional(),
    brandFile: fileSchema,
    brandFileTitle: z.string().min(1, "Brand file title is required"),
    brandFileDescription: z.string().optional(),
    urls: z
      .array(z.string().url("Invalid URL format"))
      .min(1, "At least one URL is required"),
    tone: z.string().min(1, "Tone is required"),
    instructions: z.string().min(1, "Instructions are required"),
  })
  .refine(
    (data) => {
      // Additional custom validation if needed
      return true;
    },
    {
      message: "Custom validation failed",
      path: ["custom"],
    }
  );
