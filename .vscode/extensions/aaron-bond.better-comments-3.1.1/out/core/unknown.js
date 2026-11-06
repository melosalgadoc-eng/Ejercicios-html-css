"use strict";
// Helpers for reading values whose type isn't known: settings and other extensions' package.json
Object.defineProperty(exports, "__esModule", { value: true });
exports.property = property;
/**
 * Reads a property of a value of unknown type, as value[key] would, or undefined if the value isn't an object
 */
function property(value, key) {
    return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
}
//# sourceMappingURL=unknown.js.map