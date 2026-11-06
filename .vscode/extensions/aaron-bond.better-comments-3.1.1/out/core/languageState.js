"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialLanguageState = void 0;
exports.beginLanguageSwitch = beginLanguageSwitch;
exports.applyLanguage = applyLanguage;
exports.lineCommentExpression = lineCommentExpression;
exports.findsLineComments = findsLineComments;
exports.findsBlockComments = findsBlockComments;
exports.findsJSDocComments = findsJSDocComments;
const regex_1 = require("./regex");
exports.initialLanguageState = {
    delimiter: "",
    blockCommentStart: "",
    blockCommentEnd: "",
    highlightSingleLineComments: true,
    highlightMultilineComments: false,
    highlightJSDoc: false,
    isPlainText: false,
    matchLineStart: false,
    ignoreFirstLine: false,
    supportedLanguage: true,
};
/**
 * The part of a language switch that happens before the language's config has been loaded
 * ? kept separate from applyLanguage because overlapping switches interleave between the two
 */
function beginLanguageSwitch(state) {
    return {
        ...state,
        supportedLanguage: false,
        ignoreFirstLine: false,
        isPlainText: false,
        matchLineStart: false,
    };
}
/**
 * The part of a language switch that happens once the language's config has been loaded
 * @param state The state after beginLanguageSwitch
 * @param languageCode The short code of the language
 * https://code.visualstudio.com/docs/languages/identifiers
 * @param config The language's comment syntax, or undefined if it has none
 * @param settings The better-comments settings
 */
function applyLanguage(state, languageCode, config, settings) {
    let next = { ...state };
    if (config) {
        const blockCommentStart = config.blockComment ? config.blockComment[0] : null;
        const blockCommentEnd = config.blockComment ? config.blockComment[1] : null;
        next = setCommentFormat(next, settings, config.lineComment || blockCommentStart, blockCommentStart, blockCommentEnd);
        next.supportedLanguage = true;
    }
    switch (languageCode) {
        case "apex":
        case "javascript":
        case "javascriptreact":
        case "typescript":
        case "typescriptreact":
            next.highlightJSDoc = true;
            break;
        case "elixir":
        case "python":
        case "tcl":
            next.ignoreFirstLine = true;
            break;
        case "plaintext":
            next.isPlainText = true;
            next.matchLineStart = settings.highlightPlainText;
            // If highlight plaintext is enabled, this is a supported language
            next.supportedLanguage = settings.highlightPlainText;
            break;
    }
    return next;
}
/**
 * Builds the single line comment expression for the current language
 * @param state The state after applyLanguage
 * @param escapedTags The escaped tags, in configuration order
 */
function lineCommentExpression(state, escapedTags) {
    return (0, regex_1.buildLineCommentExpression)(escapedTags, state.delimiter, state.matchLineStart);
}
// If highlight single line comments is off, single line comments are not supported for this language
function findsLineComments(state) {
    return state.highlightSingleLineComments;
}
// If highlight multiline is off in package.json or doesn't apply to his language, block comments aren't searched
function findsBlockComments(state) {
    return state.highlightMultilineComments;
}
// JSDoc comments are searched when multiline comments are, and for languages that have used JSDoc
function findsJSDocComments(state) {
    return state.highlightMultilineComments || state.highlightJSDoc;
}
/**
 * Set up the comment format for single and multiline highlighting
 * @param singleLine The single line comment delimiter. If NULL, single line is not supported
 * @param start The start delimiter for block comments
 * @param end The end delimiter for block comments
 */
function setCommentFormat(state, settings, singleLine, start = null, end = null) {
    const next = { ...state };
    next.delimiter = "";
    next.blockCommentStart = "";
    next.blockCommentEnd = "";
    // If no single line comment delimiter is passed, single line comments are not supported
    if (singleLine) {
        next.delimiter = (0, regex_1.escapeLineDelimiter)(singleLine);
    }
    else {
        next.highlightSingleLineComments = false;
    }
    if (start && end) {
        next.blockCommentStart = (0, regex_1.escapeRegExp)(start);
        next.blockCommentEnd = (0, regex_1.escapeRegExp)(end);
        next.highlightMultilineComments = settings.multilineComments;
    }
    return next;
}
//# sourceMappingURL=languageState.js.map