import { Definition, DefinitionConfig, ServerlessFunctionConfig } from "./types";
export declare class DefinitionGenerator {
    version: string;
    definition: Definition;
    config: DefinitionConfig;
    private root;
    /**
     * Constructor
     */
    constructor(config: DefinitionConfig, root: string);
    parse(): Promise<this>;
    validate(): {
        valid: boolean;
        context: Array<string>;
        warnings: Array<any>;
        error?: Array<any>;
    };
    /**
     * Add Paths to OpenAPI Configuration from Serverless function documentation
     * @param config Add
     */
    readFunctions(config: Array<ServerlessFunctionConfig>): void;
    /**
     * Generate Operation objects from the Serverless Config.
     *
     * @link https://github.com/OAI/OpenAPI-Specification/blob/3.0.0/versions/3.0.0.md#operationObject
     * @param funcName
     * @param documentationConfig
     */
    private getOperationFromConfig;
    /**
     * Derives Path, Query and Request header parameters from Serverless documentation
     * @param documentationConfig
     */
    private getParametersFromConfig;
    /**
     * Derives request body schemas from event documentation configuration
     * @param documentationConfig
     */
    private getRequestBodiesFromConfig;
    private attachExamples;
    /**
     * Gets response bodies from documentation config
     * @param documentationConfig
     */
    private getResponsesFromConfig;
    private getResponseContent;
    private getHttpEvents;
}
