import { OpenAIProvider } from './openai-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { ClaudeProvider } from './claude-provider.js';

export class AIProviderManager {
    constructor() {
        this.providers = new Map();
        this.activeProvider = null;
        this.defaultProvider = 'openai';
        this.forcedProvider = null; // For hardcoded provider selection
        this.initMode = 'auto'; // 'auto' or 'manual'
    }

    /**
     * Force initialize a specific provider only
     * @param {string} providerName - The provider to initialize ('openai', 'gemini', or 'claude')
     * @param {Object} config - Optional configuration override
     */
    async initializeSingleProvider(providerName, config = {}) {
        this.initMode = 'manual';
        this.forcedProvider = providerName;
        
        console.log(`Forcing initialization of ${providerName} provider only`);
        
        let provider;
        let apiKey;
        
        switch (providerName.toLowerCase()) {
            case 'openai':
                apiKey = config.apiKey || process.env.OPENAI_API_KEY;
                if (!apiKey) throw new Error('OpenAI API key not found in config or environment');
                provider = new OpenAIProvider(apiKey, {
                    defaultModel: config.defaultModel || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
                    ...config
                });
                break;
                
            case 'gemini':
                apiKey = config.apiKey || process.env.GEMINI_API_KEY;
                if (!apiKey) throw new Error('Gemini API key not found in config or environment');
                provider = new GeminiProvider(apiKey, {
                    defaultModel: config.defaultModel || process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-flash',
                    ...config
                });
                break;
                
            case 'claude':
                apiKey = config.apiKey || process.env.CLAUDE_API_KEY;
                if (!apiKey) throw new Error('Claude API key not found in config or environment');
                provider = new ClaudeProvider(apiKey, {
                    defaultModel: config.defaultModel || process.env.CLAUDE_DEFAULT_MODEL || 'claude-3-haiku-20240307',
                    ...config
                });
                break;
                
            default:
                throw new Error(`Unknown provider: ${providerName}. Supported providers: openai, gemini, claude`);
        }
        
        this.providers.clear(); // Clear any existing providers
        this.providers.set(providerName.toLowerCase(), provider);
        
        try {
            await provider.initialize();
            this.activeProvider = providerName.toLowerCase();
            console.log(`Successfully initialized ${providerName} as the only provider`);
            console.log(`Active provider: ${this.activeProvider}`);
            return true;
        } catch (error) {
            console.error(`Failed to initialize ${providerName}:`, error.message);
            this.providers.delete(providerName.toLowerCase());
            throw error;
        }
    }

    /**
     * Initialize all available providers based on environment variables
     */
    async initializeProviders() {
        // Skip auto-initialization if a forced provider is already set
        if (this.initMode === 'manual' && this.forcedProvider) {
            console.log(`Provider already manually set to ${this.forcedProvider}. Skipping auto-initialization.`);
            return;
        }

        this.initMode = 'auto';
        const initPromises = [];

        // Initialize OpenAI if API key is available
        if (process.env.OPENAI_API_KEY) {
            const openaiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY, {
                defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'
            });
            this.providers.set('openai', openaiProvider);
            initPromises.push(this.safeInitializeProvider('openai', openaiProvider));
        }

