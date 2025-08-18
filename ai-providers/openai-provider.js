import OpenAI from 'openai';
import { BaseAIProvider } from './base-provider.js';

export class OpenAIProvider extends BaseAIProvider {
    constructor(apiKey, config = {}) {
        super('OpenAI', apiKey, config);
        this.defaultModel = config.defaultModel || 'gpt-4o-mini';
    }

    async initialize() {
        try {
            this.client = new OpenAI({
                apiKey: this.apiKey,
                ...this.config
            });
            
            // Test the connection
            await this.client.models.list();
            console.log(`${this.name} provider initialized successfully`);
            return true;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async chatCompletion(messages, options = {}) {
        try {
            // Extract known options and prevent unknown parameters from being passed
            const {
                model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty,
                toolChoice, // Remove this to prevent it from being passed to chat completion
                ...validOptions
            } = options;
            
            const response = await this.client.chat.completions.create({
                model: model || this.defaultModel,
                messages: messages,
                temperature: temperature || 0.7,
                max_tokens: maxTokens,
                top_p: topP,
                frequency_penalty: frequencyPenalty,
                presence_penalty: presencePenalty,
                ...validOptions
            });

            return this.standardizeResponse({
                content: response.choices[0].message.content,
                usage: response.usage,
                model: response.model,
                finishReason: response.choices[0].finish_reason
            });
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async chatCompletionWithTools(messages, tools, options = {}) {
        try {
            // Extract and convert toolChoice to tool_choice for OpenAI API
            const { 
                toolChoice, 
                model, 
                temperature, 
                maxTokens, 
                topP, 
                frequencyPenalty, 
                presencePenalty,
                ...restOptions 
            } = options;
            
            const response = await this.client.chat.completions.create({
                model: model || this.defaultModel,
                messages: messages,
                tools: tools,
                tool_choice: toolChoice || 'auto',
                temperature: temperature || 0.7,
                max_tokens: maxTokens,
                top_p: topP,
                frequency_penalty: frequencyPenalty,
                presence_penalty: presencePenalty,
                ...restOptions
            });

            const choice = response.choices[0];
            const standardResponse = this.standardizeResponse({
                content: choice.message.content,
                usage: response.usage,
                model: response.model,
                finishReason: choice.finish_reason
            });

            // Handle tool calls
            if (choice.message.tool_calls) {
                standardResponse.toolCalls = choice.message.tool_calls.map(toolCall => ({
                    id: toolCall.id,
                    type: toolCall.type,
                    function: {
                        name: toolCall.function.name,
                        arguments: toolCall.function.arguments
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
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k'
        ];
    }

    /**
     * OpenAI-specific method to get model info
     */
    async getModelInfo(modelId) {
        try {
            return await this.client.models.retrieve(modelId);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * OpenAI-specific method to list all models
     */
    async listModels() {
        try {
            return await this.client.models.list();
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * OpenAI-specific method for image generation
     */
    async generateImage(options = {}) {
        try {
            const response = await this.client.images.generate({
                model: options.model || "dall-e-3",
                prompt: options.prompt,
                n: options.n || 1,
                size: options.size || "1024x1024",
                quality: options.quality || "standard",
                ...options
            });
            
            return {
                success: true,
                imageUrl: response.data[0].url,
                revisedPrompt: response.data[0].revised_prompt,
                model: options.model || "dall-e-3"
            };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Check if this provider supports image generation
     */
    supportsImageGeneration() {
        return true;
    }
}
