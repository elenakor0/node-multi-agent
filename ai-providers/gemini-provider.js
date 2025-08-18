import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base-provider.js';

export class GeminiProvider extends BaseAIProvider {
    constructor(apiKey, config = {}) {
        super('Gemini', apiKey, config);
        this.defaultModel = config.defaultModel || 'gemini-1.5-flash';
    }

    async initialize() {
        try {
            this.client = new GoogleGenerativeAI(this.apiKey);
            console.log(`${this.name} provider initialized successfully`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async chatCompletion(messages, options = {}) {
        try {
            const model = this.client.getGenerativeModel({ 
                model: options.model || this.defaultModel,
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens,
                    topP: options.topP
                }
            });

            // Convert OpenAI format messages to Gemini format
            const geminiMessages = this.convertMessagesToGemini(messages);
            
            const result = await model.generateContent(geminiMessages);
            const response = await result.response;

            return this.standardizeResponse({
                content: response.text(),
                usage: {
                    prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
                    completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
                    total_tokens: response.usageMetadata?.totalTokenCount || 0
                },
                model: options.model || this.defaultModel,
                finishReason: response.candidates?.[0]?.finishReason || 'stop'
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async chatCompletionWithTools(messages, tools, options = {}) {
        try {
            // Convert tools to Gemini function format
            const geminiTools = this.convertToolsToGemini(tools);
            
            const model = this.client.getGenerativeModel({ 
                model: options.model || this.defaultModel,
                tools: geminiTools,
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens,
                    topP: options.topP
                }
            });

            const geminiMessages = this.convertMessagesToGemini(messages);
            const result = await model.generateContent(geminiMessages);
            const response = await result.response;

            const standardResponse = this.standardizeResponse({
                content: response.text(),
                usage: {
                    prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
                    completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
                    total_tokens: response.usageMetadata?.totalTokenCount || 0
                },
                model: options.model || this.defaultModel,
                finishReason: response.candidates?.[0]?.finishReason || 'stop'
            });

            // Handle function calls
            const functionCalls = response.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
                standardResponse.toolCalls = functionCalls.map((call, index) => ({
                    id: `call_${index}`,
                    type: 'function',
                    function: {
                        name: call.name,
                        arguments: JSON.stringify(call.args)
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
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro'
        ];
    }

    /**
     * Convert OpenAI format messages to Gemini format
     * @param {Array} messages - OpenAI format messages
     * @returns {String|Array} Gemini format messages
     */
    convertMessagesToGemini(messages) {
        // For simple cases, combine all messages into a single prompt
        if (messages.length === 1) {
            return messages[0].content;
        }

        // For multiple messages, convert to Gemini chat format
        return messages.map(msg => {
            if (msg.role === 'system') {
                return `System: ${msg.content}`;
            } else if (msg.role === 'user') {
                return `User: ${msg.content}`;
            } else if (msg.role === 'assistant') {
                return `Assistant: ${msg.content}`;
            }
            return msg.content;
        }).join('\n\n');
    }

    /**
     * Convert OpenAI tool format to Gemini function format
     * @param {Array} tools - OpenAI format tools
     * @returns {Array} Gemini format functions
     */
    convertToolsToGemini(tools) {
        return tools.map(tool => ({
            function_declarations: [{
                name: tool.function.name,
                description: tool.function.description,
                parameters: {
                    type: "object",
                    properties: tool.function.parameters.properties,
                    required: tool.function.parameters.required
                }
            }]
        }));
    }
}
