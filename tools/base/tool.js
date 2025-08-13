export class Tool {
    constructor(name, description, parameters) {
        this.name = name;
        this.description = description;
        this.parameters = parameters;
    }

    getSchema() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: this.description,
                parameters: {
                    type: "object",
                    properties: this.parameters,
                    additionalProperties: false,
                    required: Object.keys(this.parameters),
                },
            }
        };
    }

    async execute(args) {
        throw new Error("Each tool must implement its own execute method.");
    }
}
