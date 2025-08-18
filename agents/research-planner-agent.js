import readline from 'readline';
import { Agent } from './base/agent.js';
import { StoreResearchPlanTool, GetResearchPlansTool, DeleteResearchPlanTool } from '../tools/index.js';

/**
 * A research planner agent that uses the tools to plan a research project.
 */
export class ResearchPlannerAgent extends Agent {
    constructor() {
        super();
        this.registerTool(new StoreResearchPlanTool());
        this.registerTool(new GetResearchPlansTool());
        this.registerTool(new DeleteResearchPlanTool());
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
                You are a research planner agent. You are tasked with helping the user plan a web research project.
                The user will provide you with a research task and your job is to create a research plan together with the user.
                Your job is NOT to answer the user's question. Instead, you MUST help them build a good research plan that can then be handed off to some other agent to execute.
                The research plan should include things like:
                    - Core topics to be researched                    
                    - Topics that should be avoided
                    - Time frame for web research (maximum age of the web search results)
                `
            }
        ];
    }

    /**
     * Creates a readline interface for user input
     * @returns {Object}
     */
    createReadlineInterface() {
        return readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Prompts for user input
     * @param {Object} rl 
     * @param {string} question 
     * @returns {Promise<string>}
     */
    question(rl, question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    /**
     * Runs the agent with automated topic-based planning.
     * @param {string} topic - The research topic
     * @returns {Promise<Object>}
     */
    async runWithTopic(topic) {
        try {
            console.log(`Creating research plan for topic: "${topic}"`);
            
            // Create a research plan based on the topic
            const planningPrompt = `Create a research plan for the topic: "${topic}". 
            The plan should include:
            - Core topics to be researched
            - Topics that should be avoided
            - Time frame for web research (maximum age of results)
            
            Please provide a clear, structured research plan.`;
            
            this.messages.push({ role: "user", content: planningPrompt });
            
            const response = await this.chatCompletion(this.messages, {
                model: this.model
            });
            
            const researchPlan = response.content;
            console.log("Generated research plan:");
            console.log(researchPlan);
            
            return { researchPlan, initialInput: topic };
            
        } catch (error) {
            console.error("Error in ResearchPlannerAgent.runWithTopic:", error);
            throw error;
        }
    }

    /**
     * Runs the agent.
     * @param {string} topic - Optional research topic to start with
     * @param {Object} rl - Readline interface to use for input
     * @returns {Promise<string>}
     */
    async run(topic = null, rl = null) {
        const shouldCloseRl = !rl; // Only close if we created it ourselves
        if (!rl) {
            rl = this.createReadlineInterface();
        }
        let initialInput = topic || '';
        
        if (topic) {
            console.log(`Research topic: "${topic}"`);
            console.log("Let me create an initial research plan for you...");
            
            // Generate initial plan for the given topic
            const planningPrompt = `Create a research plan for the topic: "${topic}". 
            The plan should include:
            - Core topics to be researched
            - Topics that should be avoided
            - Time frame for web research (maximum age of results)
            
            Please provide a clear, structured research plan.`;
            
            this.messages.push({ role: "user", content: planningPrompt });
            
            const response = await this.chatCompletion(this.messages, {
                model: this.model
            });
            
            const initialPlan = response.content;
            console.log("\nGenerated initial research plan:");
            console.log("=".repeat(50));
            console.log(initialPlan);
            console.log("=".repeat(50));
            console.log("\nPlease review and modify this plan, or type 'accept' to proceed.");
        } else {
            console.log("Please describe your research task:");
        }
        
        try {
            while (true) {
                const userInput = await this.question(
                    rl, 
                    "Your Input ('exit' to quit, 'accept' to accept the research plan and continue): "
                );
                
                // Capture the first non-command input as initial input
                if (!initialInput && userInput !== 'exit' && userInput !== 'accept') {
                    initialInput = userInput;
                }
                
                if (userInput === "exit") {
                    console.log("Exiting.");
                    if (shouldCloseRl) rl.close();
                    process.exit(0);
                } else if (userInput === "accept") {
                    console.log("Research plan accepted. Continuing...");
                    const prompt = "Please create a final version of the discussed research plan and return JUST that plan, nothing else, no other comments.";
                    this.messages.push({ role: "user", content: prompt });
                    
                    const response = await this.chatCompletion(this.messages, {
                        model: this.model
                    });
                    
                    const finalPlan = response.content;
                    console.log("Here's the final research plan:");
                    console.log(finalPlan);
                    if (shouldCloseRl) rl.close();
                    return { researchPlan: finalPlan, initialInput };
                }

                this.messages.push({ role: "user", content: userInput });

                while (true) {
                    const response = await this.chatCompletionWithTools(this.messages, this.getToolSchemas(), {
                        model: this.model,
                        toolChoice: "auto",
                    });

                    // Convert standardized response back to OpenAI format for compatibility
                    const choice = {
                        message: {
                            content: response.content,
                            tool_calls: response.toolCalls
                        }
                    };
                    this.messages.push(choice.message);

                    if (!choice.message.tool_calls) {
                        console.log(choice.message.content);
                        break;
                    }

                    // Handle tool calls if any are returned from LLM
                    for (const toolCall of choice.message.tool_calls) {
                        const toolOutput = await this.executeToolCall(toolCall);
                        this.messages.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: toolOutput,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error in ResearchPlannerAgent:", error);
            if (shouldCloseRl) rl.close();
            throw error;
        }
    }
}
