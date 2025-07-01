import FirecrawlApp, { type ScrapeResponse } from "@mendable/firecrawl-js";

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_AI_API_KEY });

/**
 * Scrapes a website and returns the markdown and html content
 * @param url - The URL of the website to scrape
 * @returns The markdown and html content of the website
 */
export async function scrapeWebsite(url: string) {
  const scrapeResult = (await app.scrapeUrl(url, {
    formats: ["markdown", "html"],
  })) as ScrapeResponse;

  if (!scrapeResult.success) {
    throw new Error(`Failed to scrape: ${scrapeResult.error}`);
  }

  console.log(scrapeResult);
  return scrapeResult;
}
