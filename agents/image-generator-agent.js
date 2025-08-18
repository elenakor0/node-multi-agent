import { Agent } from './base/agent.js';
import fs from 'fs/promises';

export class ImageGeneratorAgent extends Agent {
    constructor() {
        super();
    }

    /**
     * Generates an AI image using DALL-E 3
     * @param {string} topic - The topic or description for the image
     * @param {string} style - Optional style specification (default: professional)
     * @returns {Promise<string|null>} The image URL or null if failed
     */
    async generateImage(topic, style = "professional") {
        try {
            console.log(`Generating AI image for: "${topic}"`);
            
            // Auto-detect call-to-action button requests
            const isButtonRequest = this.isCallToActionRequest(topic);
            if (isButtonRequest && style === "professional") {
                style = "callToAction";
                console.log("Detected call-to-action button request, switching to CTA style");
            }
            
            const imagePrompt = this.createImagePrompt(topic, style);
            console.log(`Image prompt: ${imagePrompt}`);

            // Image generation is specific to OpenAI, so we need to access the OpenAI provider
            const activeProvider = this.aiProvider.getActiveProvider();
            
            // Check if the active provider supports image generation
            if (!activeProvider.supportsImageGeneration || !activeProvider.supportsImageGeneration()) {
                throw new Error('Image generation is only supported with OpenAI provider. Please ensure OpenAI is configured and active.');
            }

            // Use appropriate sizing for buttons vs regular images
            const imageSize = (style === "callToAction") ? "1024x1024" : "1024x1024";

            const result = await activeProvider.generateImage({
                prompt: imagePrompt,
                model: "dall-e-3",
                size: imageSize,
                quality: "standard"
            });

            if (!result.success) {
                throw new Error('Failed to generate image');
            }

            return result.imageUrl;
        } catch (error) {
            console.error("Error generating image:", error);
            return null;
        }
    }

    /**
     * Detects if the user input is requesting a call-to-action button
     * @param {string} input - The user's input description
     * @returns {boolean} True if it's a button request
     */
    isCallToActionRequest(input) {
        const buttonKeywords = [
            'button', 'call-to-action', 'cta', 'clickable',
            'call to action', 'click here', 'sign up', 'start',
            'get started', 'download', 'buy now', 'learn more',
            'contact us', 'subscribe', 'join', 'register'
        ];
        
        const lowerInput = input.toLowerCase();
        return buttonKeywords.some(keyword => lowerInput.includes(keyword));
    }

    /**
     * Creates an optimized prompt for image generation
     * @param {string} topic - The main topic
     * @param {string} style - The desired style
     * @returns {string} The formatted prompt
     */
    createImagePrompt(topic, style) {
        const stylePrompts = {
            professional: `Professional, high-quality illustration about ${topic}. Modern, clean design with informative and visually appealing elements. No text overlays.`,
            artistic: `Artistic and creative illustration about ${topic}. Beautiful, expressive design with vibrant colors and artistic flair. No text overlays.`,
            minimalist: `Minimalist, clean illustration about ${topic}. Simple, elegant design with focus on essential elements. No text overlays.`,
            realistic: `Realistic, detailed illustration about ${topic}. High-quality, photorealistic representation with accurate details. No text overlays.`,
            abstract: `Abstract, conceptual illustration about ${topic}. Creative interpretation with interesting shapes and colors. No text overlays.`,
            callToAction: this.createCallToActionPrompt(topic)
        };

        return stylePrompts[style] || stylePrompts.professional;
    }

    /**
     * Creates a specialized prompt for call-to-action buttons
     * @param {string} description - The user's description of the button
     * @returns {string} The optimized CTA button prompt
     */
    createCallToActionPrompt(description) {
        // Extract key elements from the description
        const colorMatch = description.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/);
        
        // Try multiple patterns to extract button text
        let buttonText = 'Click Here'; // default fallback
        
