/**
 * AI Provider Configuration
 * 
 * This file allows you to easily configure which AI provider to use
 * without modifying the main application code.
 */

// CONFIGURATION OPTIONS

// export const AI_PROVIDER_CONFIG = {
//     // Set to 'manual' to use a hardcoded provider, or 'auto' for automatic detection
//     mode: 'auto', // Options: 'auto', 'manual'
    
//     // If mode is 'manual', specify which provider to use
//     forcedProvider: 'openai', // Options: 'openai', 'gemini', 'claude'
    
//     // Provider-specific configurations
//     providers: {
//         openai: {
//             defaultModel: 'gpt-4o-mini', // or 'gpt-4', 'gpt-3.5-turbo'
//             temperature: 0.7,
//             // apiKey: 'your-key-here' // Optional: override env variable
//         },
        
//         gemini: {
//             defaultModel: 'gemini-1.5-flash', // or 'gemini-1.5-pro', 'gemini-1.0-pro'
//             temperature: 0.7,
//             // apiKey: 'your-key-here' // Optional: override env variable
//         },
        
//         claude: {
//             defaultModel: 'claude-3-haiku-20240307', // or 'claude-3-5-sonnet-20241022'
//             temperature: 0.7,
//             // apiKey: 'your-key-here' // Optional: override env variable
//         }
//     }
// };

// QUICK PRESETS - Uncomment one to use

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

// Preset 2: Force Gemini for speed and cost efficiency  
// export const AI_PROVIDER_CONFIG = {
//     mode: 'manual',
//     forcedProvider: 'gemini',
//     providers: {
//         gemini: {
//             defaultModel: 'gemini-1.5-flash',
//             temperature: 0.7
//         }
//     }
// };

// Preset 3: Force Claude for advanced reasoning
// export const AI_PROVIDER_CONFIG = {
//     mode: 'manual',
//     forcedProvider: 'claude',
//     providers: {
//         claude: {
//             defaultModel: 'claude-3-5-sonnet-20241022',
//             temperature: 0.7
//         }
//     }
// };

/**
 * Helper function to get the active configuration
 */
export const getProviderConfig = () => {
    const config = AI_PROVIDER_CONFIG;
    
    console.log(`AI Provider Configuration:`);
    console.log(`   Mode: ${config.mode}`);
    
    if (config.mode === 'manual') {
        console.log(`   Forced Provider: ${config.forcedProvider}`);
        if (config.providers[config.forcedProvider]) {
            console.log(`   Model: ${config.providers[config.forcedProvider].defaultModel}`);
        }
    } else {
        console.log(`   Detection: Automatic (based on available API keys)`);
    }
    
    return config;
};
