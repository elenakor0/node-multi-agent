import OpenAI from 'openai';
import fs from 'fs/promises';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const createResearchFolderName = async (userInput) => {
    try {
        console.log("Generating descriptive folder name...");
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a folder naming assistant. Create a descriptive folder name based on the user's research request.
                    
                    Rules:
                    - Maximum 5 words
                    - Use lowercase
                    - Separate words with dashes
                    - Be descriptive and concise
                    - Focus on the main research topic/theme
                    - No special characters except dashes
                    - Return ONLY the folder name, nothing else
                    
                    Examples:
                    "Research climate change effects" → "climate-change-effects"
                    "Write an article about renewable energy" → "renewable-energy-article"
                    "Investigate cryptocurrency market trends" → "cryptocurrency-market-trends"
                    "Study artificial intelligence in healthcare" → "ai-healthcare-research"`
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        });

        let folderName = completion.choices[0].message.content.trim().toLowerCase();
        
        // Clean up the response - remove quotes, extra spaces, and ensure only valid characters
        folderName = folderName
            .replace(/['"]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        // Fallback if AI response is invalid
        if (!folderName || folderName.length === 0) {
            folderName = userInput
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 0)
                .slice(0, 3)
                .join('-') || 'research';
        }
        
        // Add timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
        
        return `${folderName}-${timestamp}`;
        
    } catch (error) {
        console.error("Error generating folder name:", error);
        
        // Fallback to original logic
        const words = userInput
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 0)
            .slice(0, 3);
        
        const namePrefix = words.join('-') || 'research';
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
        
        return `${namePrefix}-${timestamp}`;
    }
};

export const createResearchFolder = async (folderName) => {
    const researchPath = `output/${folderName}`;
    await fs.mkdir(researchPath, { recursive: true });
    console.log(`Created research folder: ${researchPath}`);
    return researchPath;
};
