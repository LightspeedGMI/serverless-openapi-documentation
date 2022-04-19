"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanSchema = void 0;
const _ = require("lodash");
const cleanSchema = (schema) => _.omit(schema, "$schema", "definitions");
exports.cleanSchema = cleanSchema;
//# sourceMappingURL=utils.js.map