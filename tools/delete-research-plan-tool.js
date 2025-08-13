import { Tool } from './base/tool.js';
import * as database from '../database/database.js';

/**
 * A tool that deletes a user's research plan from the database.
 */
export class DeleteResearchPlanTool extends Tool {
    constructor() {
        super(
            "delete_research_plan",
            "Deletes a user's research plan from the database.",
            {
                id: {
                    type: "integer",
                    description: "The ID of the research plan to delete.",
                },
            }
        );
    }

    /**
     * Executes the tool's logic.
     * @param {string} argsString 
     * @returns {Object|null}
     */
    async execute(argsString) {
        try {
            const args = JSON.parse(argsString);
            await database.deleteResearchPlan(args.id);
            return { status: "success", message: "Research plan deleted" };
        } catch (error) {
            return { status: "error", message: error.message };
        }
    }
}
