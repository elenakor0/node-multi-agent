import { aiProviderManager } from '../../ai-providers/index.js';
import dotenv from 'dotenv';

dotenv.config();

export class Agent {
    constructor(model = "gpt-4o-mini", preferredProvider = null) {
        this.aiProvider = aiProviderManager;
        this.model = model;
        this.preferredProvider = preferredProvider;
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

    /**
     * Send a chat completion request using the configured AI provider
     */
    async chatCompletion(messages, options = {}) {
        const requestOptions = {
            model: options.model || this.model,
            ...options
        };

        if (this.preferredProvider) {
            try {
                return await this.aiProvider.switchProviderWithFallback(
                    this.preferredProvider,
                    messages,
                    null,
                    requestOptions
                );
            } catch (error) {
                console.warn(`Failed to use preferred provider ${this.preferredProvider}, using default:`, error.message);
            }
        }

        return await this.aiProvider.chatCompletion(messages, requestOptions);
    }

    /**
     * Send a chat completion request with tools using the configured AI provider
     */
    async chatCompletionWithTools(messages, tools, options = {}) {
        const requestOptions = {
            model: options.model || this.model,
            ...options
        };

        if (this.preferredProvider) {
            try {
                return await this.aiProvider.switchProviderWithFallback(
                    this.preferredProvider,
                    messages,
                    tools,
                    requestOptions
                );
            } catch (error) {
                console.warn(`Failed to use preferred provider ${this.preferredProvider}, using default:`, error.message);
            }
        }

        return await this.aiProvider.chatCompletionWithTools(messages, tools, requestOptions);
    }

    /**
     * Set the preferred AI provider for this agent
     */
    setPreferredProvider(providerName) {
        if (this.aiProvider.isProviderAvailable(providerName)) {
            this.preferredProvider = providerName;
            console.log(`Agent now prefers ${providerName} provider`);
        } else {
            console.warn(`Provider ${providerName} is not available`);
        }
    }

    /**
     * Get available AI providers
     */
    getAvailableProviders() {
        return this.aiProvider.getAvailableProviders();
    }

    async run() {
        throw new Error("The run method must be implemented by a subclass.");
    }
}
