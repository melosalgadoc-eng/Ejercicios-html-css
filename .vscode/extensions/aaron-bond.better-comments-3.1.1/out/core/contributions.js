"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLanguageContributions = readLanguageContributions;
const unknown_1 = require("./unknown");
/**
 * The languages an extension's package.json contributes that have a language configuration. The manifest is
 * another extension's, so it's read as unknown: entries without a string id and configuration are skipped, and
 * the shapes that reading it has always thrown for still throw, at the same entry, except a manifest that is itself
 * null or undefined, which is skipped (VS Code always supplies one).
 * @param packageJSON An extension's packageJSON
 */
function* readLanguageContributions(packageJSON) {
    const languages = (0, unknown_1.property)((0, unknown_1.property)(packageJSON, 'contributes'), 'languages');
    // ? for...of over a string gives characters, and none of them has a configuration
    if (!languages || typeof languages === 'string')
        return;
    if (!Array.isArray(languages)) {
        throw new TypeError('contributes.languages is not a list');
    }
    const entries = languages;
    for (const language of entries) {
        if (language === null || language === undefined) {
            throw new TypeError('A contributed language is null');
        }
        const configuration = (0, unknown_1.property)(language, 'configuration');
        if (!configuration)
            continue;
        // ? path.join has always thrown for a configuration that isn't a string
        if (typeof configuration !== 'string') {
            throw new TypeError('A contributed language\'s configuration is not a string');
        }
        // An id that isn't a string could never be looked up
        const id = (0, unknown_1.property)(language, 'id');
        if (typeof id === 'string') {
            yield { id, configuration };
        }
    }
}
//# sourceMappingURL=contributions.js.map