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
                    - Related topics
                    - Topics that should be avoided
                    - Time frame for web research (i.e, max age of the web search results)
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
     * Runs the agent.
     * @returns {Promise<string>}
     */
    async run() {
        const rl = this.createReadlineInterface();
        let initialInput = '';
        
        console.log("Hi! Please describe today's research task:");
        
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
                    rl.close();
                    process.exit(0);
                } else if (userInput === "accept") {
                    console.log("Research plan accepted. Continuing...");
                    const prompt = "Please create a final version of the discussed research plan and return JUST that plan, nothing else, no other comments.";
                    this.messages.push({ role: "user", content: prompt });
                    
                    const response = await this.client.chat.completions.create({
                        model: this.model,
                        messages: this.messages,
                    });
                    
                    const finalPlan = response.choices[0].message.content;
                    console.log("Here's the final research plan:");
                    console.log(finalPlan);
                    rl.close();
                    return { researchPlan: finalPlan, initialInput };
                }

                this.messages.push({ role: "user", content: userInput });

                while (true) {
                    const response = await this.client.chat.completions.create({
                        model: this.model,
                        messages: this.messages,
                        tools: this.getToolSchemas(), // passing tools to LLM
                        tool_choice: "auto",
                    });

                    const choice = response.choices[0];
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
            rl.close();
            throw error;
        }
    }
}
