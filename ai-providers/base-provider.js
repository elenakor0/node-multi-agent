/**
 * Base AI Provider Interface
 * All AI providers must implement this interface
 */
export class BaseAIProvider {
    constructor(name, apiKey, config = {}) {
        this.name = name;
        this.apiKey = apiKey;
        this.config = config;
        this.client = null;
    }

    /**
     * Initialize the AI provider client
     * Must be implemented by each provider
     */
    async initialize() {
        throw new Error("initialize() method must be implemented by subclass");
    }

    /**
     * Send a chat completion request
     * @param {Array} messages - Array of messages in OpenAI format
     * @param {Object} options - Additional options (model, temperature, etc.)
     * @returns {Object} Standardized response object
     */
    async chatCompletion(messages, options = {}) {
        throw new Error("chatCompletion() method must be implemented by subclass");
    }

    /**
     * Send a chat completion request with tools/function calling
     * @param {Array} messages - Array of messages
     * @param {Array} tools - Array of tool definitions
     * @param {Object} options - Additional options
     * @returns {Object} Standardized response object with tool calls
     */
    async chatCompletionWithTools(messages, tools, options = {}) {
        throw new Error("chatCompletionWithTools() method must be implemented by subclass");
    }

    /**
     * Check if the provider supports tool/function calling
     * @returns {boolean}
     */
    supportsTools() {
        return false;
    }

    /**
     * Check if the provider supports image generation
     * @returns {boolean}
     */
    supportsImageGeneration() {
        return false;
    }

    /**
     * Get available models for this provider
     * @returns {Array} Array of model names
     */
    getAvailableModels() {
        return [];
    }

    /**
     * Validate that the provider is properly configured
     * @returns {boolean}
     */
    isConfigured() {
        return this.apiKey && this.apiKey.length > 0;
    }

    /**
     * Standardize response format across all providers
     * @param {Object} response - Provider-specific response
     * @returns {Object} Standardized response
     */
    standardizeResponse(response) {
        return {
            provider: this.name,
            content: response.content || '',
            usage: response.usage || {},
            model: response.model || 'unknown',
            toolCalls: response.toolCalls || null,
            finishReason: response.finishReason || 'unknown'
        };
    }

    /**
     * Handle provider-specific errors
     * @param {Error} error - Original error
     * @returns {Error} Standardized error
     */
    handleError(error) {
        const standardError = new Error(`${this.name} Provider Error: ${error.message}`);
        standardError.provider = this.name;
        standardError.originalError = error;
        return standardError;
    }
}
