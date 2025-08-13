import { Tool } from './base/tool.js';
import * as database from '../database/database.js';


export class StoreResearchPlanTool extends Tool {
    constructor() {
        super(
            "store_research_plan",
            "Stores a user's research plan in the database.",
            {
                short_summary: {
                    type: "string",
                    description: "A very short summary title of the research plan.",
                },
                details: {
                    type: "string",
                    description: "The details of the research plan.",
                },
            }
        );
    }

    async execute(argsString) {
        try {
            const args = JSON.parse(argsString);
            const result = await database.addResearchPlan(
                args.short_summary, 
                args.details
            );
            return result;
        } catch (error) {
            return { status: "error", message: error.message };
        }
    }
}
