"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTags = findTags;
const languageState_1 = require("./languageState");
const regex_1 = require("./regex");
/**
 * Finds every tagged comment in the text: single line comments, then block comments, then JSDoc comments,
 * each scan only if the language state allows it. Within each tag, ranges are applied in this order.
 * Finds nothing while the language isn't supported, which includes partway through a language switch.
 * @param text The document's text
 * @param state The language state after applyLanguage
 * @param tags The configured tags, in configuration order
 */
function findTags(text, state, tags) {
    const matches = [];
    // ? a switch makes the language unsupported until it finishes, so this also keeps scans off a half-switched state
    if (!state.supportedLanguage) {
        return matches;
    }
    const tagNames = tags.map(t => t.tag);
    const escapedTags = tags.map(t => t.escapedTag);
    if ((0, languageState_1.findsLineComments)(state)) {
        const expression = (0, languageState_1.lineCommentExpression)(state, escapedTags);
        findLineComments(text, expression, state, tagNames, matches);
    }
    if ((0, languageState_1.findsBlockComments)(state)) {
        const blockRegEx = new RegExp((0, regex_1.buildBlockCommentExpression)(state.blockCommentStart, state.blockCommentEnd), "gm");
        findTaggedLines(text, blockRegEx, new RegExp((0, regex_1.buildBlockLineExpression)(escapedTags), "igm"), tagNames, matches);
    }
    if ((0, languageState_1.findsJSDocComments)(state)) {
        const jsDocRegEx = new RegExp(regex_1.jsDocCommentExpression, "gm");
        findTaggedLines(text, jsDocRegEx, new RegExp((0, regex_1.buildJSDocLineExpression)(escapedTags), "igm"), tagNames, matches);
    }
    return matches;
}
/**
 * True for a zero-length match, after moving the regex past it so the caller can skip it
 * ? exec doesn't move past a zero-length match, so without this the loop never ends.
 * ? the plaintext expression with an empty tag matches zero characters on an empty line
 */
function skipZeroLength(regEx, match) {
    if (match[0].length === 0) {
        regEx.lastIndex++;
        return true;
    }
    return false;
}
/**
 * Finds the first configured tag a matched tag string belongs to, ignoring case
 */
function findTagIndex(tagNames, matched) {
    return tagNames.findIndex(tag => tag.toLowerCase() === matched.toLowerCase());
}
// Single line comments, matching the expression built by lineCommentExpression
function findLineComments(text, expression, state, tagNames, matches) {
    // if it's plain text, we have to do mutliline regex to catch the start of the line with ^
    const regexFlags = (state.isPlainText) ? "igm" : "ig";
    const regEx = new RegExp(expression, regexFlags);
    let match;
    while ((match = regEx.exec(text)) !== null) {
        if (skipZeroLength(regEx, match))
            continue;
        // Required to ignore the first line of .py files (#61)
        if (state.ignoreFirstLine && match.index === 0) {
            continue;
        }
        // Find which custom delimiter was used in order to add it to the collection
        const tagIndex = findTagIndex(tagNames, match[3]);
        if (tagIndex >= 0) {
            matches.push({ tagIndex, start: match.index, end: match.index + match[0].length });
        }
    }
}
// Tagged lines inside the comments regEx finds: block comments, or JSDoc comments after the leading *
function findTaggedLines(text, regEx, commentRegEx, tagNames, matches) {
    // Find the multiline comment block
    let match;
    while ((match = regEx.exec(text)) !== null) {
        if (skipZeroLength(regEx, match))
            continue;
        const commentBlock = match[0];
        // Find the line
        let line;
        while ((line = commentRegEx.exec(commentBlock)) !== null) {
            if (skipZeroLength(commentRegEx, line))
                continue;
            // Find which custom delimiter was used in order to add it to the collection
            const matchString = line[3];
            const tagIndex = findTagIndex(tagNames, matchString);
            if (tagIndex >= 0) {
                matches.push({
                    tagIndex,
                    start: match.index + line.index + line[2].length,
                    end: match.index + line.index + line[0].length,
                });
            }
        }
    }
}
//# sourceMappingURL=finder.js.map