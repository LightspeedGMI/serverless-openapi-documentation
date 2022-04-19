import * as Serverless from "serverless";
import { Format, DefinitionConfig } from "./types";
interface Options {
    indent: number;
    format: Format;
    output: string;
}
interface ProcessedInput {
    options: Options;
}
interface CustomVars {
    documentation: DefinitionConfig;
}
interface Service {
    custom: CustomVars;
}
interface Variables {
    service: Service;
    populateService(): Promise<any>;
}
interface FullServerless extends Serverless {
    variables: Variables;
    processedInput: ProcessedInput;
}
export declare class ServerlessOpenApiDocumentation {
    hooks: any;
    commands: any;
    /** Serverless Instance */
    private serverless;
    /** Serverless Service Custom vars */
    private customVars;
    /**
     * Constructor
     * @param serverless
     * @param options
     */
    constructor(serverless: FullServerless, options: any);
    private log;
    /**
     * Generates OpenAPI Documentation based on serverless configuration and functions
     */
    generate(): Promise<void>;
    /**
     * Processes CLI input by reading the input from serverless
     * @returns config IConfigType
     */
    private processCliInput;
}
export {};
