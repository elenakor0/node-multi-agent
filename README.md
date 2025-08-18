# Multi-Agent Node.js System

An intelligent automation platform that combines AI agents to conduct various personal workflows (like doing a research or generating an image). The system supports multiple AI providers (OpenAI, Google Gemini, Anthropic Claude) with intelligent routing, automatic fallbacks, and tool calling capabilities.

## Features

### **Multi-Provider AI Support**
- **OpenAI Integration** - GPT-4, GPT-3.5-turbo with function calling
- **Google Gemini** - Gemini 1.5 Pro/Flash with tool integration  
- **Anthropic Claude** - Claude 3.5 Sonnet, Claude 3 Haiku for advanced reasoning
- **Automatic Fallbacks** - Seamless provider switching on errors/rate limits
- **Smart Provider Selection** - Choose best provider per task

### **Research Automation**
- **Smart Request Routing** - AI-powered classification between research and general queries
- **Automated Research Workflow** - Complete end-to-end research automation
- **Interactive & Automated Modes** - Support for both guided and direct research initiation
- **Content Scraping & Evaluation** - Playwright-powered scraping with AI content assessment
- **Article Generation** - AI-generated articles with custom illustrations
- **Image Generation** - AI-powered image creation for articles and standalone use
- **URL Summarization** - Extract and summarize content from any web page

### **Organization & Management**
- **Modular Architecture** - Clean separation of workflows, agents, tools, and AI providers
- **Organized Output Management** - Timestamped research folders with complete audit trails
- **Database Integration** - SQLite for research plan storage and management


## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- At least one AI provider API key:
  - OpenAI API key (recommended)
  - Google Gemini API key (optional)
  - Anthropic Claude API key (optional)
- Brave Search API key

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

3. Configure environment variables:
```bash
cp env.example .env
```

4. Add your API keys to `.env`:
```env
# OpenAI (Primary Provider - Recommended)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# Google Gemini (Optional - Fast & Cost-Effective)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_DEFAULT_MODEL=gemini-1.5-flash

# Anthropic Claude (Optional - Advanced Reasoning)
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_DEFAULT_MODEL=claude-3-haiku-20240307

# Search Provider (Required)
BRAVE_API_KEY=your_brave_api_key_here
```

> **Note**: You only need at least one AI provider API key. The system will automatically use available providers and provide fallbacks.

## Usage

Run the application:
```bash
npm start
```

The system provides multiple interaction modes and automatically uses the best available AI provider:

### Research Mode
When you ask research-related questions, the system automatically triggers the full research workflow:

**Example research requests:**
- "Research artificial intelligence trends" → *Generates research summary*
- "Write an article about renewable energy" → *Creates comprehensive article with image*
- "Investigate climate change impacts" → *Full research workflow with evaluation*
- "Study the history of cryptocurrency" → *Multi-source research compilation*

**Research workflow:**
1. **Research Planning** - AI generates a comprehensive research plan
2. **Web Search** - Automated search term generation and web searches  
3. **Content Scraping** - Extract full content from relevant web pages
4. **Content Evaluation** - AI-powered relevancy assessment and filtering
5. **Article Generation** - AI-powered 3-page articles with generated images

### Image Generation Mode
Generate AI-powered images for any topic:

**Example image requests:**
- "Generate an image of space exploration" → *Creates professional space image*
- "Create an artistic sunset over mountains" → *Artistic style landscape*
- "Make a minimalist logo design" → *Clean, simple design*

### URL Summarization Mode
Extract and summarize content from any web page:

**Example URL requests:**
- "Summarize this URL: https://example.com/article" → *Extracts and summarizes content*
- "What does this website say?" → *Comprehensive page analysis*

### General Chat Mode
For non-research queries, the system provides direct conversational responses:

**Example general requests:**
- "What's the weather today?" → *General information*
- "Tell me a joke" → *Provides a joke*
- "What's 2+2?" → *Direct answers*

**Commands:**
- Type your question or research request
- Type `exit` to quit the application

## Output Structure

Each operation creates a timestamped folder in `/output/` containing:

**Research Projects:**
- `search-terms-[timestamp].txt` - Generated search terms and configuration
- `scraping-results-[timestamp].txt` - Full content extraction results  
- `content-evaluation-[timestamp].txt` - Relevancy scores and filtering decisions
- `research_article_[timestamp].md` - AI-generated 3-page research article
- `article_image_[timestamp].png` - AI-generated article illustration

