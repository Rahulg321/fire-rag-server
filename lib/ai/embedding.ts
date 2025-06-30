import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { encoding_for_model } from "tiktoken";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const embeddingModel = openai.embedding("text-embedding-ada-002");

/**
 * This function is used to split the sheets into chunks of text based on the maxRowsPerChunk
 * It will return an array of objects with the sheet name and the text of the chunk
 *
 * @param sheets - The sheets to split into chunks
 * @param maxRowsPerChunk - The maximum number of rows per chunk
 * @returns An array of objects with the sheet name and the text of the chunk
 */
export function rowsToTextChunks(
  sheets: Record<string, any[][]>,
  maxRowsPerChunk = 20
) {
  const chunks: { sheet: string; text: string }[] = [];

  for (const [sheetName, rows] of Object.entries(sheets)) {
    for (let i = 0; i < rows.length; i += maxRowsPerChunk) {
      const slice = rows.slice(i, i + maxRowsPerChunk);
      const text = slice
        .map((row, idx) => `Row ${i + idx + 1}: ${row.map(String).join(" | ")}`)
        .join("\n");
      chunks.push({ sheet: sheetName, text });
    }
  }

  return chunks;
}

/**
 * This function is used to generate embeddings from chunks of text
 * It will return an array of objects with the embedding and the content
 *
 * @param chunks - The chunks of text to generate embeddings from
 * @returns An array of objects with the embedding and the content
 */
export const generateEmbeddingsFromChunks = async (
  chunks: string[]
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const encoder = encoding_for_model("text-embedding-3-small");
  const maxTokens = 300000;
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentTokenCount = 0;

  for (const chunk of chunks) {
    const tokens = encoder.encode(chunk);
    if (
      currentTokenCount + tokens.length > maxTokens &&
      currentBatch.length > 0
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentTokenCount = 0;
    }
    currentBatch.push(chunk);
    currentTokenCount += tokens.length;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  let allEmbeddings: Array<{ embedding: number[]; content: string }> = [];
  for (const batch of batches) {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batch,
    });
    allEmbeddings = allEmbeddings.concat(
      embeddings.map((e, i) => ({ content: batch[i]!, embedding: e }))
    );
  }
  encoder.free();
  return allEmbeddings;
};

export async function generateChunksFromText(text: string) {
  const encoder = encoding_for_model("text-embedding-3-small");

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000, // Maximum tokens per chunk
    chunkOverlap: 200, // 20% overlap to preserve context
    separators: ["\n\n", "\n", " ", ""], // Logical split points
    lengthFunction: (text) => {
      const tokens = encoder.encode(text);
      return tokens.length;
    },
  });

  // Split the text into chunks
  const chunks = await textSplitter.createDocuments([text]);

  encoder.free();

  console.log("Chunks generated:", chunks);

  return { chunks };
}
