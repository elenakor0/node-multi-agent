import { Agent } from './base/agent.js';

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
     * Runs the agent.
     * @param {Array} searchResults 
     * @returns {Promise<string>}
     */
    async run(searchResults) {
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
        
        return report.trim();
    }
}
