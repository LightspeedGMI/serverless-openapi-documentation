"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
exports.cleanSchema = schema => _.omit(schema, "$schema", "definitions");
//# sourceMappingURL=utils.js.map