import { Agent } from './base/agent.js';
import fs from 'fs/promises';

/**
 * An evaluator agent that assesses the relevancy of scraped content based on the research plan
 */
export class EvaluatorAgent extends Agent {
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
                You are a content relevancy evaluator agent.
                You will be given a research plan and a list of scraped content from web pages.
                Your job is to evaluate how relevant each piece of content is to the research plan.
                
                For each piece of content, you should:
                1. Analyze the content against the research plan's core topics, related topics, and objectives
                2. Consider if the content should be avoided based on the plan's exclusion criteria
                3. Assign a relevancy score from 0-10 (where 10 is highly relevant, 0 is irrelevant)
                4. Provide a brief explanation for the score
                5. Determine if the content should be included in the final summary
                
                Respond with a JSON array where each object represents one piece of content:
                {
                    "url": "original_url",
                    "relevancy_score": 8,
                    "explanation": "Brief explanation of why this score was assigned",
                    "include_in_summary": true,
                    "key_topics_found": ["topic1", "topic2"],
                    "content_quality": "high|medium|low"
                }
                
                Focus on content that directly addresses the research plan's objectives.
                Prioritize recent, authoritative, and comprehensive sources.
                `
            }
        ];
    }

    /**
     * Write evaluation results to a timestamped file
     * @param {Array} evaluationResults 
     * @param {string} researchPlan 
     * @param {string} researchPath 
     */
    async writeEvaluationResults(evaluationResults, researchPlan, researchPath) {
        try {
            // Create timestamp for filename
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const filename = `content-evaluation-${timestamp}.txt`;
            const outputPath = `${researchPath}/${filename}`;

            // Format the evaluation results for text output
            let content = `Content Relevancy Evaluation - ${now.toISOString()}\n`;
            content += `${'='.repeat(70)}\n\n`;
            
            content += `RESEARCH PLAN:\n`;
            content += `${'-'.repeat(20)}\n`;
            content += `${researchPlan}\n\n`;
            
            const totalContent = evaluationResults.length;
            const includedContent = evaluationResults.filter(r => r.include_in_summary).length;
            const avgScore = evaluationResults.reduce((sum, r) => sum + r.relevancy_score, 0) / totalContent;
            
            content += `EVALUATION SUMMARY:\n`;
            content += `${'-'.repeat(25)}\n`;
            content += `Total Content Pieces Evaluated: ${totalContent}\n`;
            content += `Content Included in Summary: ${includedContent}\n`;
            content += `Content Excluded: ${totalContent - includedContent}\n`;
            content += `Average Relevancy Score: ${avgScore.toFixed(2)}/10\n\n`;
            
            // Sort by relevancy score (highest first)
            const sortedResults = [...evaluationResults].sort((a, b) => b.relevancy_score - a.relevancy_score);
            
            content += `DETAILED EVALUATION RESULTS:\n`;
            content += `${'-'.repeat(35)}\n\n`;
            
            sortedResults.forEach((result, index) => {
                content += `${index + 1}. RELEVANCY SCORE: ${result.relevancy_score}/10\n`;
                content += `   URL: ${result.url}\n`;
                content += `   Include in Summary: ${result.include_in_summary ? 'YES' : 'NO'}\n`;
                content += `   Content Quality: ${result.content_quality.toUpperCase()}\n`;
                if (result.key_topics_found && result.key_topics_found.length > 0) {
                    content += `   Key Topics Found: ${result.key_topics_found.join(', ')}\n`;
                }
                content += `   Explanation: ${result.explanation}\n`;
                content += `\n${'-'.repeat(60)}\n\n`;
            });
            
            content += `${'='.repeat(70)}\n`;
            content += `EVALUATION RESULTS JSON:\n`;
            content += `${'-'.repeat(30)}\n`;
            content += JSON.stringify(sortedResults, null, 2);
            content += `\n${'='.repeat(70)}\n`;

            // Write to file
            await fs.writeFile(outputPath, content, 'utf-8');
            console.log(`Content evaluation results saved to: ${outputPath}`);

        } catch (error) {
            console.error('Error writing evaluation results file:', error);
        }
    }

    /**
     * Evaluates the relevancy of scraped content based on the research plan
     * @param {Array} scrapedContent - Array of scraped content objects
     * @param {string} researchPlan - The original research plan
     * @param {string} researchPath - Path to save results
     * @returns {Promise<Array>} - Array of evaluation results
     */
    async run(scrapedContent, researchPlan, researchPath = 'output') {
        console.log(`Evaluating relevancy of ${scrapedContent.length} scraped content pieces...`);
        
        try {
            // Filter only successful scrapes with content
            const contentToEvaluate = scrapedContent.filter(item => 
                item.success && 
                item.content && 
                item.content.trim().length > 100 // Only evaluate substantial content
            );

            if (contentToEvaluate.length === 0) {
                console.log("No substantial content found to evaluate.");
                return [];
            }

            console.log(`Evaluating ${contentToEvaluate.length} pieces of substantial content...`);

            // Prepare content summaries for evaluation (use preview + title)
            const contentSummaries = contentToEvaluate.map(item => ({
                url: item.url,
                title: item.title || 'No title',
                content_preview: item.content.substring(0, 800), // Use more than the 600 char preview
                search_term: item.search_term
            }));

            // Create evaluation prompt
            const evaluationPrompt = `
RESEARCH PLAN:
${researchPlan}

CONTENT TO EVALUATE:
${JSON.stringify(contentSummaries, null, 2)}

Please evaluate each piece of content against the research plan and return the evaluation results in the specified JSON format.
            `;

            // Get evaluation from AI
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    ...this.messages,
                    { role: "user", content: evaluationPrompt }
                ],
            });

            let evaluationResults;
            try {
                const responseText = response.choices[0].message.content.trim();
                // Remove markdown code blocks if present
                const cleanedResponse = responseText.replace(/```json\n?|```\n?/g, '');
                evaluationResults = JSON.parse(cleanedResponse);
            } catch (error) {
                console.error("Error parsing evaluation results:", error);
                console.error("Raw response:", response.choices[0].message.content);
                throw new Error("Failed to parse evaluation results from AI response");
            }

            // Add original scraped data to evaluation results
            const enrichedResults = evaluationResults.map(evalResult => {
                const originalData = scrapedContent.find(item => item.url === evalResult.url);
                return {
                    ...originalData,
                    ...evalResult
                };
            });

            // Write evaluation results to file
            await this.writeEvaluationResults(evaluationResults, researchPlan, researchPath);

            const includedCount = evaluationResults.filter(r => r.include_in_summary).length;
            const avgScore = evaluationResults.reduce((sum, r) => sum + r.relevancy_score, 0) / evaluationResults.length;
            
            console.log(`Evaluation completed:`);
            console.log(`- Average relevancy score: ${avgScore.toFixed(2)}/10`);
            console.log(`- Content pieces included: ${includedCount}/${evaluationResults.length}`);
            console.log(`- Content pieces excluded: ${evaluationResults.length - includedCount}/${evaluationResults.length}`);

            return enrichedResults;

        } catch (error) {
            console.error('Error in evaluator agent:', error);
            throw error;
        }
    }
}
