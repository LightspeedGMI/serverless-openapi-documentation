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
exports.DefinitionGenerator = void 0;
const _ = require("lodash");
// tslint:disable-next-line no-submodule-imports
const validate_1 = require("swagger2openapi/validate");
const uuid = require("uuid");
const parse_1 = require("./parse");
const utils_1 = require("./utils");
class DefinitionGenerator {
    /**
     * Constructor
     */
    constructor(config, root) {
        // The OpenAPI version we currently validate against
        this.version = "3.0.0";
        // Base configuration object
        this.definition = {
            openapi: this.version,
            components: {},
        };
        this.config = _.cloneDeep(config);
        this.root = root;
    }
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            const { title = "", description = "", version = uuid.v4(), models, security, securitySchemes, servers, } = this.config;
            _.merge(this.definition, {
                openapi: this.version,
                info: { title, description, version },
                servers,
                paths: {},
                components: {
                    schemas: {},
                },
            });
            if (security) {
                this.definition.security = security;
            }
            if (securitySchemes) {
                this.definition.components.securitySchemes = securitySchemes;
            }
            if (servers) {
                this.definition.servers = servers;
            }
            this.definition.components.schemas = yield (0, parse_1.parseModels)(models, this.root);
            return this;
        });
    }
    validate() {
        const payload = {};
        try {
            (0, validate_1.validateSync)(this.definition, payload);
        }
        catch (error) {
            payload.error = error.message;
        }
        return payload;
    }
    /**
     * Add Paths to OpenAPI Configuration from Serverless function documentation
     * @param config Add
     */
    readFunctions(config) {
        // loop through function configurations
        for (const funcConfig of config) {
            // loop through http events
            for (const httpEvent of this.getHttpEvents(funcConfig.events)) {
                const httpEventConfig = httpEvent.http;
                if (httpEventConfig.documentation) {
                    // Build OpenAPI path configuration structure for each method
                    const pathConfig = {
                        [`/${httpEventConfig.path}`]: {
                            [httpEventConfig.method.toLowerCase()]: this.getOperationFromConfig(funcConfig._functionName, httpEventConfig.documentation),
                        },
                    };
                    // merge path configuration into main configuration
                    _.merge(this.definition.paths, pathConfig);
                }
            }
        }
    }
    /**
     * Generate Operation objects from the Serverless Config.
     *
     * @link https://github.com/OAI/OpenAPI-Specification/blob/3.0.0/versions/3.0.0.md#operationObject
     * @param funcName
     * @param documentationConfig
     */
    getOperationFromConfig(funcName, documentationConfig) {
        const operationObj = {
            operationId: funcName,
        };
        if (documentationConfig.summary) {
            operationObj.summary = documentationConfig.summary;
        }
        if (documentationConfig.description) {
            operationObj.description = documentationConfig.description;
        }
        if (documentationConfig.tags) {
            operationObj.tags = documentationConfig.tags;
        }
        if (documentationConfig.deprecated) {
            operationObj.deprecated = true;
        }
        if (documentationConfig.requestModels) {
            operationObj.requestBody =
                this.getRequestBodiesFromConfig(documentationConfig);
        }
        operationObj.parameters = this.getParametersFromConfig(documentationConfig);
        operationObj.responses = this.getResponsesFromConfig(documentationConfig);
        if (documentationConfig.authorizer && this.config.security) {
            const security = this.config.security.find((s) => s.authorizerName === documentationConfig.authorizer.name);
            if (security) {
                operationObj.security = [security];
            }
        }
        return operationObj;
    }
    /**
     * Derives Path, Query and Request header parameters from Serverless documentation
     * @param documentationConfig
     */
    getParametersFromConfig(documentationConfig) {
        const parameters = [];
        // Build up parameters from configuration for each parameter type
        for (const type of ["path", "query", "header", "cookie"]) {
            let paramBlock;
            if (type === "path" && documentationConfig.pathParams) {
                paramBlock = documentationConfig.pathParams;
            }
            else if (type === "query" && documentationConfig.queryParams) {
                paramBlock = documentationConfig.queryParams;
            }
            else if (type === "header" && documentationConfig.requestHeaders) {
                paramBlock = documentationConfig.requestHeaders;
            }
            else if (type === "cookie" && documentationConfig.cookieParams) {
                paramBlock = documentationConfig.cookieParams;
            }
            else {
                continue;
            }
            // Loop through each parameter in a parameter block and add parameters to array
            for (const parameter of paramBlock) {
                const parameterConfig = {
                    name: parameter.name,
                    in: type,
                    description: parameter.description || "",
                    required: parameter.required || false, // Note: all path parameters must be required
                };
                // if type is path, then required must be true (@see OpenAPI 3.0-RC1)
                if (type === "path") {
                    parameterConfig.required = true;
                }
                else if (type === "query") {
                    parameterConfig.allowEmptyValue = parameter.allowEmptyValue || false; // OpenAPI default is false
                    if ("allowReserved" in parameter) {
                        parameterConfig.allowReserved = parameter.allowReserved || false;
                    }
                }
                if ("deprecated" in parameter) {
                    parameterConfig.deprecated = parameter.deprecated;
                }
                if ("style" in parameter) {
                    parameterConfig.style = parameter.style;
                    parameterConfig.explode = parameter.explode
                        ? parameter.explode
                        : parameter.style === "form";
                }
                if (parameter.schema) {
                    parameterConfig.schema = (0, utils_1.cleanSchema)(parameter.schema);
                }
                if (parameter.example) {
                    parameterConfig.example = parameter.example;
                }
                else if (parameter.examples && Array.isArray(parameter.examples)) {
                    parameterConfig.examples = parameter.examples;
                }
                if (parameter.content) {
                    parameterConfig.content = parameter.content;
                }
                parameters.push(parameterConfig);
            }
        }
        return parameters;
    }
    /**
     * Derives request body schemas from event documentation configuration
     * @param documentationConfig
     */
    getRequestBodiesFromConfig(documentationConfig) {
        const requestBodies = {};
        if (!documentationConfig.requestModels) {
            throw new Error(`Required requestModels in: ${JSON.stringify(documentationConfig, null, 2)}`);
        }
        // Does this event have a request model?
        if (documentationConfig.requestModels) {
            // For each request model type (Sorted by "Content-Type")
            for (const requestModelType of Object.keys(documentationConfig.requestModels)) {
                // get schema reference information
                const requestModel = this.config.models
                    .filter((model) => model.name === documentationConfig.requestModels[requestModelType])
                    .pop();
                if (requestModel) {
                    const reqModelConfig = {
                        schema: {
                            $ref: `#/components/schemas/${documentationConfig.requestModels[requestModelType]}`,
                        },
                    };
                    this.attachExamples(requestModel, reqModelConfig);
                    const reqBodyConfig = {
                        content: {
                            [requestModelType]: reqModelConfig,
                        },
                    };
                    if (documentationConfig.requestBody &&
                        "description" in documentationConfig.requestBody) {
                        reqBodyConfig.description =
                            documentationConfig.requestBody.description;
                    }
                    _.merge(requestBodies, reqBodyConfig);
                }
            }
        }
        return requestBodies;
    }
    attachExamples(target, config) {
        if (target.examples) {
            _.merge(config, { examples: _.cloneDeep(target.examples) });
        }
        else if (target.example) {
            _.merge(config, { example: _.cloneDeep(target.example) });
        }
    }
    /**
     * Gets response bodies from documentation config
     * @param documentationConfig
     */
    getResponsesFromConfig(documentationConfig) {
        const responses = {};
        if (documentationConfig.methodResponses) {
            for (const response of documentationConfig.methodResponses) {
                const methodResponseConfig = {
                    description: response.responseBody && "description" in response.responseBody
                        ? response.responseBody.description
                        : `Status ${response.statusCode} Response`,
                    content: this.getResponseContent(response.responseModels),
                };
                if (response.responseHeaders) {
                    methodResponseConfig.headers = {};
                    for (const header of response.responseHeaders) {
                        methodResponseConfig.headers[header.name] = {
                            description: header.description || `${header.name} header`,
                        };
                        if (header.schema) {
                            methodResponseConfig.headers[header.name].schema = (0, utils_1.cleanSchema)(header.schema);
                        }
                    }
                }
                _.merge(responses, {
                    [response.statusCode]: methodResponseConfig,
                });
            }
        }
        return responses;
    }
    getResponseContent(response) {
        const content = {};
        for (const responseKey of Object.keys(response)) {
            const responseModel = this.config.models.find((model) => model.name === response[responseKey]);
            if (responseModel) {
                const resModelConfig = {
                    schema: {
                        $ref: `#/components/schemas/${response[responseKey]}`,
                    },
                };
                this.attachExamples(responseModel, resModelConfig);
                _.merge(content, { [responseKey]: resModelConfig });
            }
        }
        return content;
    }
    getHttpEvents(funcConfig) {
        return funcConfig.filter((event) => !!event.http);
    }
}
exports.DefinitionGenerator = DefinitionGenerator;
//# sourceMappingURL=DefinitionGenerator.js.map