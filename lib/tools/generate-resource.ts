import {
  generateChunksFromText,
  generateEmbeddingsFromChunks,
} from "../ai/embedding";
import { openaiClient } from "../ai/providers";
import { DocxLoader } from "../docx-loader";
import ExcelLoader from "../excel-loader";
import { PDFLoader } from "../pdf-loader";

export async function generateResource(
  file: Express.Multer.File,
  title: string,
  description: string
) {
  const fileType = file.mimetype;
  const buffer = file.buffer;
  const name = file.originalname;

  let content = "";
  let kind = "";
  let chunks: any;
  let embeddingInput: string[] = [];
  let aiAnalysis = "";

  if (fileType === "application/pdf") {
    const pdfLoader = new PDFLoader();
    const rawContent = await pdfLoader.loadFromBuffer(buffer);

    console.log("analysing pdf using AI");
    const base64String = buffer.toString("base64");
    try {
      const response = await openaiClient.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                filename: file.originalname,
                file_data: `data:${fileType};base64,${base64String}`,
              },
              {
                type: "input_text",
                text: `Please analyze this PDF document and provide a comprehensive summary that includes:

1. Main Topic and Purpose
   - Identify the primary subject matter
   - Determine the document's intended purpose and audience

2. Key Points and Arguments
   - Extract and list the main arguments or findings
   - Highlight any significant data points or statistics
   - Note any conclusions or recommendations

3. Structure and Organization
   - Describe how the document is organized
   - Identify major sections and their purposes

4. Important Details
   - List any critical dates, names, or figures
   - Note any specific methodologies or approaches discussed
   - Highlight any unique or noteworthy elements

5. Context and Implications
   - Discuss the broader context or background
   - Note any potential implications or applications

Please format your response in a clear, structured manner that makes it easy to understand the document's key elements.`,
              },
            ],
          },
        ],
      });

      aiAnalysis = response.output_text;
    } catch (error) {
      console.log("Error from analysing pdf using AI", error);
      aiAnalysis = "Error from analysing pdf using AI";
    }

    // Combine raw content with AI summary
    content = `FileTitle: ${title}\nFileDescription: ${description}\n\n Original Content:\n\n${rawContent}\n\nAI Analysis:\n\n${aiAnalysis}`;
    kind = "pdf";
  } else if (
    fileType === "application/vnd.ms-excel" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    console.log("=== Processing Excel file ===");
    const excelLoader = new ExcelLoader();
    const sheets = await excelLoader.loadExcelFromBuffer(buffer);
    console.log("Excel sheets loaded:", Object.keys(sheets));

    // Filter out empty rows and create meaningful content
    const excelContent = Object.entries(sheets)
      .map(([sheetName, rows]) => {
        console.log(
          `Processing sheet: ${sheetName}, Total rows: ${rows.length}`
        );

        // Filter out completely empty rows
        const nonEmptyRows = rows.filter((row: any) =>
          row.some(
            (cell: any) =>
              cell !== null && cell !== undefined && String(cell).trim() !== ""
          )
        );

        console.log(
          `Sheet ${sheetName}: ${nonEmptyRows.length} non-empty rows out of ${rows.length} total`
        );

        if (nonEmptyRows.length === 0) {
          return `Sheet: ${sheetName}\n(Empty sheet)`;
        }

        return `Sheet: ${sheetName}\n${nonEmptyRows
          .map((row, idx) => `Row ${idx + 1}: ${row.map(String).join(" | ")}`)
          .join("\n")}`;
      })
      .filter((content) => !content.includes("(Empty sheet)"))
      .join("\n\n");

    console.log("Excel content length:", excelContent.length);
    console.log(
      "Excel content preview (first 500 chars):",
      excelContent.substring(0, 500)
    );

    // Create content without AI analysis for Excel
    content = `FileTitle: ${title}\nFileDescription: ${description}\n\n Original Content:\n\n${excelContent}`;
    kind = "excel";

    console.log("Final Excel content length:", content.length);
    console.log(
      "Final Excel content preview (first 500 chars):",
      content.substring(0, 500)
    );
  } else if (fileType === "application/msword") {
    throw new Error(
      "We do not support .doc files. Please upload a .docx file instead."
    );
  } else if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    console.log("=== Processing DOCX file ===");
    const docxLoader = new DocxLoader();
    const rawContent = await docxLoader.loadFromBuffer(buffer);
    console.log("DOCX raw content length:", rawContent.length);

    console.log("analysing docx using AI");
    const base64String = buffer.toString("base64");
    try {
      const response = await openaiClient.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_file",
                filename: file.originalname,
                file_data: `data:${fileType};base64,${base64String}`,
              },
              {
                type: "input_text",
                text: `Please analyze this DOCX document and provide a comprehensive summary that includes:

1. Main Topic and Purpose
   - Identify the primary subject matter
   - Determine the document's intended purpose and audience

2. Key Points and Arguments
   - Extract and list the main arguments or findings
   - Highlight any significant data points or statistics
   - Note any conclusions or recommendations

3. Structure and Organization
   - Describe how the document is organized
   - Identify major sections and their purposes

4. Important Details
   - List any critical dates, names, or figures
   - Note any specific methodologies or approaches discussed
   - Highlight any unique or noteworthy elements

5. Context and Implications
   - Discuss the broader context or background
   - Note any potential implications or applications

Please format your response in a clear, structured manner that makes it easy to understand the document's key elements.`,
              },
            ],
          },
        ],
      });

      aiAnalysis = response.output_text;
    } catch (error) {
      console.log("Error from analysing docx using AI", error);
      aiAnalysis = "Error from analysing docx using AI";
    }

    // Combine raw content with AI summary
    content = `FileTitle: ${title}\nFileDescription: ${description}\n\n Original Content:\n\n${rawContent}\n\nAI Analysis:\n\n${aiAnalysis}`;
    kind = "docx";

    console.log("Final DOCX content length:", content.length);
  } else if (fileType === "image/png" || fileType === "image/jpeg") {
    console.log("=== Processing Image file ===");
    const base64Image = Buffer.from(buffer).toString("base64");
    try {
      const response = await openaiClient.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Can you properly analyse this image for please. Extract any relevant text from the image which you may find relevant to the topic of the image. If you find any text, please extract it and return it as a string. If you don't find any text, please return an empty string. Apart from the text, give your detailed analysis of the image",
              },
              {
                type: "input_image",
                image_url: `data:${fileType};base64,${base64Image}`,
                detail: "auto", // or "low" or "high"
              },
            ],
          },
        ],
      });

      aiAnalysis = response.output_text;
    } catch (error) {
      console.log("Error from analysing image using AI", error);
      aiAnalysis = "Error from analysing image using AI";
    }

    content = `FileTitle: ${title}\nFileDescription: ${description}\n\n AI Analysis:\n\n${aiAnalysis}`;
    kind = "image";
  } else if (fileType === "text/plain") {
    const textContent = await file.buffer.toString();
    content = `FileTitle: ${title}\nFileDescription: ${description}\n\n Original Content:\n\n${textContent}\n\n`;
    kind = "txt";
  } else {
    throw new Error("Unsupported file type");
  }

  // Generate chunks for all file types
  console.log("=== Generating Chunks ===");
  chunks = await generateChunksFromText(content);
  embeddingInput = chunks.chunks.map((chunk: any) => chunk.pageContent);
  console.log("Total chunks generated:", chunks.chunks.length);
  console.log(
    "First chunk preview:",
    chunks.chunks[0]?.pageContent?.substring(0, 200)
  );
  console.log(
    "Last chunk preview:",
    chunks.chunks[chunks.chunks.length - 1]?.pageContent?.substring(0, 200)
  );

  let embeddings;

  try {
    embeddings = await generateEmbeddingsFromChunks(embeddingInput);
    console.log("embeddings generated");
  } catch (error) {
    console.log("Error from generating embeddings", error);
    throw new Error("Error from generating embeddings");
  }

  return {
    kind,
    embeddings,
  };
}
