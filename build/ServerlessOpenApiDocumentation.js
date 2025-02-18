"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerlessOpenApiDocumentation = void 0;
const chalk = require("chalk");
const fs = require("fs");
const YAML = require("js-yaml");
const _ = require("lodash");
const util_1 = require("util");
const DefinitionGenerator_1 = require("./DefinitionGenerator");
const types_1 = require("./types");
class ServerlessOpenApiDocumentation {
    /**
     * Constructor
     * @param serverless
     * @param options
     */
    constructor(serverless, options) {
        this.log = (...str) => {
            process.stdout.write(str.join(" "));
        };
        // pull the serverless instance into our class vars
        this.serverless = serverless;
        // Serverless service custom variables
        this.customVars = this.serverless.variables.service.custom;
        // Declare the commands this plugin exposes for the Serverless CLI
        this.commands = {
            openapi: {
                commands: {
                    generate: {
                        lifecycleEvents: ["serverless"],
                        usage: "Generate OpenAPI v3 Documentation",
                        options: {
                            output: {
                                usage: "Output file location [default: openapi.yml|json]",
                                shortcut: "o",
                                type: "string",
                            },
                            format: {
                                usage: "OpenAPI file format (yml|json) [default: yml]",
                                shortcut: "f",
                                type: "string",
                            },
                            indent: {
                                usage: "File indentation in spaces [default: 2]",
                                shortcut: "i",
                                type: "string",
                            },
                        },
                    },
                },
            },
        };
        this.serverless.configSchemaHandler.defineFunctionEventProperties("aws", "http", {
            properties: {
                documentation: { type: "object" },
            },
        });
        // Declare the hooks our plugin is interested in
        this.hooks = {
            "openapi:generate:serverless": this.generate.bind(this),
        };
    }
    /**
     * Generates OpenAPI Documentation based on serverless configuration and functions
     */
    generate() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log(chalk.bold.underline("OpenAPI v3 Documentation Generator\n\n"));
            // Instantiate DocumentGenerator
            const generator = new DefinitionGenerator_1.DefinitionGenerator(this.customVars.documentation, this.serverless.config.servicePath);
            yield generator.parse();
            // Map function configurations
            const funcConfigs = this.serverless.service
                .getAllFunctions()
                .map((functionName) => {
                const func = this.serverless.service.getFunction(functionName);
                return _.merge({ _functionName: functionName }, func);
            });
            // Add Paths to OpenAPI Output from Function Configuration
            generator.readFunctions(funcConfigs);
            // Process CLI Input options
            const config = this.processCliInput();
            this.log(`${chalk.bold.yellow("[VALIDATION]")} Validating OpenAPI generated output\n`);
            const validation = generator.validate();
            if (validation.valid) {
                this.log(`${chalk.bold.green("[VALIDATION]")} OpenAPI valid: ${chalk.bold.green("true")}\n\n`);
            }
            else {
                this.log(`${chalk.bold.red("[VALIDATION]")} Failed to validate OpenAPI document: \n\n`);
                this.log(`${chalk.bold.green("Context:")} ${JSON.stringify(validation.context, null, 2)}\n`);
                if (typeof validation.error === "string") {
                    this.log(`${validation.error}\n\n`);
                }
                else {
                    for (const info of validation.error) {
                        this.log(chalk.grey("\n\n--------\n\n"));
                        this.log(" ", chalk.blue(info.dataPath), "\n");
                        this.log(" ", info.schemaPath, chalk.bold.yellow(info.message));
                        this.log(chalk.grey("\n\n--------\n\n"));
                        this.log(`${(0, util_1.inspect)(info, { colors: true, depth: 2 })}\n\n`);
                    }
                }
            }
            const { definition } = generator;
            // Output the OpenAPI document to the correct format
            let output;
            switch (config.format.toLowerCase()) {
                case "json":
                    output = JSON.stringify(definition, null, config.indent);
                    break;
                case "yaml":
                default:
                    output = YAML.dump(definition, { indent: config.indent });
                    break;
            }
            fs.writeFileSync(config.file, output);
            this.log(`${chalk.bold.green("[OUTPUT]")} To "${chalk.bold.red(config.file)}"\n`);
        });
    }
    /**
     * Processes CLI input by reading the input from serverless
     * @returns config IConfigType
     */
    processCliInput() {
        const config = {
            format: types_1.Format.yaml,
            file: "openapi.yml",
            indent: 2,
        };
        config.indent = this.serverless.processedInput.options.indent || 2;
        config.format =
            this.serverless.processedInput.options.format || types_1.Format.yaml;
        if ([types_1.Format.yaml, types_1.Format.json].indexOf(config.format) < 0) {
            throw new Error("Invalid Output Format Specified - must be one of 'yaml' or 'json'");
        }
        config.file =
            this.serverless.processedInput.options.output ||
                (config.format === "yaml" ? "openapi.yml" : "openapi.json");
        this.log(`${chalk.bold.green("[OPTIONS]")}`, `format: "${chalk.bold.red(config.format)}",`, `output file: "${chalk.bold.red(config.file)}",`, `indentation: "${chalk.bold.red(String(config.indent))}"\n\n`);
        return config;
    }
}
exports.ServerlessOpenApiDocumentation = ServerlessOpenApiDocumentation;
//# sourceMappingURL=ServerlessOpenApiDocumentation.js.map