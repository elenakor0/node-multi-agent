import { Agent } from './base/agent.js';
import { ImageGeneratorAgent } from './image-generator-agent.js';
import fs from 'fs/promises';

export class ArticleWriterAgent extends Agent {
    constructor() {
        super();
        this.setInitialPrompt();
    }

    setInitialPrompt() {
        this.messages = [
            {
                role: "system",
                content: `
                You are a professional article writer specializing in creating comprehensive, well-researched articles.
                You will be given scraped content from web research and need to create a detailed 3-page article.
                
                Your article should:
                - Be approximately 3 pages long (1200-1500 words)
                - Have a compelling title and clear structure with headers
                - Include an engaging introduction that hooks the reader
                - Develop main points with supporting evidence from the research
                - Include relevant examples and insights from the source material
                - Have a strong conclusion that ties everything together
                - Be written in a professional yet accessible tone
                - Include source citations where appropriate
                
                Format the article in markdown with proper headers, bullet points, and emphasis where needed.
                Do not include any meta-commentary or explanations, just return the complete article.
                `
            }
        ];
    }

    async generateArticleImage(articleTitle, researchTopic, researchPath) {
        try {
            console.log("Generating AI image for the article...");
            
            const imageGenerator = new ImageGeneratorAgent();
            // Create a descriptive topic for the image that includes both title and topic context
            const imageTopic = `Professional article illustration about ${researchTopic}, titled "${articleTitle}"`;
            
            // Generate the image using the ImageGeneratorAgent
            const imageUrl = await imageGenerator.generateImage(imageTopic, "professional");
            
            if (!imageUrl) {
                return null;
            }

            // Download the image to the research folder
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const imageFilename = `article_image_${timestamp}.png`;
            const imagePath = `${researchPath}/${imageFilename}`;
            
            const downloadSuccess = await imageGenerator.downloadImage(imageUrl, imagePath);
            
            return downloadSuccess ? imagePath : null;
        } catch (error) {
            console.error("Error generating article image:", error);
            return null;
        }
    }

    async writeArticleToFile(article, researchPath) {
        try {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const filename = `research_article_${timestamp}.md`;
            const outputPath = `${researchPath}/${filename}`;

            await fs.writeFile(outputPath, article, 'utf-8');
            console.log(`Article saved to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Error writing article file:', error);
            throw error;
        }
    }

    extractResearchTopic(scrapedContent) {
        // Try to extract a common theme from search terms
        const searchTerms = scrapedContent
            .map(item => item.search_term)
            .filter(term => term && term.length > 0);
        
        if (searchTerms.length > 0) {
            // Get the most common words from search terms
            const words = searchTerms.join(' ').toLowerCase().split(/\s+/);
            const wordCount = {};
            words.forEach(word => {
                if (word.length > 3) { // Only count significant words
                    wordCount[word] = (wordCount[word] || 0) + 1;
                }
            });
            
            // Get top words
            const topWords = Object.entries(wordCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([word]) => word);
            
            return topWords.join(' ');
        }
        
        return 'research topic';
    }

    async run(scrapedContent, researchPath = 'output') {
        console.log(`Creating comprehensive article from ${scrapedContent.length} content pieces...`);
        
        try {
            // Filter content that should be included
            const relevantContent = scrapedContent.filter(item => 
                item.success && 
                item.content && 
                item.content.trim().length > 200
            );

            if (relevantContent.length === 0) {
                throw new Error("No substantial content available for article creation");
            }

            console.log(`Using ${relevantContent.length} pieces of content for article...`);

            // Prepare content for article generation
            const contentSummary = relevantContent.map((item, index) => ({
                source: index + 1,
                url: item.url,
                title: item.title || 'Untitled',
                content: item.content.substring(0, 1500), // Limit content per source
                search_term: item.search_term
            }));

            // Extract research topic for image generation
            const researchTopic = this.extractResearchTopic(relevantContent);

            // Create article generation prompt
            const articlePrompt = `
Based on the following research content, write a comprehensive 3-page article (1200-1500 words).

RESEARCH CONTENT:
${JSON.stringify(contentSummary, null, 2)}

Create a well-structured, engaging article that synthesizes this information into a cohesive narrative.
Include a compelling title, clear sections, and maintain journalistic quality throughout.
            `;

            // Generate article
            console.log("Generating article content...");
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    ...this.messages,
                    { role: "user", content: articlePrompt }
                ],
            });

            const article = response.choices[0].message.content.trim();
            
            // Extract title from article for image generation
            const titleMatch = article.match(/^#\s*(.+)$/m);
            const articleTitle = titleMatch ? titleMatch[1] : `Research Article on ${researchTopic}`;

            // Generate and download image using ImageGeneratorAgent
            const imagePath = await this.generateArticleImage(articleTitle, researchTopic, researchPath);

            // Add image reference to article if image was generated
            let finalArticle = article;
            if (imagePath) {
                const imageRef = `\n\n![Article Illustration](${imagePath.split('/').pop()})\n\n`;
                // Insert image after the title
                finalArticle = article.replace(/^(#\s*.+\n)/, `$1${imageRef}`);
            }

            // Save article to file
            const articlePath = await this.writeArticleToFile(finalArticle, researchPath);

            console.log("\n=== ARTICLE GENERATION COMPLETE ===");
            console.log(`Article saved to: ${articlePath}`);
            if (imagePath) {
                console.log(`Article image saved to: ${imagePath}`);
            }
            console.log(`Article length: ${finalArticle.split(' ').length} words`);

            return {
                article: finalArticle,
                articlePath,
                imagePath,
                title: articleTitle,
                wordCount: finalArticle.split(' ').length
            };

        } catch (error) {
            console.error('Error in article writer agent:', error);
            throw error;
        }
    }
}

