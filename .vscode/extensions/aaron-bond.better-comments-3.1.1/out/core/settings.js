"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSettings = readSettings;
const unknown_1 = require("./unknown");
/**
 * Checks the better-comments settings. They come from settings.json, so they can hold any JSON value: the schema
 * in package.json only says tags is an array, so VS Code passes on whatever the items contain.
 * - Flags are only ever tested for truthiness, so any value is read as a boolean.
 * - A colour is kept if it's a string or a theme colour ({ "id": "editorError.foreground" }), the shapes VS Code can
 *   use. Anything else is dropped.
 * - Tags that aren't a list of objects with a string tag have always stopped the parser, so they still throw.
 * @param raw The value of vscode.workspace.getConfiguration('better-comments')
 */
function readSettings(raw) {
    const tags = (0, unknown_1.property)(raw, 'tags');
    // ? the parser used for...of, which also accepts a string: each character then fails as a tag, so only "" passes
    const list = typeof tags === 'string' ? [...tags] : tags;
    if (!Array.isArray(list)) {
        throw new TypeError('better-comments.tags is not a list');
    }
    return {
        tags: list.map(readTag),
        multilineComments: Boolean((0, unknown_1.property)(raw, 'multilineComments')),
        highlightPlainText: Boolean((0, unknown_1.property)(raw, 'highlightPlainText')),
    };
}
function readTag(item) {
    const tag = (0, unknown_1.property)(item, 'tag');
    if (typeof tag !== 'string') {
        throw new TypeError('A better-comments tag has no "tag" string');
    }
    return {
        tag,
        color: readColor((0, unknown_1.property)(item, 'color')),
        backgroundColor: readColor((0, unknown_1.property)(item, 'backgroundColor')),
        strikethrough: Boolean((0, unknown_1.property)(item, 'strikethrough')),
        underline: Boolean((0, unknown_1.property)(item, 'underline')),
        bold: Boolean((0, unknown_1.property)(item, 'bold')),
        italic: Boolean((0, unknown_1.property)(item, 'italic')),
    };
}
function readColor(value) {
    if (typeof value === 'string') {
        return value;
    }
    const id = (0, unknown_1.property)(value, 'id');
    return typeof id === 'string' ? { id } : undefined;
}
//# sourceMappingURL=settings.js.map