        // Initialize Gemini if API key is available
        if (process.env.GEMINI_API_KEY) {
            const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY, {
                defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-flash'
            });
            this.providers.set('gemini', geminiProvider);
            initPromises.push(this.safeInitializeProvider('gemini', geminiProvider));
        }

        // Initialize Claude if API key is available
        if (process.env.CLAUDE_API_KEY) {
            const claudeProvider = new ClaudeProvider(process.env.CLAUDE_API_KEY, {
                defaultModel: process.env.CLAUDE_DEFAULT_MODEL || 'claude-3-haiku-20240307'
            });
            this.providers.set('claude', claudeProvider);
            initPromises.push(this.safeInitializeProvider('claude', claudeProvider));
        }

        // Wait for all providers to initialize
        await Promise.allSettled(initPromises);

        // Set active provider to default if available
        if (this.providers.has(this.defaultProvider)) {
            this.activeProvider = this.defaultProvider;
        } else if (this.providers.size > 0) {
            // Use the first available provider
            this.activeProvider = this.providers.keys().next().value;
        }

        console.log(`Auto-initialized ${this.providers.size} AI providers`);
        console.log(`Active provider: ${this.activeProvider || 'none'}`);
        console.log(`Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    /**
     * Safely initialize a provider with error handling
     */
    async safeInitializeProvider(name, provider) {
        try {
            await provider.initialize();
            console.log(`${name} provider initialized`);
        } catch (error) {
            console.warn(`Failed to initialize ${name} provider:`, error.message);
            this.providers.delete(name);
        }
    }

    /**
     * Get the active provider instance
     */
    getActiveProvider() {
        if (!this.activeProvider || !this.providers.has(this.activeProvider)) {
            const mode = this.initMode === 'manual' ? 'manual' : 'auto';
            throw new Error(`No active AI provider available (${mode} mode). ${this.initMode === 'manual' ? 'Check your hardcoded provider configuration.' : 'Check your API keys in .env file.'}`);
        }
        return this.providers.get(this.activeProvider);
    }

    /**
     * Check if we're in manual/forced provider mode
     */
    isManualMode() {
        return this.initMode === 'manual';
    }

    /**
     * Get the forced provider name (if any)
     */
    getForcedProvider() {
        return this.forcedProvider;
    }

    /**
     * Get a specific provider by name
     */
    getProvider(name) {
        if (!this.providers.has(name)) {
            throw new Error(`Provider '${name}' is not available`);
        }
        return this.providers.get(name);
    }

    /**
     * Set the active provider
     */
    setActiveProvider(name) {
        if (!this.providers.has(name)) {
            throw new Error(`Provider '${name}' is not available`);
        }
        this.activeProvider = name;
        console.log(`Switched to ${name} provider`);
    }

    /**
     * Get list of available provider names
     */
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }

    /**
     * Check if a specific provider is available
     */
    isProviderAvailable(name) {
        return this.providers.has(name);
    }

    /**
     * Send a chat completion request using the active provider
     */
    async chatCompletion(messages, options = {}) {
        const provider = this.getActiveProvider();
        return await provider.chatCompletion(messages, options);
    }

    /**
     * Send a chat completion request with tools using the active provider
     */
    async chatCompletionWithTools(messages, tools, options = {}) {
        const provider = this.getActiveProvider();
        
        if (!provider.supportsTools()) {
            console.warn(`Provider '${this.activeProvider}' does not support tools, falling back to regular chat completion`);
            return await provider.chatCompletion(messages, options);
        }
        
        return await provider.chatCompletionWithTools(messages, tools, options);
    }

    /**
     * Get provider info and capabilities
     */
    getProviderInfo() {
        const info = {};
        
        for (const [name, provider] of this.providers) {
            info[name] = {
                name: provider.name,
                isActive: name === this.activeProvider,
                supportsTools: provider.supportsTools(),
                availableModels: provider.getAvailableModels(),
                isConfigured: provider.isConfigured()
            };
        }
        
        return info;
    }

    /**
     * Switch provider with fallback logic
     */
    async switchProviderWithFallback(preferredProvider, messages, tools, options) {
        const originalProvider = this.activeProvider;
        
        try {
            // Try preferred provider first
            if (this.isProviderAvailable(preferredProvider)) {
                this.setActiveProvider(preferredProvider);
                if (tools && tools.length > 0) {
                    return await this.chatCompletionWithTools(messages, tools, options);
                } else {
                    return await this.chatCompletion(messages, options);
                }
            }
        } catch (error) {
            console.warn(`Failed to use ${preferredProvider}, falling back to ${originalProvider}:`, error.message);
            
            // Fallback to original provider
            if (originalProvider && this.isProviderAvailable(originalProvider)) {
                this.setActiveProvider(originalProvider);
                if (tools && tools.length > 0) {
                    return await this.chatCompletionWithTools(messages, tools, options);
                } else {
                    return await this.chatCompletion(messages, options);
                }
            }
        }
        
        throw new Error('No available AI providers can handle this request');
    }
}

// Create singleton instance
export const aiProviderManager = new AIProviderManager();
