import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class Agent {
    constructor(model = "gpt-4o-mini") {
        this.client = client;
        this.model = model;
        this.messages = [];
        this.tools = new Map();
    }

    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }

    getToolSchemas() {
        return Array.from(this.tools.values()).map(tool => tool.getSchema());
    }

    async executeToolCall(toolCall) {
        const fnName = toolCall.function.name;
        const fnArgs = toolCall.function.arguments;

        if (this.tools.has(fnName)) {
            const toolToCall = this.tools.get(fnName);
            try {
                console.log(`Calling ${fnName} with arguments: ${fnArgs}`);
                const result = await toolToCall.execute(fnArgs);
                return JSON.stringify(result);
            } catch (error) {
                return `Error calling ${fnName}: ${error.message}`;
            }
        }

        return `Unknown tool: ${fnName}`;
    }

    async run() {
        throw new Error("The run method must be implemented by a subclass.");
    }
}