        // Pattern 1: Text in double quotes (regular or smart quotes)
        let textMatch = description.match(/[""]([^""]+)[""]/) || description.match(/"([^"]+)"/);
        if (textMatch) {
            buttonText = textMatch[1];
        } else {
            // Pattern 2: "should say X" or "that says X"
            textMatch = description.match(/(?:should say|that says|text saying|says)\s+[""]?([^"""!.]+)[""]?[!.]?/i);
            if (textMatch) {
                buttonText = textMatch[1].trim();
            } else {
                // Pattern 3: Look for common button phrases
                const buttonPhrases = description.match(/\b(start chatting|get started|click here|sign up|download|buy now|learn more|contact us|subscribe|join|register|start now)\b/gi);
                if (buttonPhrases && buttonPhrases.length > 0) {
                    buttonText = buttonPhrases[0];
                }
            }
        }
        
        const backgroundColor = colorMatch ? colorMatch[0] : '#336699';
        
        // Check for chat-related keywords
        const isChatButton = /chat|message|talk|conversation|communicate/i.test(description);
        
        let iconDescription = '';
        if (isChatButton) {
            iconDescription = 'with a small chat bubble or message icon on the left side';
        } else if (/download/i.test(description)) {
            iconDescription = 'with a small download arrow icon';
        } else if (/play/i.test(description)) {
            iconDescription = 'with a small play triangle icon';
        } else if (/arrow|next/i.test(description)) {
            iconDescription = 'with a small arrow pointing right';
        }

        return `Create a modern, professional call-to-action button image. The button should have:
- Background color: ${backgroundColor}
- Text that says "${buttonText}" in clean, readable white or light colored font
- Rounded corners for a modern look
- Subtle shadow or gradient for depth
- ${iconDescription}
- Professional web design aesthetic
- Optimized for web use as a clickable button
- Clean, minimalist design that would fit well on a website or app
- Proper contrast between text and background for accessibility`;
    }

    /**
     * Downloads an image from URL to local file
     * @param {string} imageUrl - The URL of the image to download
     * @param {string} filePath - The local file path to save the image
     * @returns {Promise<boolean>} True if successful, false otherwise
     */
    async downloadImage(imageUrl, filePath) {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.writeFile(filePath, buffer);
            console.log(`Image saved to: ${filePath}`);
            return true;
        } catch (error) {
            console.error("Error downloading image:", error);
            return false;
        }
    }

    /**
     * Creates a folder for storing generated images
     * @param {string} topic - The topic to base the folder name on
     * @returns {Promise<string>} The created folder path
     */
    
    async createImageFolder(topic) {
        try {
            // Create a clean folder name from the topic
            const cleanTopic = topic
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 0)
                .slice(0, 4)
                .join('-') || 'generated-image';

            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const folderName = `${cleanTopic}-${timestamp}`;
            const imageFolderPath = `output/${folderName}`;

            await fs.mkdir(imageFolderPath, { recursive: true });
            console.log(`Created image folder: ${imageFolderPath}`);
            return imageFolderPath;
        } catch (error) {
            console.error('Error creating image folder:', error);
            throw error;
        }
    }

    /**
     * Main method to generate and save an image
     * @param {string} topic - The topic for the image
     * @param {string} style - Optional style (default: professional)
     * @returns {Promise<Object>} Object containing image path and metadata
     */
    async run(topic, style = "professional") {
        try {
            console.log(`\n=== GENERATING IMAGE ===`);
            console.log(`Topic: ${topic}`);
            console.log(`Style: ${style}`);

            // Create folder for the image
            const imageFolderPath = await this.createImageFolder(topic);

            // Generate the image
            const imageUrl = await this.generateImage(topic, style);
            
            if (!imageUrl) {
                throw new Error("Failed to generate image");
            }

            // Create filename
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
            const imageFilename = `generated_image_${timestamp}.png`;
            const imagePath = `${imageFolderPath}/${imageFilename}`;

            // Download and save the image
            const downloadSuccess = await this.downloadImage(imageUrl, imagePath);
            
            if (!downloadSuccess) {
                throw new Error("Failed to download and save image");
            }

            console.log("\n=== IMAGE GENERATION COMPLETE ===");
            console.log(`Image saved to: ${imagePath}`);

            return {
                success: true,
                imagePath,
                imageUrl,
                topic,
                style,
                folderPath: imageFolderPath
            };

        } catch (error) {
            console.error('Error in image generator agent:', error);
            return {
                success: false,
                error: error.message,
                topic,
                style
            };
        }
    }
}
