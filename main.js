import { ResearchPlannerAgent, WebSearchAgent, ScrapingAgent, EvaluatorAgent, ArticleWriterAgent, SummaryReportAgent, ImageGeneratorAgent, UrlSummarizerAgent } from './agents/index.js';
import { initDb } from './database/database.js';
import fs from 'fs/promises';
import OpenAI from 'openai';
import readline from 'readline';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createResearchFolderName(userInput) {
    try {
        console.log("Generating descriptive folder name...");
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a folder naming assistant. Create a descriptive folder name based on the user's research request.
                    
                    Rules:
                    - Maximum 5 words
                    - Use lowercase
                    - Separate words with dashes
                    - Be descriptive and concise
                    - Focus on the main research topic/theme
                    - No special characters except dashes
                    - Return ONLY the folder name, nothing else
                    
                    Examples:
                    "Research climate change effects" → "climate-change-effects"
                    "Write an article about renewable energy" → "renewable-energy-article"
                    "Investigate cryptocurrency market trends" → "cryptocurrency-market-trends"
                    "Study artificial intelligence in healthcare" → "ai-healthcare-research"`
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        });

        let folderName = completion.choices[0].message.content.trim().toLowerCase();
        
        // Clean up the response - remove quotes, extra spaces, and ensure only valid characters
        folderName = folderName
            .replace(/['"]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        // Fallback if AI response is invalid
        if (!folderName || folderName.length === 0) {
            folderName = userInput
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 0)
                .slice(0, 3)
                .join('-') || 'research';
        }
        
        // Add timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
        
        return `${folderName}-${timestamp}`;
        
    } catch (error) {
        console.error("Error generating folder name:", error);
        
        // Fallback to original logic
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
}

async function createResearchFolder(folderName) {
    const researchPath = `output/${folderName}`;
    await fs.mkdir(researchPath, { recursive: true });
    console.log(`Created research folder: ${researchPath}`);
    return researchPath;
}

const researchTools = [
    {
        type: "function",
        function: {
            name: "start_research",
            description: "Start a comprehensive research project on a specific topic. Use this when the user wants to research, investigate, analyze, or learn about a topic in depth.",
            parameters: {
                type: "object",
                properties: {
                    topic: {
                        type: "string",
                        description: "The research topic or question the user wants to investigate"
                    },
                    output_type: {
                        type: "string",
                        enum: ["article", "summary"],
                        description: "The type of output to generate: 'article' for a comprehensive 3-page article with an AI-generated image, or 'summary' for a concise summary report"
                    }
                },
                required: ["topic", "output_type"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_image",
            description: "Generate an AI image for a specific topic. Use this when the user wants to create, generate, or make an image about a topic.",
            parameters: {
                type: "object",
                properties: {
                    topic: {
                        type: "string",
                        description: "The topic or description for the image to generate"
                    },
                    style: {
                        type: "string",
                        enum: ["professional", "artistic", "minimalist", "realistic", "abstract"],
                        description: "The style of the image to generate (default: professional)"
                    }
                },
                required: ["topic"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "summarize_url",
            description: "Summarize the content of a web page from a URL. Use this when the user wants to summarize, analyze, or get a summary of content from a specific URL or web page.",
            parameters: {
                type: "object",
                properties: {
                    url: {
                        type: "string",
                        description: "The URL of the web page to summarize"
                    }
                },
                required: ["url"]
            }
        }
    }
];

async function getUserInput(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function routeUserRequest(userInput) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a request router. Analyze the user's request and determine if they want to:
1. Conduct research on a topic (use the start_research function)
2. Generate an AI image (use the generate_image function)  
3. Summarize a URL/web page (use the summarize_url function)
4. Have a general conversation

If the user wants to research, investigate, analyze, study, or learn about a specific topic in depth, use the start_research function.
When using the start_research function, you must also determine what type of output they want:
- "article" - for a comprehensive 3-page article with an AI-generated image
- "summary" - for a concise summary report

Look for keywords that indicate their preference:
- Article indicators: "write an article", "comprehensive article", "detailed article", "full article", "with image"
- Summary indicators: "summarize", "summary", "brief overview", "quick summary", "just a summary"
- If no preference is specified, default to "summary"

If the user wants to generate, create, or make an image, use the generate_image function.
Look for image generation indicators:
- "generate an image", "create an image", "make an image", "draw", "illustrate", "picture of"
- Available styles: professional (default), artistic, minimalist, realistic, abstract
- If no style is specified, default to "professional"

If the user wants to summarize content from a specific URL or web page, use the summarize_url function.
Look for URL summarization indicators:
- "summarize this URL", "summarize this link", "summarize this website", "summarize this page"
- "please summarize [URL]", "analyze this URL", "what does this article say"
- Any request that includes a URL (http://, https://, www.) and mentions summarizing

If they're asking for general information, weather, casual conversation, or anything that doesn't require research, image generation, or URL summarization, respond directly without using any functions.

Examples of research requests:
- "I want to research renewable energy" → start_research: topic: "renewable energy", output_type: "summary"
- "Write a comprehensive article about cryptocurrency trends" → start_research: topic: "cryptocurrency trends", output_type: "article"
- "Research the history of jazz music and create an article with an image" → start_research: topic: "history of jazz music", output_type: "article"
- "Can you summarize the effects of climate change?" → start_research: topic: "effects of climate change", output_type: "summary"

Examples of image generation requests:
- "Please generate an image for renewable energy" → generate_image: topic: "renewable energy", style: "professional"
- "Create an artistic image of a sunset" → generate_image: topic: "sunset", style: "artistic"
- "Make a minimalist picture of modern architecture" → generate_image: topic: "modern architecture", style: "minimalist"
- "Generate an image about space exploration" → generate_image: topic: "space exploration", style: "professional"

Examples of URL summarization requests:
- "Please summarize this URL https://example.com/article" → summarize_url: url: "https://example.com/article"
- "Can you summarize this website: www.news.com/story" → summarize_url: url: "www.news.com/story"
- "Summarize this article https://blog.example.com/post" → summarize_url: url: "https://blog.example.com/post"
- "What does this page say? https://example.org/content" → summarize_url: url: "https://example.org/content"

Examples of general requests:
- "What's the weather today?"
- "Tell me a joke"
- "How are you?"
- "What's 2+2?"
- "Hello"`
                },
                {
                    role: "user",
                    content: userInput
                }
            ],
            tools: researchTools,
            tool_choice: "auto"
        });

        return completion.choices[0].message;
    } catch (error) {
        console.error("Error routing request:", error);
        return { content: "I encountered an error processing your request. Please try again." };
    }
}

