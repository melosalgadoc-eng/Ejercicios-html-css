"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorDiagnosticsController = void 0;
const vscode = require("vscode");
const YAML = require("yaml");
const animatedPngFirstFrame_1 = require("./animatedPngFirstFrame");
const assetPathResolver_1 = require("./assetPathResolver");
const itemsAdderDiagnostics_1 = require("./itemsAdderDiagnostics");
const pathDisplay_1 = require("./pathDisplay");
const scriptPathResolver_1 = require("./scriptPathResolver");
class EditorDiagnosticsController {
    constructor(options) {
        this.options = options;
        this.provider = new itemsAdderDiagnostics_1.ItemsAdderDiagnosticsProvider();
    }
    update(doc, text, editor, diagnostics, previousDecorations) {
        diagnostics.clear();
        previousDecorations.forEach(decoration => decoration.dispose());
        const workspaceFolders = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [];
        const fileNamespace = this.readNamespace(doc);
        const assetResolver = fileNamespace
            ? new assetPathResolver_1.AssetPathResolver({
                workspaceFolders,
                documentPath: editor.document.uri.fsPath,
                fileNamespace,
                vanillaTexturePaths: this.options.vanillaTexturePaths,
                assetIndex: this.options.assetIndex
            })
            : undefined;
        const scriptResolver = fileNamespace
            ? new scriptPathResolver_1.ScriptPathResolver({
                workspaceFolders,
                documentPath: editor.document.uri.fsPath,
                fileNamespace
            })
            : undefined;
        const result = this.provider.collect(doc, text, {
            isDocumentDirty: editor.document.isDirty,
            assetResolver,
            scriptResolver,
            definitionIndex: this.options.assetIndex,
            expectedNamespace: this.readNamespaceFromPath(editor.document.uri.fsPath)
        });
        diagnostics.set(editor.document.uri, result.issues.map(issue => this.toVsCodeDiagnostic(issue, editor.document)));
        return result.assetDecorations.map(decoration => {
            const decorationType = vscode.window.createTextEditorDecorationType({
                gutterIconPath: this.resolveGutterIconPath(decoration),
                gutterIconSize: 'contain'
            });
            editor.setDecorations(decorationType, [{
                    range: this.toVsCodeRange(decoration.range.start, decoration.range.end, editor.document),
                    hoverMessage: this.assetHoverMessage(decoration.resolution?.assetPath)
                }]);
            return decorationType;
        });
    }
    toVsCodeDiagnostic(issue, document) {
        return new vscode.Diagnostic(this.toVsCodeRange(issue.range.start, issue.range.end, document), issue.message, issue.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning);
    }
    toVsCodeRange(startOffset, endOffset, document) {
        return new vscode.Range(document.positionAt(startOffset), document.positionAt(endOffset));
    }
    resolveGutterIconPath(decoration) {
        if (decoration.missing || !decoration.resolution) {
            return vscode.Uri.file(this.options.extensionContext.asAbsolutePath('images/missing.png').replace(/\\/g, '/'));
        }
        if (decoration.resolution.remoteUrl) {
            return vscode.Uri.parse(decoration.resolution.remoteUrl);
        }
        return vscode.Uri.file((0, animatedPngFirstFrame_1.firstFramePngPath)(decoration.resolution.assetPath, this.options.extensionContext.globalStorageUri.fsPath));
    }
    assetHoverMessage(assetPath) {
        if (!assetPath) {
            return undefined;
        }
        const markdown = new vscode.MarkdownString(undefined, true);
        markdown.isTrusted = true;
        markdown.appendMarkdown(`Found file: \`${(0, pathDisplay_1.displayWorkspacePath)(assetPath)}\``);
        const args = encodeURIComponent(JSON.stringify([assetPath]));
        markdown.appendMarkdown(`\n\n[Open asset source](command:ia-vscode.openAssetSource?${args})`);
        return markdown;
    }
    readNamespaceFromPath(filePath) {
        const parts = filePath.replace(/\\/g, '/').split('/');
        const contentsIndex = parts.lastIndexOf('contents');
        return contentsIndex === -1 ? undefined : parts[contentsIndex + 1];
    }
    readNamespace(doc) {
        const infoNode = doc.get('info', true);
        if (!YAML.isMap(infoNode)) {
            return undefined;
        }
        const namespaceNode = infoNode.get('namespace', true);
        if (YAML.isScalar(namespaceNode) && typeof namespaceNode.value === 'string') {
            return namespaceNode.value;
        }
        return typeof namespaceNode === 'string' ? namespaceNode : undefined;
    }
}
exports.EditorDiagnosticsController = EditorDiagnosticsController;
//# sourceMappingURL=editorDiagnosticsController.js.map