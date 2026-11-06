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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const configuration_1 = require("./configuration");
const parser_1 = require("./parser");
// this method is called when vs code is activated
async function activate(context) {
    let activeEditor;
    const configuration = new configuration_1.Configuration();
    const parser = new parser_1.Parser(configuration);
    // The pending update, if any. Declared before the first triggerUpdateDecorations() call below
    let timeout;
    // Called to handle events below
    const updateDecorations = function () {
        // if no active window is open, return
        if (!activeEditor)
            return;
        // if lanugage isn't supported, return
        if (!parser.supportedLanguage)
            return;
        // Finds the single line, block and jsdoc comments using the language comment delimiters
        parser.FindComments(activeEditor);
        // Apply the styles set in the package.json
        parser.ApplyDecorations(activeEditor);
    };
    // Get the active editor for the first time and set its language
    if (vscode.window.activeTextEditor) {
        activeEditor = vscode.window.activeTextEditor;
        // Set the comment syntax for the specified language
        await parser.SetLanguage(activeEditor.document.languageId);
        // Trigger first update of decorators
        triggerUpdateDecorations();
    }
    // * Handle extensions being added or removed
    vscode.extensions.onDidChange(() => {
        configuration.UpdateLanguagesDefinitions();
    }, null, context.subscriptions);
    // * Handle active file changed
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (editor) {
            activeEditor = editor;
            // Set the comment syntax for the updated language
            await parser.SetLanguage(editor.document.languageId);
            // Trigger update to set decorations for newly active file
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    // * Handle file contents changed
    vscode.workspace.onDidChangeTextDocument(event => {
        // Trigger updates if the text was changed in the same document
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    // * IMPORTANT:
    // * To avoid calling update too often,
    // * set a timer for 100ms to wait before updating decorations
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 100);
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map