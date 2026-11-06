"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareTag = prepareTag;
const regex_1 = require("./regex");
const style_1 = require("./style");
/**
 * Prepares one configured tag for matching and decorating
 * @param item The tag as configured in better-comments.tags
 */
function prepareTag(item) {
    const style = (0, style_1.toTagStyle)(item);
    return {
        tag: item.tag,
        escapedTag: (0, regex_1.escapeTag)(item.tag),
        style,
    };
}
//# sourceMappingURL=tags.js.map