async function handleGeneralChat(userInput) {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Provide brief, helpful responses to general questions. If the user asks about research topics, suggest they ask you to research the topic for comprehensive results."
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error in general chat:", error);
        return "I encountered an error. Please try again.";
    }
}

async function runResearchWorkflow(topic, outputType, initialInput, rl) {
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
}

async function runImageGenerationWorkflow(topic, style = "professional") {
    try {
        console.log("\n=== STARTING IMAGE GENERATION ===");
        console.log(`Topic: ${topic}`);
        console.log(`Style: ${style}`);

        const imageGenerator = new ImageGeneratorAgent();
        const result = await imageGenerator.run(topic, style);

        if (result.success) {
            console.log("\n=== IMAGE GENERATION COMPLETE ===");
            console.log(`Image saved to: ${result.imagePath}`);
            console.log(`Folder: ${result.folderPath}`);
            console.log(`Style: ${result.style}`);
        } else {
            console.log("\n=== IMAGE GENERATION FAILED ===");
            console.log(`Error: ${result.error}`);
        }

        return result;

    } catch (error) {
        console.error("Error in image generation workflow:", error);
        throw error;
    }
}

async function runUrlSummarizationWorkflow(url) {
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
}

async function main() {
    try {
        await initDb();
        console.log("Multi-Agent Research System Initialized");
        console.log("=====================================");
        console.log("Ask me anything! I can:");
        console.log("• Conduct comprehensive research on topics");
        console.log("  - Generate research summaries (default)");
        console.log("  - Write full articles with AI-generated images");
        console.log("• Generate AI images on any topic");
        console.log("  - Professional, artistic, minimalist, realistic, or abstract styles");
        console.log("• Summarize content from any URL or web page");
        console.log("  - Extracts and summarizes web content automatically");
        console.log("• Answer general questions");
        console.log("• Have casual conversations");
        console.log("\nExamples:");
        console.log("• 'Research climate change' (generates summary)");
        console.log("• 'Write an article about renewable energy' (generates full article)");
        console.log("• 'Generate an image for space exploration' (creates professional image)");
        console.log("• 'Create an artistic image of a sunset' (creates artistic style image)");
        console.log("• 'Please summarize this URL https://example.com/article' (summarizes web content)");
        console.log("• 'Summarize artificial intelligence trends' (generates research summary)");
        console.log("\nType 'exit' to quit.\n");

        while (true) {
            const userInput = await getUserInput("You: ");
            
            if (userInput.toLowerCase() === 'exit') {
                console.log("Goodbye!");
                break;
            }

            if (!userInput) {
                console.log("Please enter a question or request.");
                continue;
            }

            console.log("\nProcessing your request...\n");

            const routedMessage = await routeUserRequest(userInput);

            if (routedMessage.tool_calls && routedMessage.tool_calls.length > 0) {
                const toolCall = routedMessage.tool_calls[0];
                
                if (toolCall.function.name === "start_research") {
                    const args = JSON.parse(toolCall.function.arguments);
                    await runResearchWorkflow(args.topic, args.output_type, userInput, rl);
                } else if (toolCall.function.name === "generate_image") {
                    const args = JSON.parse(toolCall.function.arguments);
                    await runImageGenerationWorkflow(args.topic, args.style || "professional");
                } else if (toolCall.function.name === "summarize_url") {
                    const args = JSON.parse(toolCall.function.arguments);
                    await runUrlSummarizationWorkflow(args.url);
                }
            } else {
                if (routedMessage.content && routedMessage.content.toLowerCase().includes("i can't do it")) {
                    console.log("Assistant: I can't do it");
                } else {
                    const response = await handleGeneralChat(userInput);
                    console.log(`Assistant: ${response}`);
                }
            }

            console.log("\n" + "=".repeat(50) + "\n");
        }

    } catch (error) {
        console.error("Error in main application:", error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
