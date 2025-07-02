import {
  generateChunksFromText,
  generateEmbeddingsFromChunks,
} from "../ai/embedding";

/**
 * Generate embeddings from content
 * @param content - The content to generate embeddings from
 * @returns The embeddings
 */
export async function generateEmbeddingsFromContent(content: string) {
  const chunks = await generateChunksFromText(content);
  const embeddingInput = chunks.chunks.map((chunk: any) => chunk.pageContent);

  let embeddings;

  try {
    embeddings = await generateEmbeddingsFromChunks(embeddingInput);
  } catch (error) {
    throw new Error("Error from generating embeddings");
  }

  return {
    embeddings,
  };
}