**Image Generation:**
- `generated_image_[timestamp].png` - AI-generated images with metadata

**URL Summaries:**
- `url_summary_[timestamp].md` - Extracted and summarized web content

## Architecture

The system uses a modular, multi-provider architecture:

```
ai-providers/              # Multi-Provider AI System
├── base-provider.js       # Abstract base class for all providers
├── openai-provider.js     # OpenAI GPT implementation
├── gemini-provider.js     # Google Gemini implementation  
├── claude-provider.js     # Anthropic Claude implementation
├── provider-manager.js    # Provider management & fallbacks
└── index.js              # Clean exports

workflows/                # Organized Workflow Logic
├── research-workflow.js   # Complete research automation
├── image-generation-workflow.js # AI image creation
├── url-summarization-workflow.js # Web content extraction
└── index.js

agents/                   # Specialized AI Agents
├── base/agent.js         # Base agent with provider support
├── research-planner-agent.js
├── web-search-agent.js
├── scraping-agent.js
├── evaluator-agent.js
├── article-writer-agent.js
├── summary-report-agent.js
├── image-generator-agent.js
└── url-summarizer-agent.js

tools/                    # Database Tools
├── base/tool.js         # Base tool class  
├── store-research-plan-tool.js
├── get-research-plans-tool.js
└── delete-research-plan-tool.js

utils/                   # Utility Functions
├── folder-name-generator.js
└── index.js

database/
└── database.js          # SQLite operations
```

## AI Provider System

The system automatically detects and manages multiple AI providers:

### Provider Capabilities

| Feature | OpenAI | Gemini | Claude |
|---------|--------|--------|--------|
| Chat Completion | Yes | Yes | Yes |
| Function Calling | Yes | Yes | Yes |
| Image Generation | Yes | No | No |
| Advanced Reasoning | Yes | Yes | Yes |
| Cost Efficiency | Good | Excellent | Good |

### Automatic Fallbacks

- **Primary**: Uses your preferred/configured provider
- **Secondary**: Automatically switches on rate limits or errors
- **Tertiary**: Falls back to any available provider
- **Graceful Degradation**: Maintains functionality even with provider failures

## API Keys

### AI Providers
- **OpenAI API**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
- **Google Gemini API**: Get from [makersuite.google.com](https://makersuite.google.com/app/apikey)  
- **Anthropic Claude API**: Get from [console.anthropic.com](https://console.anthropic.com/)

### Search Provider
- **Brave Search API**: Get from [api.search.brave.com](https://api.search.brave.com/)

## Advanced Configuration

### Provider Selection

#### Automatic Detection (Default)
The system automatically selects the best available provider based on your API keys:

```env
# Set default models per provider
OPENAI_DEFAULT_MODEL=gpt-4o-mini      # Fast, cost-effective
GEMINI_DEFAULT_MODEL=gemini-1.5-flash  # Very fast, economical
CLAUDE_DEFAULT_MODEL=claude-3-haiku-20240307  # Balanced performance
```

#### Hardcoded Provider Selection
To force a specific provider, edit `ai-provider-config.js`:

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

**Quick Presets Available:**
- OpenAI GPT-4 (best overall performance)
- Gemini Flash (fastest, most economical)  
- Claude Sonnet (superior reasoning)

See `HARDCODED-PROVIDER-GUIDE.md` for detailed instructions.

### Provider Strengths
- **OpenAI**: Best overall performance, image generation, widely supported
- **Gemini**: Fastest responses, most cost-effective, good for high-volume tasks
- **Claude**: Superior reasoning, excellent for complex analysis and writing

## Troubleshooting

### Common Issues

1. **No AI providers available**
   - Check that at least one API key is set in `.env`
   - Verify API key validity and format

2. **Provider initialization failed**
   - Check network connectivity
   - Verify API key permissions and quotas
   - Review console logs for specific error messages

3. **Rate limiting**
   - System automatically switches providers on rate limits
   - Consider using multiple providers for higher throughput

4. **Missing dependencies**
   ```bash
   npm install @google/generative-ai @anthropic-ai/sdk
   ```

## Contributing

Feel free to contribute by:
- Adding new AI providers
- Implementing new workflow types
- Improving agent capabilities
- Enhancing provider fallback logic


