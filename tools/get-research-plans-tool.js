import { Tool } from './base/tool.js';
import * as database from '../database/database.js';

/**
 * A tool that gets a user's research plans from the database.
 */
export class GetResearchPlansTool extends Tool {
    constructor() {
        super(
            "get_research_plans",
            "Gets a user's research plans from the database.",
            {}
        );
    }

    /**
     * Executes the tool's logic.
     * @param {string} argsString 
     * @returns {Array}
     */
    async execute(argsString) {
        try {
            const result = await database.getResearchPlans();
            return result;
        } catch (error) {
            return [{ status: "error", message: error.message }];
        }
    }
}
