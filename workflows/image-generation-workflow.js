import { ImageGeneratorAgent } from '../agents/index.js';

export const runImageGenerationWorkflow = async (topic, style = "professional") => {
    try {
        console.log("\n=== STARTING IMAGE GENERATION ===");
        console.log(`Topic: ${topic}`);
        console.log(`Style: ${style}`);

        const imageGenerator = new ImageGeneratorAgent();
        const result = await imageGenerator.run(topic, style);

        if (result.success) {
            console.log("\n=== IMAGE GENERATION COMPLETE ===");
            console.log(`Image saved to: ${result.imagePath}`);
            console.log(`Folder: ${result.folderPath}`);
            console.log(`Style: ${result.style}`);
        } else {
            console.log("\n=== IMAGE GENERATION FAILED ===");
            console.log(`Error: ${result.error}`);
        }

        return result;

    } catch (error) {
        console.error("Error in image generation workflow:", error);
        throw error;
    }
};
