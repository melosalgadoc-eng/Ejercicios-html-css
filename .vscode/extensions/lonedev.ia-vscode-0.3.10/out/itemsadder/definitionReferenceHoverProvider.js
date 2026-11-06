"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinitionReferenceHoverProvider = void 0;
const vscode = require("vscode");
const definitionReferences_1 = require("./definitionReferences");
const pathDisplay_1 = require("./pathDisplay");
const yamlPath_1 = require("./yamlPath");
class DefinitionReferenceHoverProvider {
    constructor(options) {
        this.options = options;
    }
    provideHover(document, position) {
        if (document.uri.scheme !== 'file') {
            return undefined;
        }
        const text = document.getText();
        const namespace = this.readNamespace(text, document.uri.fsPath);
        if (!namespace) {
            return undefined;
        }
        const line = document.lineAt(position.line).text;
        const scalar = this.readScalarValue(line);
        if (!scalar || position.character < scalar.startCharacter || position.character > scalar.endCharacter) {
            return undefined;
        }
        const yamlPath = (0, yamlPath_1.getYamlParentPathFromText)(text, {
            line: position.line,
            character: scalar.startCharacter
        });
        const kinds = (0, definitionReferences_1.definitionKindsForPath)(yamlPath);
        if (!kinds.length) {
            return undefined;
        }
        const reference = (0, definitionReferences_1.splitNamespacedReference)(scalar.value, namespace);
        if (!reference || reference.namespace === 'minecraft') {
            return undefined;
        }
        let found;
        for (const kind of kinds) {
            found = this.options.assetIndex.findDefinition(kind, reference.namespace, (0, definitionReferences_1.normalizeDefinitionId)(kind, reference.id));
            if (found) {
                break;
            }
        }
        if (!found) {
            return undefined;
        }
        const markdown = new vscode.MarkdownString(undefined, true);
        markdown.isTrusted = true;
        markdown.appendMarkdown(`Found ItemsAdder ${found.kind.replace('_', ' ')}: \`${found.namespace}:${found.id}\``);
        markdown.appendMarkdown(`\n\nFile: \`${(0, pathDisplay_1.displayWorkspacePath)(found.fullPath)}\``);
        const args = encodeURIComponent(JSON.stringify([found.fullPath]));
        markdown.appendMarkdown(`\n\n[Open source](command:ia-vscode.openAssetSource?${args})`);
        return new vscode.Hover(markdown, new vscode.Range(position.line, scalar.startCharacter, position.line, scalar.endCharacter));
    }
    readScalarValue(line) {
        const keyValueMatch = line.match(/^(\s*[^:#][^:]*:\s*)(.+)$/);
        const arrayMatch = line.match(/^(\s*-\s+)(.+)$/);
        const prefixLength = keyValueMatch?.[1].length ?? arrayMatch?.[1].length;
        const rawValue = keyValueMatch?.[2] ?? arrayMatch?.[2];
        if (prefixLength === undefined || rawValue === undefined) {
            return undefined;
        }
        let value = rawValue.trim();
        if (!value) {
            return undefined;
        }
        let startCharacter = prefixLength + rawValue.indexOf(value);
        let endCharacter = startCharacter + value.length;
        if (value.length >= 2 &&
            ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
            value = value.slice(1, -1);
            startCharacter++;
            endCharacter--;
        }
        return { startCharacter, endCharacter, value };
    }
    readNamespace(text, filePath) {
        const infoNamespace = text.match(/^\s*namespace:\s*["']?([^"'\s]+)["']?/m)?.[1];
        if (infoNamespace) {
            return infoNamespace;
        }
        const pathParts = filePath.replace(/\\/g, '/').split('/');
        const contentsIndex = pathParts.lastIndexOf('contents');
        return contentsIndex === -1 ? undefined : pathParts[contentsIndex + 1];
    }
}
exports.DefinitionReferenceHoverProvider = DefinitionReferenceHoverProvider;
//# sourceMappingURL=definitionReferenceHoverProvider.js.map