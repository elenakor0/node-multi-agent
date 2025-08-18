import { Agent } from './base/agent.js';
import fs from 'fs/promises';
import { chromium } from 'playwright';

export class UrlSummarizerAgent extends Agent {
    constructor() {
        super();
        this.setInitialPrompt();
    }

    /**
     * Sets the initial prompt for the agent.
     */
    setInitialPrompt() {
        this.messages = [
            {
                role: "system",
                content: `
                You are a URL content summarizer agent.
                You will be given the content scraped from a web page and need to create a comprehensive summary.
                
                Your summary should:
                - Capture the main points and key information
                - Be well-structured with clear headings
                - Include the most important details
                - Be concise but comprehensive
                - Maintain the original context and meaning
                - Be written in a professional, easy-to-read format
                
                Format the summary in Markdown with clear sections and bullet points where appropriate.
                Include the source URL at the top of the summary.
                Do not include any meta-commentary, just return the summary content.
                `
            }
        ];
    }

    /**
     * Scrapes content from a URL using Playwright
     * @param {string} url - The URL to scrape
     * @returns {Promise<Object>} Object containing scraped content and metadata
     */
    async scrapeUrl(url) {
        let browser = null;
        try {
            console.log(`Scraping content from: ${url}`);
            
            browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            });
            
            const page = await context.newPage();
            
            // Set a reasonable timeout
            await page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            
            // Wait a bit for dynamic content to load
            await page.waitForTimeout(2000);
            
            // Extract content
            const content = await page.evaluate(() => {
                // Remove script and style elements
                const scripts = document.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar');
                scripts.forEach(el => el.remove());
                
                // Try to find main content areas
                const contentSelectors = [
                    'article',
                    'main',
                    '.content',
                    '.post-content',
                    '.entry-content',
                    '.article-content',
                    '.story-body',
                    '#content',
                    '.main-content'
                ];
                
                let mainContent = '';
                
                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        mainContent = element.innerText;
                        break;
                    }
                }
                
                // Fallback to body content if no specific content area found
                if (!mainContent) {
                    mainContent = document.body.innerText;
                }
                
                // Get title
                const title = document.querySelector('title')?.innerText || 
                             document.querySelector('h1')?.innerText || 
                             'No title found';
                
                // Get meta description
                const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
                
                return {
                    title: title.trim(),
                    content: mainContent.trim(),
                    description: metaDescription.trim()
                };
            });
            
            await browser.close();
            
            if (!content.content || content.content.length < 100) {
                throw new Error("Insufficient content extracted from the URL");
            }
            
            console.log(`Successfully scraped ${content.content.length} characters from the page`);
            
            return {
                success: true,
                url,
                title: content.title,
                content: content.content,
                description: content.description,
                contentLength: content.content.length
            };
            
        } catch (error) {
            if (browser) {
                await browser.close();
            }
            console.error("Error scraping URL:", error);
            return {
                success: false,
                url,
                error: error.message
            };
        }
    }

    /**
     * Creates a summary folder
     * @param {string} url - The URL being summarized
     * @returns {Promise<string>} The created folder path
     */
    async createSummaryFolder(url) {
        try {
            // Extract domain and create a clean folder name
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace(/^www\./, '');
            const cleanDomain = domain.replace(/[^a-z0-9]/g, '-');
            
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const folderName = `url-summary-${cleanDomain}-${timestamp}`;
            const summaryFolderPath = `output/${folderName}`;

            await fs.mkdir(summaryFolderPath, { recursive: true });
            console.log(`Created summary folder: ${summaryFolderPath}`);
            return summaryFolderPath;
        } catch (error) {
            console.error('Error creating summary folder:', error);
            throw error;
        }
    }

    /**
     * Writes summary to file
     * @param {string} summary - The summary content
     * @param {string} folderPath - The folder path to save the summary
     * @param {Object} metadata - Additional metadata about the URL
     * @returns {Promise<string>} The path where the summary was saved
     */
    async writeSummaryToFile(summary, folderPath, metadata) {
        try {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const filename = `url_summary_${timestamp}.md`;
            const outputPath = `${folderPath}/${filename}`;

            // Add metadata header to the summary
            const fullSummary = `# URL Summary

**Source URL:** ${metadata.url}  
**Title:** ${metadata.title}  
**Generated:** ${new Date().toLocaleString()}  
**Content Length:** ${metadata.contentLength} characters

---

${summary}`;

            await fs.writeFile(outputPath, fullSummary, 'utf-8');
            console.log(`Summary saved to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Error writing summary file:', error);
            throw error;
        }
    }

    /**
     * Main method to summarize a URL
     * @param {string} url - The URL to summarize
     * @returns {Promise<Object>} Object containing summary results
     */
    async run(url) {
        try {
            console.log(`\n=== STARTING URL SUMMARIZATION ===`);
            console.log(`URL: ${url}`);

            // Validate URL
            try {
                new URL(url);
            } catch (urlError) {
                throw new Error(`Invalid URL provided: ${url}`);
            }

            // Create folder for the summary
            const summaryFolderPath = await this.createSummaryFolder(url);

            // Scrape content from the URL
            const scrapedData = await this.scrapeUrl(url);
            
            if (!scrapedData.success) {
                throw new Error(`Failed to scrape URL: ${scrapedData.error}`);
            }

            // Generate summary using AI
            console.log("Generating summary from scraped content...");
            
            const summaryPrompt = `Please create a comprehensive summary of the following web content:

URL: ${url}
Title: ${scrapedData.title}
Content Length: ${scrapedData.contentLength} characters

CONTENT:
${scrapedData.content.substring(0, 8000)} ${scrapedData.content.length > 8000 ? '...[truncated]' : ''}

Create a well-structured summary that captures the main points and key information from this content.`;

            this.messages.push({ role: "user", content: summaryPrompt });

            const response = await this.chatCompletion(this.messages, {
                model: this.model
            });

            const summary = response.content.trim();

            // Save summary to file
            const summaryPath = await this.writeSummaryToFile(summary, summaryFolderPath, scrapedData);

            console.log("\n=== URL SUMMARIZATION COMPLETE ===");
            console.log(`Summary saved to: ${summaryPath}`);
            console.log(`Word count: ${summary.split(' ').length} words`);

            return {
                success: true,
                summaryPath,
                folderPath: summaryFolderPath,
                url,
                title: scrapedData.title,
                summary,
                wordCount: summary.split(' ').length,
                originalContentLength: scrapedData.contentLength
            };

        } catch (error) {
            console.error('Error in URL summarizer agent:', error);
            return {
                success: false,
                error: error.message,
                url
            };
        }
    }
}
