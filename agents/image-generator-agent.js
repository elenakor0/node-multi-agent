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
            
            const imagePrompt = this.createImagePrompt(topic, style);
            console.log(`Image prompt: ${imagePrompt}`);

            const response = await this.client.images.generate({
                model: "dall-e-3",
                prompt: imagePrompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            });

            return response.data[0].url;
        } catch (error) {
            console.error("Error generating image:", error);
            return null;
        }
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
            abstract: `Abstract, conceptual illustration about ${topic}. Creative interpretation with interesting shapes and colors. No text overlays.`
        };

        return stylePrompts[style] || stylePrompts.professional;
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
