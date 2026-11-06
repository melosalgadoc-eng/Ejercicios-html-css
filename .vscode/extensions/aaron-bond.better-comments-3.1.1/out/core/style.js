"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTagStyle = toTagStyle;
/**
 * Builds the decoration options for a tag from its settings
 * @param item The tag as configured in better-comments.tags
 */
function toTagStyle(item) {
    const options = { color: item.color, backgroundColor: item.backgroundColor };
    // ? the textDecoration is initialised to empty so we can concat a preceeding space on it
    options.textDecoration = "";
    if (item.strikethrough) {
        options.textDecoration += "line-through";
    }
    if (item.underline) {
        options.textDecoration += " underline";
    }
    if (item.bold) {
        options.fontWeight = "bold";
    }
    if (item.italic) {
        options.fontStyle = "italic";
    }
    return options;
}
//# sourceMappingURL=style.js.map