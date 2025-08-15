import { UrlSummarizerAgent } from '../agents/index.js';

export const runUrlSummarizationWorkflow = async (url) => {
    try {
        console.log("\n=== STARTING URL SUMMARIZATION ===");
        console.log(`URL: ${url}`);

        const urlSummarizer = new UrlSummarizerAgent();
        const result = await urlSummarizer.run(url);

        if (result.success) {
            console.log("\n=== URL SUMMARIZATION COMPLETE ===");
            console.log(`Summary saved to: ${result.summaryPath}`);
            console.log(`Folder: ${result.folderPath}`);
            console.log(`Original content: ${result.originalContentLength} characters`);
            console.log(`Summary: ${result.wordCount} words`);
            console.log(`\nSummary preview:`);
            console.log("================");
            console.log(result.summary.substring(0, 500) + "...");
        } else {
            console.log("\n=== URL SUMMARIZATION FAILED ===");
            console.log(`Error: ${result.error}`);
        }

        return result;

    } catch (error) {
        console.error("Error in URL summarization workflow:", error);
        throw error;
    }
};
