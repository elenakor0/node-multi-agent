# Multi-Agent Research System

An intelligent research automation platform that combines AI agents to conduct comprehensive web research. The system guides users through research planning, executes automated searches, evaluates content relevancy, and generates detailed reports.

## Features

- Interactive research planning with AI guidance
- Automated web search with rate limiting and retry logic
- Content scraping and extraction using Playwright
- Intelligent content evaluation and filtering
- Organized output with timestamped research folders
- SQLite database for research plan persistence

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

The system guides you through a structured research workflow:

1. **Research Planning** - Interactive session to define research objectives
2. **Web Search** - Automated search term generation and web searches  
3. **Content Scraping** - Extract full content from relevant web pages
4. **Content Evaluation** - AI-powered relevancy assessment and filtering
5. **Report Generation** - Comprehensive markdown reports with source links

Commands during research planning:
- Describe your research topic and objectives
- Type `accept` when satisfied with the research plan
- Type `exit` to quit

## Output Structure

Each research session creates a timestamped folder in `/output/` containing:
- `search-terms-[timestamp].txt` - Generated search terms and configuration
- `scraping-results-[timestamp].txt` - Full content extraction results  
- `content-evaluation-[timestamp].txt` - Relevancy scores and filtering decisions
- `summary_report_[timestamp].md` - Final research report

## Architecture

The system uses a modular agent-based architecture:

```
agents/
├── base/agent.js           # Base agent class
├── research-planner-agent.js
├── web-search-agent.js
├── scraping-agent.js
├── evaluator-agent.js
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

## License

MIT License
