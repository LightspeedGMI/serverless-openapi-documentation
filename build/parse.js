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
exports.parseModels = void 0;
const $RefParser = require("json-schema-ref-parser");
const _ = require("lodash");
const path = require("path");
const utils_1 = require("./utils");
function updateReferences(schema) {
    if (!schema) {
        return schema;
    }
    const cloned = _.cloneDeep(schema);
    if (cloned.$ref) {
        return Object.assign(Object.assign({}, cloned), { $ref: cloned.$ref.replace("#/definitions", "#/components/schemas") });
    }
    for (const key of Object.getOwnPropertyNames(cloned)) {
        const value = cloned[key];
        if (typeof value === "object") {
            cloned[key] = updateReferences(value);
        }
    }
    return cloned;
}
function parseModels(models, root) {
    return __awaiter(this, void 0, void 0, function* () {
        const schemas = {};
        if (!_.isArrayLike(models)) {
            throw new Error("Empty models");
        }
        for (const model of models) {
            if (!model.schema) {
                continue;
            }
            const schema = (typeof model.schema === "string"
                ? yield $RefParser.bundle(path.resolve(root, model.schema))
                : model.schema);
            _.assign(schemas, updateReferences(schema.definitions), {
                [model.name]: updateReferences((0, utils_1.cleanSchema)(schema)),
            });
        }
        return schemas;
    });
}
exports.parseModels = parseModels;
//# sourceMappingURL=parse.js.map