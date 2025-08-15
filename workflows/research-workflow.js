import { ResearchPlannerAgent, WebSearchAgent, ScrapingAgent, EvaluatorAgent, ArticleWriterAgent, SummaryReportAgent } from '../agents/index.js';
import { createResearchFolderName, createResearchFolder } from '../utils/index.js';

export const runResearchWorkflow = async (topic, outputType, initialInput, rl) => {
    try {
        console.log("\n=== STARTING RESEARCH WORKFLOW ===");
        console.log(`Research Topic: ${topic}`);
        console.log(`Output Type: ${outputType}`);

        const folderName = await createResearchFolderName(initialInput);
        const researchPath = await createResearchFolder(folderName);

        console.log("\n=== STEP 1: Research Planning ===");
        const plannerAgent = new ResearchPlannerAgent();
        const { researchPlan } = await plannerAgent.run(topic, rl);

        console.log("\n=== STEP 2: Web Search ===");
        const searchAgent = new WebSearchAgent();
        const searchResults = await searchAgent.run(researchPlan, researchPath);
        console.log(`Found ${searchResults.length} search results.`);

        console.log("\n=== STEP 3: Content Scraping ===");
        const scrapingAgent = new ScrapingAgent();
        const scrapedContent = await scrapingAgent.run(searchResults, 8, researchPath);
        console.log(`Successfully scraped ${scrapedContent.filter(c => c.success).length} pages.`);

        console.log("\n=== STEP 4: Content Relevancy Evaluation ===");
        const evaluatorAgent = new EvaluatorAgent();
        const evaluatedContent = await evaluatorAgent.run(scrapedContent, researchPlan, researchPath);
        
        const scrapeResults = evaluatedContent.filter(content => content.include_in_summary);
        console.log(`${scrapeResults.length} pieces of content selected for final summary.`);

        if (outputType === 'article') {
            console.log("\n=== STEP 5: Generating Research Article ===");
            const articleWriter = new ArticleWriterAgent();
            const articleResult = await articleWriter.run(scrapeResults, researchPath);

            console.log("\n=== RESEARCH COMPLETE ===");
            console.log(`Research article has been saved to '${articleResult.articlePath}'`);
            if (articleResult.imagePath) {
                console.log(`Article image has been saved to '${articleResult.imagePath}'`);
            }
            console.log(`Article title: "${articleResult.title}"`);
            console.log(`Word count: ${articleResult.wordCount} words`);
            console.log("\nArticle preview:");
            console.log("================");
            console.log(articleResult.article.substring(0, 500) + "...");
        } else {
            console.log("\n=== STEP 5: Generating Summary Report ===");
            const summaryAgent = new SummaryReportAgent();
            const summaryResult = await summaryAgent.run(scrapeResults, researchPath);

            console.log("\n=== RESEARCH COMPLETE ===");
            console.log(`Research summary has been saved to '${summaryResult.summaryPath}'`);
            console.log(`Word count: ${summaryResult.wordCount} words`);
            console.log("\nSummary preview:");
            console.log("================");
            console.log(summaryResult.summary.substring(0, 500) + "...");
        }

    } catch (error) {
        console.error("Error in research workflow:", error);
        throw error;
    }
};
