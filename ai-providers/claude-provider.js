import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base-provider.js';

export class ClaudeProvider extends BaseAIProvider {
    constructor(apiKey, config = {}) {
        super('Claude', apiKey, config);
        this.defaultModel = config.defaultModel || 'claude-3-haiku-20240307';
    }

    async initialize() {
        try {
            this.client = new Anthropic({
                apiKey: this.apiKey,
                ...this.config
            });
            console.log(`${this.name} provider initialized successfully`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async chatCompletion(messages, options = {}) {
        try {
            // Separate system messages from other messages
            const { systemMessage, conversationMessages } = this.prepareClaudeMessages(messages);

            const response = await this.client.messages.create({
                model: options.model || this.defaultModel,
                max_tokens: options.maxTokens || 4096,
                temperature: options.temperature || 0.7,
                system: systemMessage,
                messages: conversationMessages,
                top_p: options.topP,
                ...options
            });

            return this.standardizeResponse({
                content: response.content[0].text,
                usage: response.usage,
                model: response.model,
                finishReason: response.stop_reason
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async chatCompletionWithTools(messages, tools, options = {}) {
        try {
            // Convert tools to Claude format
            const claudeTools = this.convertToolsToClaude(tools);
            const { systemMessage, conversationMessages } = this.prepareClaudeMessages(messages);

            const response = await this.client.messages.create({
                model: options.model || this.defaultModel,
                max_tokens: options.maxTokens || 4096,
                temperature: options.temperature || 0.7,
                system: systemMessage,
                messages: conversationMessages,
                tools: claudeTools,
                tool_choice: this.convertToolChoice(options.toolChoice),
                top_p: options.topP,
                ...options
            });

            const standardResponse = this.standardizeResponse({
                content: response.content.find(c => c.type === 'text')?.text || '',
                usage: response.usage,
                model: response.model,
                finishReason: response.stop_reason
            });

            // Handle tool use
            const toolUse = response.content.filter(c => c.type === 'tool_use');
            if (toolUse.length > 0) {
                standardResponse.toolCalls = toolUse.map(tool => ({
                    id: tool.id,
                    type: 'function',
                    function: {
                        name: tool.name,
                        arguments: JSON.stringify(tool.input)
                    }
                }));
            }

            return standardResponse;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    supportsTools() {
        return true;
    }

    getAvailableModels() {
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }

    /**
     * Prepare messages for Claude API format
     * Claude requires system messages to be separate from conversation messages
     * @param {Array} messages - OpenAI format messages
     * @returns {Object} Object with systemMessage and conversationMessages
     */
    prepareClaudeMessages(messages) {
        let systemMessage = '';
        const conversationMessages = [];

        for (const message of messages) {
            if (message.role === 'system') {
                systemMessage += (systemMessage ? '\n\n' : '') + message.content;
            } else {
                conversationMessages.push({
                    role: message.role,
                    content: message.content
                });
            }
        }

        return { systemMessage, conversationMessages };
    }

    /**
     * Convert OpenAI tool format to Claude tool format
     * @param {Array} tools - OpenAI format tools
     * @returns {Array} Claude format tools
     */
    convertToolsToClaude(tools) {
        return tools.map(tool => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: {
                type: "object",
                properties: tool.function.parameters.properties,
                required: tool.function.parameters.required
            }
        }));
    }

    /**
     * Convert OpenAI tool choice to Claude format
     * @param {String|Object} toolChoice - OpenAI format tool choice
     * @returns {String|Object} Claude format tool choice
     */
    convertToolChoice(toolChoice) {
        if (!toolChoice || toolChoice === 'auto') {
            return { type: 'auto' };
        }
        if (toolChoice === 'none') {
            return { type: 'none' };
        }
        if (typeof toolChoice === 'object' && toolChoice.function) {
            return { 
                type: 'tool',
                name: toolChoice.function.name
            };
        }
        return { type: 'auto' };
    }

    /**
     * Claude-specific method to get message batches (if needed for high volume)
     */
    async createMessageBatch(requests) {
        try {
            return await this.client.messages.batches.create({
                requests: requests
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }
}
