import { ResearchPlannerAgent, WebSearchAgent, ScrapingAgent, EvaluatorAgent, SummaryReportAgent } from './agents/index.js';
import { initDb } from './database/database.js';
import fs from 'fs/promises';

function createResearchFolderName(userInput) {
    const words = userInput
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0)
        .slice(0, 3);
    
    const namePrefix = words.join('-') || 'research';
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    
    return `${namePrefix}-${timestamp}`;
}

async function createResearchFolder(folderName) {
    const researchPath = `output/${folderName}`;
    await fs.mkdir(researchPath, { recursive: true });
    console.log(`Created research folder: ${researchPath}`);
    return researchPath;
}

async function main() {
    try {
        await initDb();
        console.log("Database initialized successfully.");

        console.log("\n=== STEP 1: Research Planning ===");
        const plannerAgent = new ResearchPlannerAgent();
        const { researchPlan, initialInput } = await plannerAgent.run();
        
        const folderName = createResearchFolderName(initialInput);
        const researchPath = await createResearchFolder(folderName);

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

        console.log("\n=== STEP 5: Generating Summary Report ===");
        const summaryAgent = new SummaryReportAgent();
        const summaryReport = await summaryAgent.run(scrapeResults);

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
        const filename = `summary_report_${timestamp}.md`;
        const outputPath = `${researchPath}/${filename}`;

        await fs.writeFile(outputPath, summaryReport);
        console.log("\n=== RESEARCH COMPLETE ===");
        console.log(`Summary report has been saved to '${outputPath}'`);
        console.log("\nReport preview:");
        console.log("================");
        console.log(summaryReport);

    } catch (error) {
        console.error("Error in main workflow:", error);
        process.exit(1);
    }
}

main();
