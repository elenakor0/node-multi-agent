import { Agent } from './base/agent.js';
import fs from 'fs/promises';

/**
 * A summary report agent that uses the tools to summarize the search results.
 */
export class SummaryReportAgent extends Agent {
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
                You are a summary report agent.
                You will be given a list of search results that include both short descriptions and full scraped content from web pages.
                Create a comprehensive summary report that synthesizes information from both the descriptions and the full content.
                
                For each piece of information, prioritize the scraped content when available as it's more complete than the description.
                The report should be well-structured, informative, and easy to understand.
                It's important that your report includes source URLs (next to the relevant text) so users can dive deeper.
                
                The report should be in Markdown format with clear headings and sections.
                Avoid extra explanations, annotations or meta-commentary, just return the markdown report.
                `
            }
        ];
    }

    /**
     * Writes summary to file
     * @param {string} summary The summary content
     * @param {string} researchPath The path to save the summary
     * @returns {Promise<string>} The path where the summary was saved
     */
    async writeSummaryToFile(summary, researchPath) {
        try {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const filename = `research_summary_${timestamp}.md`;
            const outputPath = `${researchPath}/${filename}`;

            await fs.writeFile(outputPath, summary, 'utf-8');
            console.log(`Summary saved to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Error writing summary file:', error);
            throw error;
        }
    }

    /**
     * Runs the agent.
     * @param {Array} searchResults 
     * @param {string} researchPath Optional path to save the summary file
     * @returns {Promise<Object|string>} Summary content and file path if researchPath provided, otherwise just the summary content
     */
    async run(searchResults, researchPath = null) {
        console.log("Summarizing search results...");
        this.messages.push({
            role: "user",
            content: "Please create a summary (and keep the links!) based on these search results: " + JSON.stringify(searchResults, null, 2)
        });

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: this.messages,
        });

        let report = response.choices[0].message.content;
        
        // Clean up markdown code blocks if present
        if (report.startsWith("```markdown")) {
            report = report.substring(11);
        }
        if (report.endsWith("```")) {
            report = report.substring(0, report.length - 3);
        }
        
        const summary = report.trim();

        // If researchPath is provided, save to file and return both content and path
        if (researchPath) {
            const summaryPath = await this.writeSummaryToFile(summary, researchPath);
            return {
                summary,
                summaryPath,
                wordCount: summary.split(' ').length
            };
        }

        // Otherwise just return the summary content
        return summary;
    }
}
