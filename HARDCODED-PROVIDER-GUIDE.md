# Hardcoded AI Provider Configuration Guide

This guide shows you how to force the system to use a specific AI provider instead of auto-detection.

## Quick Start

### Method 1: Configuration File (Recommended)

Edit `ai-provider-config.js` and change the configuration:

```javascript
export const AI_PROVIDER_CONFIG = {
    mode: 'manual',              // Change from 'auto' to 'manual'
    forcedProvider: 'openai',    // Choose: 'openai', 'gemini', or 'claude'
    
    providers: {
        openai: {
            defaultModel: 'gpt-4',   // Specify your preferred model
            temperature: 0.7
        }
    }
};
```

### Method 2: Use Presets

Uncomment one of the presets in `ai-provider-config.js`:

```javascript
// Preset 1: Force OpenAI GPT-4
export const AI_PROVIDER_CONFIG = {
    mode: 'manual',
    forcedProvider: 'openai',
    providers: {
        openai: {
            defaultModel: 'gpt-4',
            temperature: 0.7
        }
    }
};
```

### Method 3: Direct Code Modification

Edit `main.js` directly in the main function:

```javascript
const main = async () => {
    try {
        await initDb();
        
        // Replace auto-initialization with hardcoded provider
        await aiProviderManager.initializeSingleProvider('openai', {
            defaultModel: 'gpt-4',
            temperature: 0.7
        });
        
        // Comment out the auto-detection line:
        // await aiProviderManager.initializeProviders();
        
        console.log("Multi-Agent Research System Initialized");
        // ... rest of the code
    }
};
```

## Available Providers

### OpenAI
```javascript
await aiProviderManager.initializeSingleProvider('openai', {
    defaultModel: 'gpt-4o-mini',  // or 'gpt-4', 'gpt-3.5-turbo'
    temperature: 0.7
});
```

**Best for**: General purpose, image generation, function calling

### Google Gemini  
```javascript
await aiProviderManager.initializeSingleProvider('gemini', {
    defaultModel: 'gemini-1.5-flash', // or 'gemini-1.5-pro'
    temperature: 0.7
});
```

**Best for**: Speed, cost efficiency, high-volume tasks

### Anthropic Claude
```javascript
await aiProviderManager.initializeSingleProvider('claude', {
    defaultModel: 'claude-3-haiku-20240307', // or 'claude-3-5-sonnet-20241022'
    temperature: 0.7
});
```

**Best for**: Advanced reasoning, complex analysis, writing

## Configuration Options

### Provider-Specific Models

#### OpenAI Models
- `gpt-4o` - Latest and most capable
- `gpt-4o-mini` - Fast and cost-effective (default)
- `gpt-4-turbo` - Previous generation flagship
- `gpt-4` - Original GPT-4
- `gpt-3.5-turbo` - Fast and economical

#### Gemini Models
- `gemini-1.5-pro` - Most capable Gemini model
- `gemini-1.5-flash` - Fast and efficient (default)
- `gemini-1.0-pro` - Original Gemini model

#### Claude Models
- `claude-3-5-sonnet-20241022` - Most capable Claude model
- `claude-3-opus-20240229` - Balanced performance
- `claude-3-sonnet-20240229` - Good reasoning
- `claude-3-haiku-20240307` - Fast and economical (default)

### Temperature Settings
- `0.0` - Deterministic, consistent responses
- `0.7` - Balanced creativity and consistency (default)
- `1.0` - More creative and varied responses

### Advanced Configuration

```javascript
await aiProviderManager.initializeSingleProvider('openai', {
    defaultModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    // apiKey: 'custom-key' // Override environment variable
});
```

## Verification

When you start the application, you'll see logs indicating which provider is active:

```
AI Provider Configuration:
   Mode: manual
   Forced Provider: openai
   Model: gpt-4
Forcing initialization of openai provider only
Successfully initialized openai as the only provider
Active provider: openai
```

## Troubleshooting

### Common Issues

1. **"Provider not found" error**
   - Check spelling: use exactly 'openai', 'gemini', or 'claude'
   - Ensure the provider name matches the configuration

2. **"API key not found" error**
   - Verify the API key is set in your `.env` file
   - Check the environment variable name matches the provider

3. **"Failed to initialize provider" error**
   - Verify API key is valid and has sufficient credits
   - Check network connectivity
   - Ensure the model name is correct for the provider

### Debug Mode

Set your config to see detailed logs:

```javascript
export const AI_PROVIDER_CONFIG = {
    mode: 'manual',
    forcedProvider: 'openai',
    debug: true,  // Add this for extra logging
    providers: {
        openai: {
            defaultModel: 'gpt-4o-mini'
        }
    }
};
```

## Switching Providers

To switch to a different provider, simply change the configuration:

```javascript
// From OpenAI
forcedProvider: 'openai'

// To Gemini
forcedProvider: 'gemini'
```

No other code changes needed! The system will automatically use the new provider for all operations.

## Best Practices

1. **Development**: Use fast, cheap models like `gpt-4o-mini` or `gemini-1.5-flash`
2. **Production**: Use more capable models like `gpt-4` or `claude-3-5-sonnet`  
3. **High Volume**: Use Gemini for cost efficiency
4. **Complex Tasks**: Use Claude for advanced reasoning
5. **Image Generation**: Use OpenAI (only provider that supports it)

## Reverting to Auto-Detection

To go back to automatic provider detection:

```javascript
export const AI_PROVIDER_CONFIG = {
    mode: 'auto',  // Change back to 'auto'
    // ... rest of config
};
```

Or comment out the hardcoded initialization in `main.js` and uncomment the auto-detection line.
