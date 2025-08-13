import axios from 'axios';
import { Agent } from './base/agent.js';
import fs from 'fs/promises';

/**
 * A web search agent that uses the tools to search the web.
 */
export class WebSearchAgent extends Agent {
    constructor() {
        super();
        this.setInitialPrompt();
    }

    /**
     * Sets the initial prompt for the agent.
     */
    setInitialPrompt() {
        const today = new Date().toISOString().split('T')[0];
        this.messages = [
            {
                role: "system",
                content: `
                You are an expert in performing web searches.
                You will be given a research plan and you will need to derive a list of search terms that will be used to perform the search.
                The search terms should be derived from the research plan and should be as specific as possible.
                Focus on deriving impactful search terms that will help the user find the most relevant information.

                Also derive a value for the max age (freshness) of the web search results.
                Today is: ${today}

                You MUST respond with ONLY a valid JSON object in this exact format:
                {
                    "search_terms": ["term1", "term2", "term3", "term4", "term5"],
                    "freshness": "pd|pw|pm|py or YYYY-MM-DDtoYYYY-MM-DD format"
                }
                
                IMPORTANT: Generate exactly 5 search terms, no more, no less. Focus on the most impactful and diverse search terms.
                Do not include any other text, explanations, or markdown formatting.
                `
            }
        ];
    }

    /**
     * Helper method to sleep for a given number of milliseconds
     * @param {number} ms 
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Write search terms and configuration to a timestamped file
     * @param {Object} searchConfig 
     * @param {string} researchPlan 
     * @param {string} researchPath 
     */
    async writeSearchTerms(searchConfig, researchPlan, researchPath) {
        try {
            // Create timestamp for filename
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const filename = `search-terms-${timestamp}.txt`;
            const outputPath = `${researchPath}/${filename}`;

            // Format the search terms for text output
            let content = `Search Terms Configuration - ${now.toISOString()}\n`;
            content += `${'='.repeat(60)}\n\n`;
            
            content += `RESEARCH PLAN:\n`;
            content += `${'-'.repeat(20)}\n`;
            content += `${researchPlan}\n\n`;
            
            content += `SEARCH CONFIGURATION:\n`;
            content += `${'-'.repeat(25)}\n`;
            content += `Freshness: ${searchConfig.freshness}\n`;
            content += `Number of Search Terms: ${searchConfig.search_terms.length}\n\n`;
            
            content += `SEARCH TERMS:\n`;
            content += `${'-'.repeat(15)}\n`;
            searchConfig.search_terms.forEach((term, index) => {
                content += `${index + 1}. "${term}"\n`;
            });
            
            content += `\n${'='.repeat(60)}\n`;
            content += `SEARCH TERMS JSON:\n`;
            content += `${'-'.repeat(20)}\n`;
            content += JSON.stringify(searchConfig, null, 2);
            content += `\n${'='.repeat(60)}\n`;

            // Write to file
            await fs.writeFile(outputPath, content, 'utf-8');
            console.log(`Search terms saved to: ${outputPath}`);

        } catch (error) {
            console.error('Error writing search terms file:', error);
        }
    }

    /**
     * Retry search with exponential backoff
     * @param {string} searchTerm 
     * @param {Object} params 
     * @param {Object} headers 
     * @param {string} url 
     * @param {number} maxRetries 
     * @returns {Promise<Object>}
     */
    async searchWithRetry(searchTerm, params, headers, url, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.get(url, { headers, params });
                return response.data;
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    if (attempt === maxRetries) {
                        throw error; // Re-throw on final attempt
                    }
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
                    console.log(`Rate limit hit for "${searchTerm}". Retrying in ${delay/1000} seconds (attempt ${attempt}/${maxRetries})`);
                    await this.sleep(delay);
                } else {
                    throw error; // Re-throw non-rate-limit errors immediately
                }
            }
        }
    }

    /**
     * Runs the agent.
     * @param {string} researchPlan 
     * @param {string} researchPath 
     * @returns {Promise<Array>}
     */
    async run(researchPlan, researchPath = 'output') {
        console.log("Deriving search terms...");
        this.messages.push({
            role: "user",
            content: "Here's the research plan based on which you should derive search terms: " + researchPlan
        });

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: this.messages,
        });

        let searchConfig;
        try {
            const responseText = response.choices[0].message.content.trim();
            // Remove markdown code blocks if present
            const cleanedResponse = responseText.replace(/```json\n?|```\n?/g, '');
            searchConfig = JSON.parse(cleanedResponse);
            
            // Ensure we have search terms and limit to 5
            if (!searchConfig.search_terms || !Array.isArray(searchConfig.search_terms)) {
                throw new Error("Invalid search_terms format");
            }
            
            // Limit to exactly 5 search terms
            searchConfig.search_terms = searchConfig.search_terms.slice(0, 5);
            console.log(`Using ${searchConfig.search_terms.length} search terms: ${searchConfig.search_terms.join(', ')}`);
            
        } catch (error) {
            console.error("Error parsing search configuration:", error);
            console.error("Raw response:", response.choices[0].message.content);
            throw new Error("Failed to parse search configuration from AI response");
        }

        // Write search terms to file
        await this.writeSearchTerms(searchConfig, researchPlan, researchPath);
        
        const results = [];

        for (let i = 0; i < searchConfig.search_terms.length; i++) {
            const searchTerm = searchConfig.search_terms[i];
            
            // Add delay between requests to avoid rate limiting (except for first request)
            if (i > 0) {
                console.log(`Waiting 2 seconds before next search request...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            try {
                const url = "https://api.search.brave.com/res/v1/web/search";
                const headers = {
                    "Accept": "application/json",
                    "X-Subscription-Token": process.env.BRAVE_API_KEY,
                };
                const params = {
                    q: searchTerm,
                    count: 5,
                    freshness: searchConfig.freshness,
                };

                console.log(`Searching for: "${searchTerm}"`);
                const result = await this.searchWithRetry(searchTerm, params, headers, url);

                let resultCount = 0;
                if (result.web && result.web.results) {
                    const webResults = result.web.results;
                    for (const webResult of webResults) {
                        results.push({
                            search_term: searchTerm,
                            url: webResult.url,
                            description: webResult.description,
                        });
                        resultCount++;
                    }
                }

                if (result.news && result.news.results) {
                    const newsResults = result.news.results;
                    for (const newsResult of newsResults) {
                        results.push({
                            search_term: searchTerm,
                            url: newsResult.url,
                            description: newsResult.description,
                        });
                        resultCount++;
                    }
                }
                
                console.log(`Found ${resultCount} results for "${searchTerm}"`);
                
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    console.error(`Rate limit exceeded for "${searchTerm}". Consider upgrading your Brave Search API plan or waiting longer between requests.`);
                    console.log(`Waiting 10 seconds before continuing...`);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                } else {
                    console.error(`Error searching for "${searchTerm}":`, error.message);
                }
            }
        }

        return results;
    }
}
