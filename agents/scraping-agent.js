import { chromium } from 'playwright';
import { Agent } from './base/agent.js';
import fs from 'fs/promises';

/**
 * A scraping agent that extracts content from URLs using Playwright
 */
export class ScrapingAgent extends Agent {
    constructor() {
        super();
        this.browser = null;
        this.maxConcurrentPages = 3; // Limit concurrent scraping to avoid overwhelming sites
        this.requestTimeout = 30000; // 30 seconds timeout per page
    }

    /**
     * Initialize browser
     */
    async initBrowser() {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: true,
                args: ['--disable-dev-shm-usage', '--no-sandbox']
            });
        }
    }

    /**
     * Close browser
     */
    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Extract text content from a single URL
     * @param {string} url 
     * @param {string} searchTerm 
     * @returns {Promise<Object>}
     */
    async scrapeUrl(url, searchTerm) {
        let page = null;
        try {
            console.log(`Scraping: ${url}`);
            
            page = await this.browser.newPage();
            
            // Set user agent to avoid detection
            await page.setExtraHTTPHeaders({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            });
            
            // Navigate to URL with timeout
            await page.goto(url, { 
                waitUntil: 'domcontentloaded', 
                timeout: this.requestTimeout 
            });

            // Wait a bit for dynamic content to load
            await page.waitForTimeout(2000);

            // Extract main content - try multiple selectors
            const content = await page.evaluate(() => {
                // Try to find main content areas
                const selectors = [
                    'main',
                    'article', 
                    '[role="main"]',
                    '.content',
                    '.main-content',
                    '.post-content',
                    '.entry-content',
                    'body'
                ];

                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        // Remove script and style elements
                        const scripts = element.querySelectorAll('script, style, nav, header, footer, aside');
                        scripts.forEach(el => el.remove());
                        
                        let text = element.innerText || element.textContent || '';
                        text = text.replace(/\s+/g, ' ').trim();
                        
                        if (text.length > 200) { // Only return if we got substantial content
                            return text.substring(0, 3000); // Limit to 3000 chars
                        }
                    }
                }
                return '';
            });

            // Get page title
            const title = await page.title();

            return {
                url,
                search_term: searchTerm,
                title: title || '',
                content: content || '',
                scraped_at: new Date().toISOString(),
                success: true,
                error: null
            };

        } catch (error) {
            console.error(`Error scraping ${url}:`, error.message);
            return {
                url,
                search_term: searchTerm,
                title: '',
                content: '',
                scraped_at: new Date().toISOString(),
                success: false,
                error: error.message
            };
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    /**
     * Process URLs in batches to avoid overwhelming servers
     * @param {Array} urlBatch 
     * @returns {Promise<Array>}
     */
    async processBatch(urlBatch) {
        const promises = urlBatch.map(item => 
            this.scrapeUrl(item.url, item.search_term)
        );
        return await Promise.all(promises);
    }

    /**
     * Helper method to sleep
     * @param {number} ms 
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Write scraping results to a timestamped file
     * @param {Array} scrapedResults 
     * @param {string} researchPath 
     */
    async writeScrapingResults(scrapedResults, researchPath) {
        try {
            // Create timestamp for filename
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const filename = `scraping-results-${timestamp}.txt`;
            const outputPath = `${researchPath}/${filename}`;

            // Format the results for text output
            let content = `Scraping Results - ${now.toISOString()}\n`;
            content += `${'='.repeat(60)}\n\n`;
            content += `Total URLs processed: ${scrapedResults.length}\n`;
            content += `Successful scrapes: ${scrapedResults.filter(r => r.success).length}\n`;
            content += `Failed scrapes: ${scrapedResults.filter(r => !r.success).length}\n\n`;

            scrapedResults.forEach((result, index) => {
                content += `${index + 1}. ${result.url}\n`;
                content += `   Search Term: ${result.search_term}\n`;
                content += `   Success: ${result.success}\n`;
                content += `   Scraped At: ${result.scraped_at}\n`;
                
                if (result.success) {
                    content += `   Title: ${result.title || 'N/A'}\n`;
                    content += `   Content Length: ${result.content.length} characters\n`;
                    if (result.content) {
                        content += `   Content Preview: ${result.content.substring(0, 600)}${result.content.length > 600 ? '...' : ''}\n`;
                    }
                } else {
                    content += `   Error: ${result.error || 'Unknown error'}\n`;
                }
                content += `\n${'-'.repeat(50)}\n\n`;
            });

            // Add full content section for successful scrapes
            content += `\n${'='.repeat(60)}\n`;
            content += `FULL CONTENT DETAILS\n`;
            content += `${'='.repeat(60)}\n\n`;

            scrapedResults.filter(r => r.success && r.content).forEach((result, index) => {
                content += `${index + 1}. ${result.title || 'Untitled'}\n`;
                content += `   URL: ${result.url}\n`;
                content += `   Search Term: ${result.search_term}\n`;
                content += `   Content:\n`;
                content += `   ${'-'.repeat(40)}\n`;
                content += `   ${result.content}\n`;
                content += `   ${'-'.repeat(40)}\n\n`;
            });

            // Write to file
            await fs.writeFile(outputPath, content, 'utf-8');
            console.log(`Scraping results saved to: ${outputPath}`);

        } catch (error) {
            console.error('Error writing scraping results file:', error);
        }
    }

    /**
     * Runs the scraping agent
     * @param {Array} searchResults - Array of search results with url and search_term
     * @param {number} maxUrls - Maximum number of URLs to scrape (default: 10)
     * @param {string} researchPath - Path to save results
     * @returns {Promise<Array>}
     */
    async run(searchResults, maxUrls = 10, researchPath = 'output') {
        console.log(`Starting content scraping for ${Math.min(searchResults.length, maxUrls)} URLs...`);
        
        try {
            await this.initBrowser();
            
            // Filter and limit URLs
            const urlsToScrape = searchResults
                .filter(result => result.url && result.url.startsWith('http'))
                .slice(0, maxUrls)
                .map(result => ({
                    url: result.url,
                    search_term: result.search_term
                }));

            console.log(`Processing ${urlsToScrape.length} URLs in batches of ${this.maxConcurrentPages}`);

            const scrapedResults = [];
            
            // Process URLs in batches to avoid overwhelming servers
            for (let i = 0; i < urlsToScrape.length; i += this.maxConcurrentPages) {
                const batch = urlsToScrape.slice(i, i + this.maxConcurrentPages);
                console.log(`Processing batch ${Math.floor(i/this.maxConcurrentPages) + 1}/${Math.ceil(urlsToScrape.length/this.maxConcurrentPages)}`);
                
                const batchResults = await this.processBatch(batch);
                scrapedResults.push(...batchResults);
                
                // Add delay between batches to be respectful to servers
                if (i + this.maxConcurrentPages < urlsToScrape.length) {
                    console.log('Waiting 3 seconds before next batch...');
                    await this.sleep(3000);
                }
            }

            const successCount = scrapedResults.filter(r => r.success).length;
            console.log(`Scraping completed: ${successCount}/${scrapedResults.length} URLs successfully scraped`);

            // Write scraping results to file
            await this.writeScrapingResults(scrapedResults, researchPath);

            return scrapedResults;

        } catch (error) {
            console.error('Error in scraping agent:', error);
            throw error;
        } finally {
            await this.closeBrowser();
        }
    }
}
