# Multi-Agent Research System

An intelligent research automation platform that combines AI agents to conduct comprehensive web research. The system uses OpenAI's function calling to intelligently route requests between research workflows and general conversation.

## Features

- **Smart Request Routing** - AI-powered classification between research and general queries
- **Automated Research Workflow** - Complete end-to-end research automation
- **Interactive & Automated Modes** - Support for both guided and direct research initiation
- **Content Scraping & Evaluation** - Playwright-powered scraping with AI content assessment
- **Article Generation** - AI-generated articles with custom illustrations
- **Organized Output Management** - Timestamped research folders with complete audit trails
- **SQLite Database** - Persistent storage for research plans and history

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- OpenAI API key
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
OPENAI_API_KEY=your_openai_api_key_here
BRAVE_API_KEY=your_brave_api_key_here
```

## Usage

Run the application:
```bash
npm start
```

The system provides two interaction modes:

### Research Mode
When you ask research-related questions, the system automatically triggers the full research workflow:

**Example research requests:**
- "Research artificial intelligence trends"
- "Investigate climate change impacts"  
- "Study the history of cryptocurrency"

**Research workflow:**
1. **Research Planning** - AI generates a comprehensive research plan
2. **Web Search** - Automated search term generation and web searches  
3. **Content Scraping** - Extract full content from relevant web pages
4. **Content Evaluation** - AI-powered relevancy assessment and filtering
5. **Article Generation** - AI-powered 3-page articles with generated images

### General Chat Mode
For non-research queries, the system provides direct conversational responses:

**Example general requests:**
- "What's the weather today?" → "I can't do it"
- "Tell me a joke" → *Provides a joke*
- "What's 2+2?" → "The answer is 4"

**Commands:**
- Type your question or research request
- Type `exit` to quit the application

## Output Structure

Each research session creates a timestamped folder in `/output/` containing:
- `search-terms-[timestamp].txt` - Generated search terms and configuration
- `scraping-results-[timestamp].txt` - Full content extraction results  
- `content-evaluation-[timestamp].txt` - Relevancy scores and filtering decisions
- `research_article_[timestamp].md` - AI-generated 3-page research article
- `article_image_[timestamp].png` - AI-generated article illustration

## Architecture

The system uses a modular agent-based architecture:

```
agents/
├── base/agent.js           # Base agent class
├── research-planner-agent.js
├── web-search-agent.js
├── scraping-agent.js
├── evaluator-agent.js
├── article-writer-agent.js
└── summary-report-agent.js

tools/
├── base/tool.js            # Base tool class  
├── store-research-plan-tool.js
├── get-research-plans-tool.js
└── delete-research-plan-tool.js

database/
└── database.js             # SQLite operations
```

## API Keys

- **OpenAI API**: Get from [platform.openai.com](https://platform.openai.com/api-keys)
- **Brave Search API**: Get from [api.search.brave.com](https://api.search.brave.com/)


