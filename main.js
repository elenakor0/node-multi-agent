import { initDb } from './database/database.js';
import { runResearchWorkflow, runImageGenerationWorkflow, runUrlSummarizationWorkflow } from './workflows/index.js';
import { aiProviderManager } from './ai-providers/index.js';
import { AI_PROVIDER_CONFIG, getProviderConfig } from './ai-provider-config.js';
import fs from 'fs/promises';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});




const availableTools = [
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
                        enum: ["professional", "artistic", "minimalist", "realistic", "abstract", "callToAction"],
                        description: "The style of the image to generate. Use 'callToAction' for buttons, CTAs, or clickable elements (default: professional)"
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

const getUserInput = async (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.trim());
        });
    });
}

const routeUserRequest = async (userInput) => {
    try {
        const messages = [
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
- Available styles: professional (default), artistic, minimalist, realistic, abstract, callToAction
- Use "callToAction" style for: buttons, call-to-action elements, CTAs, clickable buttons, sign-up buttons, download buttons, or any image meant to be clicked
- If no style is specified, default to "professional"
- If the request mentions "button", "call-to-action", "CTA", "clickable", or similar terms, use "callToAction" style

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
- "Create a call-to-action button for chat" → generate_image: topic: "call-to-action button for chat", style: "callToAction"
- "Generate a button that says Start Now" → generate_image: topic: "button that says Start Now", style: "callToAction"
- "Make a clickable download button" → generate_image: topic: "clickable download button", style: "callToAction"

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
        ];

        const response = await aiProviderManager.chatCompletionWithTools(messages, availableTools, {
            model: "gpt-4",
            toolChoice: "auto"
        });

        return {
            content: response.content,
            tool_calls: response.toolCalls
        };
    } catch (error) {
        console.error("Error routing request:", error);
        return { content: "I encountered an error processing your request. Please try again." };
    }
}

const handleGeneralChat = async (userInput) => {
    try {
        const messages = [
            {
                role: "system",
                content: "You are a helpful assistant. Provide brief, helpful responses to general questions. If the user asks about research topics, suggest they ask you to research the topic for comprehensive results."
            },
            {
                role: "user",
                content: userInput
            }
        ];

        const response = await aiProviderManager.chatCompletion(messages, {
            model: "gpt-4"
        });

        return response.content;
    } catch (error) {
        console.error("Error in general chat:", error);
        return "I encountered an error. Please try again.";
    }
}



const main = async () => {
    try {
        await initDb();
        
        // AI PROVIDER CONFIGURATION
        const config = getProviderConfig();
        
        if (config.mode === 'manual') {
            // Use hardcoded provider from config file
            const providerConfig = config.providers[config.forcedProvider] || {};
            await aiProviderManager.initializeSingleProvider(config.forcedProvider, providerConfig);
        } else {
            // Use automatic provider detection
            await aiProviderManager.initializeProviders();
        }
        
        console.log("Multi-Agent Research System Initialized");
        console.log("=====================================");
        console.log("Ask me anything! I can:");
        console.log("• Conduct research on topics");
        console.log("  - Generate research summaries (default)");
        console.log("  - Write full articles with AI-generated images");
        console.log("• Generate AI images on any topic");
        console.log("  - Professional, artistic, minimalist, realistic, or abstract styles");
        console.log("• Summarize content from any URL or web page");
        console.log("  - Extracts and summarizes web content automatically");
        console.log("• Answer general questions");     
        console.log("\nExamples:");      
        console.log("• 'Write an article about things to do in Copenhagen' (generates full article)");
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
                    // For call-to-action buttons, use the original user input to preserve all details
                    const topic = (args.style === "callToAction") ? userInput : args.topic;
                    await runImageGenerationWorkflow(topic, args.style || "professional");
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
