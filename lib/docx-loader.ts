import mammoth from "mammoth";

export class DocxLoader {
  async loadFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: buffer });
      console.log("result length:", result.value.length);
      return result.value; // This is the extracted plain text
    } catch (error) {
      console.error("Error parsing DOCX:", error);
      throw new Error("Failed to parse DOCX file");
    }
  }
}
