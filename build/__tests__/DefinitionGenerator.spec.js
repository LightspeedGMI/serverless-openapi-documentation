"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const Serverless = require("serverless");
const DefinitionGenerator_1 = require("../DefinitionGenerator");
class ServerlessInterface extends Serverless {
    constructor() {
        super(...arguments);
        this.service = {};
        this.config = {};
        this.yamlParser = {};
        this.pluginManager = {};
        this.variables = {};
    }
}
describe("OpenAPI Documentation Generator", () => {
    let sls;
    const servicePath = path.join(__dirname, "../../test/project");
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        const serverlessYamlPath = path.join(servicePath, "./serverless.yml");
        sls = new Serverless();
        sls.config.update({
            servicePath
        });
        const config = yield sls.yamlParser.parse(serverlessYamlPath);
        sls.pluginManager.cliOptions = { stage: "dev" };
        yield sls.service.load(config);
        yield sls.variables.populateService();
        if (!("documentation" in sls.service.custom)) {
            throw new Error('Cannot find "documentation" in custom section of "serverless.yml"');
        }
    }));
    it("Generates OpenAPI document", () => __awaiter(this, void 0, void 0, function* () {
        const docGen = new DefinitionGenerator_1.DefinitionGenerator(sls.service.custom.documentation, servicePath);
        expect(docGen).not.toBeNull();
    }));
    it("adds paths to OpenAPI output from function configuration", () => __awaiter(this, void 0, void 0, function* () {
        const docGen = new DefinitionGenerator_1.DefinitionGenerator(sls.service.custom.documentation, servicePath);
        // implementation copied from ServerlessOpenApiDocumentation.ts
        yield docGen.parse();
        const funcConfigs = sls.service.getAllFunctions().map(functionName => {
            const func = sls.service.getFunction(functionName);
            return _.merge({ _functionName: functionName }, func);
        });
        docGen.readFunctions(funcConfigs);
        // get the parameters from the `/create POST' endpoint
        const actual = docGen.definition.paths["/create/{username}"].post.parameters;
        const expected = [
            {
                description: "The username for a user to create",
                in: "path",
                name: "username",
                required: true,
                schema: {
                    pattern: "^[-a-z0-9_]+$",
                    type: "string"
                }
            },
            {
                allowEmptyValue: false,
                description: `The user's Membership Type`,
                in: "query",
                name: "membershipType",
                required: false,
                schema: {
                    enum: ["premium", "standard"],
                    type: "string"
                }
            },
            {
                description: "A Session ID variable",
                in: "cookie",
                name: "SessionId",
                required: false,
                schema: {
                    type: "string"
                }
            }
        ];
        expect(actual).toEqual(expected);
    }));
});
//# sourceMappingURL=DefinitionGenerator.spec.js.map