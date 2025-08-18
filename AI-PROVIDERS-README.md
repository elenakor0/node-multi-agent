# AI Providers Documentation

This document explains how to use the multiple AI provider system implemented in the Node Multi-Agent application.

## Overview

The application now supports three AI providers:
- **OpenAI** (GPT-4, GPT-3.5-turbo, etc.)
- **Google Gemini** (Gemini 1.5 Pro, Gemini 1.5 Flash, etc.)
- **Anthropic Claude** (Claude 3.5 Sonnet, Claude 3 Haiku, etc.)

## Setup

### 1. Install Dependencies

Install the required packages for all AI providers:

```bash
npm install @google/generative-ai @anthropic-ai/sdk
```

### 2. Environment Variables

Add your API keys to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# Gemini Configuration  
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_DEFAULT_MODEL=gemini-1.5-flash

# Claude Configuration
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_DEFAULT_MODEL=claude-3-haiku-20240307
```

### 3. Get API Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **Gemini**: https://makersuite.google.com/app/apikey
- **Claude**: https://console.anthropic.com/

## How It Works

### Provider Manager

The `AIProviderManager` automatically:
- Initializes all available providers based on environment variables
- Sets a default active provider
- Provides fallback mechanisms if a provider fails
- Handles provider-specific API differences

### Automatic Provider Selection

The system will:
1. Initialize all providers with valid API keys
2. Set the first available provider as active (priority: OpenAI → Gemini → Claude)
3. Automatically fallback to other providers if the active one fails

### Provider-Specific Features

| Feature | OpenAI | Gemini | Claude |
|---------|--------|--------|--------|
| Chat Completion | Yes | Yes | Yes |
| Function/Tool Calling | Yes | Yes | Yes |
| Streaming | Yes | No | No |
| Vision | Yes | Yes | Yes |
| JSON Mode | Yes | No | No |

## Usage Examples

### Basic Usage

The application automatically uses the configured providers. No code changes needed for basic functionality.

### Manual Provider Control

```javascript
import { aiProviderManager } from './ai-providers/index.js';

// Switch active provider
aiProviderManager.setActiveProvider('gemini');

// Get provider info
const info = aiProviderManager.getProviderInfo();
console.log(info);

// Use specific provider with fallback
const response = await aiProviderManager.switchProviderWithFallback(
    'claude',
    messages,
    tools,
    options
);
```

### Agent-Level Provider Preference

```javascript
import { Agent } from './agents/base/agent.js';

class MyAgent extends Agent {
    constructor() {
        super('gpt-4', 'claude'); // Prefer Claude, fallback to default
    }
    
    async run() {
        // This agent will try to use Claude first
        const response = await this.chatCompletion(messages);
        return response;
    }
}
```

## Configuration

### Model Selection

Each provider supports different models. Configure defaults in your `.env` file or specify per request:

```javascript
// Use specific model
const response = await aiProviderManager.chatCompletion(messages, {
    model: 'claude-3-5-sonnet-20241022'  // Override default
});
```

### Provider-Specific Options

```javascript
// OpenAI-specific options
const openaiResponse = await provider.chatCompletion(messages, {
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0,
    presence_penalty: 0
});

// Gemini-specific options  
const geminiResponse = await provider.chatCompletion(messages, {
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9
});

// Claude-specific options
const claudeResponse = await provider.chatCompletion(messages, {
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9
});
```

## Error Handling

The provider system includes robust error handling:

1. **Provider Initialization**: Failed providers are excluded from available options
2. **Request Failures**: Automatic fallback to other providers
3. **Standardized Errors**: All provider errors are wrapped in a consistent format

## Monitoring

The system logs provider status:

```
OpenAI provider initialized
Gemini provider initialized  
Failed to initialize Claude provider: Invalid API key
Initialized 2 AI providers
Active provider: openai
Available providers: openai, gemini
```

## Best Practices

1. **Set API Keys**: Configure multiple providers for redundancy
2. **Monitor Usage**: Different providers have different pricing models
3. **Model Selection**: Choose appropriate models based on task complexity
4. **Fallback Strategy**: Always have at least one backup provider configured
5. **Provider-Specific Features**: Use provider strengths (e.g., Claude for reasoning, Gemini for efficiency)

## Troubleshooting

### Common Issues

1. **No providers available**: Check API keys in `.env` file
2. **Provider initialization failed**: Verify API key validity and network connectivity  
3. **Tool calling not working**: Ensure the provider supports function calling
4. **Rate limiting**: The system will automatically retry and fallback

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This will show provider selection decisions and fallback attempts.
