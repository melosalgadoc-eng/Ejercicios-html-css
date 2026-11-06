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
exports.Configuration = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const util_1 = require("util");
const core_1 = require("./core");
class Configuration {
    commentConfig = new Map();
    languageConfigFiles = new Map();
    /**
     * Creates a new instance of the Parser class
     */
    constructor() {
        this.UpdateLanguagesDefinitions();
    }
    /**
     * Generate a map of configuration files by language as defined by extensions
     * External extensions can override default configurations os VSCode
     */
    UpdateLanguagesDefinitions() {
        this.commentConfig.clear();
        for (const extension of vscode.extensions.all) {
            for (const language of (0, core_1.readLanguageContributions)(extension.packageJSON)) {
                const configPath = path.join(extension.extensionPath, language.configuration);
                this.languageConfigFiles.set(language.id, configPath);
            }
        }
    }
    /**
     * Gets the configuration information for the specified language
     * @param languageCode
     * @returns
     */
    async GetCommentConfiguration(languageCode) {
        // * check if the language config has already been loaded
        if (this.commentConfig.has(languageCode)) {
            return this.commentConfig.get(languageCode);
        }
        // * if no config exists for this language, back out and leave the language unsupported
        const filePath = this.languageConfigFiles.get(languageCode);
        if (filePath === undefined) {
            return undefined;
        }
        try {
            const rawContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            const content = new util_1.TextDecoder().decode(rawContent);
            const comments = (0, core_1.parseLanguageConfig)(content);
            this.commentConfig.set(languageCode, comments);
            return comments;
        }
        catch {
            this.commentConfig.set(languageCode, undefined);
            return undefined;
        }
    }
}
exports.Configuration = Configuration;
//# sourceMappingURL=configuration.js.map