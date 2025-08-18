/**
 * Hardcoded AI Provider Examples
 * 
 * This file shows different ways to force specific AI providers
 * Copy any of these examples into your main.js or ai-provider-config.js
 */

// ====================================
// EXAMPLE 1: Force OpenAI with GPT-4
// ====================================

export const OPENAI_GPT4_CONFIG = {
    mode: 'manual',
    forcedProvider: 'openai',
    providers: {
        openai: {
            defaultModel: 'gpt-4',
            temperature: 0.7
        }
    }
};

// ====================================
// EXAMPLE 2: Force Gemini for Speed
// ====================================

export const GEMINI_FAST_CONFIG = {
    mode: 'manual',
    forcedProvider: 'gemini',
    providers: {
        gemini: {
            defaultModel: 'gemini-1.5-flash',
            temperature: 0.7
        }
    }
};

// ====================================
// EXAMPLE 3: Force Claude for Reasoning
// ====================================

export const CLAUDE_SMART_CONFIG = {
    mode: 'manual',
    forcedProvider: 'claude',
    providers: {
        claude: {
            defaultModel: 'claude-3-5-sonnet-20241022',
            temperature: 0.7
        }
    }
};

// ====================================
// EXAMPLE 4: Direct Code in main.js
// ====================================

/*
// Add this to your main.js main() function:

const main = async () => {
    try {
        await initDb();
        
        // OPTION A: Force OpenAI
        await aiProviderManager.initializeSingleProvider('openai', {
            defaultModel: 'gpt-4o-mini'
        });
        
        // OPTION B: Force Gemini
        // await aiProviderManager.initializeSingleProvider('gemini', {
        //     defaultModel: 'gemini-1.5-flash'
        // });
        
        // OPTION C: Force Claude
        // await aiProviderManager.initializeSingleProvider('claude', {
        //     defaultModel: 'claude-3-haiku-20240307'
        // });
        
        // DON'T CALL THIS if using hardcoded provider above:
        // await aiProviderManager.initializeProviders();
        
        console.log("Multi-Agent Research System Initialized");
        // ... rest of your code
    }
};
*/

// ====================================
// EXAMPLE 5: Environment-Based Selection
// ====================================

export const getEnvironmentBasedConfig = () => {
    const environment = process.env.NODE_ENV || 'development';
    
    switch (environment) {
        case 'development':
            return {
                mode: 'manual',
                forcedProvider: 'gemini', // Fast and cheap for dev
                providers: {
                    gemini: {
                        defaultModel: 'gemini-1.5-flash',
                        temperature: 0.7
                    }
                }
            };
            
        case 'production':
            return {
                mode: 'manual',
                forcedProvider: 'openai', // Reliable for production
                providers: {
                    openai: {
                        defaultModel: 'gpt-4o-mini',
                        temperature: 0.7
                    }
                }
            };
            
        case 'research':
            return {
                mode: 'manual',
                forcedProvider: 'claude', // Smart reasoning for research
                providers: {
                    claude: {
                        defaultModel: 'claude-3-5-sonnet-20241022',
                        temperature: 0.7
                    }
                }
            };
            
        default:
            return { mode: 'auto' }; // Fallback to auto-detection
    }
};

// ====================================
// EXAMPLE 6: Task-Specific Providers
// ====================================

export const TASK_SPECIFIC_CONFIGS = {
    // For image generation tasks
    imageGeneration: {
        mode: 'manual',
        forcedProvider: 'openai', // Only OpenAI supports image generation
        providers: {
            openai: {
                defaultModel: 'gpt-4o-mini',
                temperature: 0.8 // Slightly more creative
            }
        }
    },
    
    // For research and analysis
    research: {
        mode: 'manual',
        forcedProvider: 'claude',
        providers: {
            claude: {
                defaultModel: 'claude-3-5-sonnet-20241022',
                temperature: 0.7
            }
        }
    },
    
    // For high-volume processing
    bulk: {
        mode: 'manual',
        forcedProvider: 'gemini',
        providers: {
            gemini: {
                defaultModel: 'gemini-1.5-flash',
                temperature: 0.7
            }
        }
    }
};

// ====================================
// USAGE INSTRUCTIONS
// ====================================

/*
To use any of these examples:

1. COPY the configuration you want
2. PASTE it into ai-provider-config.js, replacing the existing AI_PROVIDER_CONFIG
3. RESTART the application

For example, to use Claude for reasoning:

// In ai-provider-config.js
export const AI_PROVIDER_CONFIG = {
    mode: 'manual',
    forcedProvider: 'claude',
    providers: {
        claude: {
            defaultModel: 'claude-3-5-sonnet-20241022',
            temperature: 0.7
        }
    }
};
*/
