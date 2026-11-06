"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const vscode = __importStar(require("vscode"));
const core_1 = require("./core");
class Parser {
    tags = [];
    // Carried from one language to the next
    state = core_1.initialLanguageState;
    // * this is used to trigger the events when a supported language code is found
    get supportedLanguage() {
        return this.state.supportedLanguage;
    }
    // The better-comments settings, read and checked once, so changes need a restart (pinned 7)
    contributions = (0, core_1.readSettings)(vscode.workspace.getConfiguration('better-comments'));
    // The configuration necessary to find supported languages on startup
    configuration;
    /**
     * Creates a new instance of the Parser class
     * @param configuration
     */
    constructor(config) {
        this.configuration = config;
        this.setTags();
    }
    /**
     * Sets the language whose comments FindComments looks for, from its comment syntax
     * ? called SetRegex up to v3.0.2
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    async SetLanguage(languageCode) {
        this.state = (0, core_1.beginLanguageSwitch)(this.state);
        const config = await this.configuration.GetCommentConfiguration(languageCode);
        this.state = (0, core_1.applyLanguage)(this.state, languageCode, config, this.contributions);
    }
    /**
     * Finds all tagged comments in the document, ready for ApplyDecorations
     * @param activeEditor The active text editor containing the code document
     */
    FindComments(activeEditor) {
        const text = activeEditor.document.getText();
        for (const match of (0, core_1.findTags)(text, this.state, this.tags)) {
            const startPos = activeEditor.document.positionAt(match.start);
            const endPos = activeEditor.document.positionAt(match.end);
            this.tags[match.tagIndex].ranges.push({ range: new vscode.Range(startPos, endPos) });
        }
    }
    /**
     * Apply decorations after finding all relevant comments
     * @param activeEditor The active text editor containing the code document
     */
    ApplyDecorations(activeEditor) {
        for (const tag of this.tags) {
            activeEditor.setDecorations(tag.decoration, tag.ranges);
            // clear the ranges for the next pass
            tag.ranges.length = 0;
        }
    }
    //#region  Private Methods
    /**
     * Sets the highlighting tags up for use by the parser
     */
    setTags() {
        const items = this.contributions.tags;
        for (const item of items) {
            const prepared = (0, core_1.prepareTag)(item);
            this.tags.push({
                tag: prepared.tag,
                escapedTag: prepared.escapedTag,
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(prepared.style)
            });
        }
    }
}
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map