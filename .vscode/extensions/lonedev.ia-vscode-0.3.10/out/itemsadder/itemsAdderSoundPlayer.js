"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsAdderSoundPlayer = exports.ItemsAdderSoundHoverProvider = exports.ItemsAdderSoundCodeLensProvider = void 0;
const path = require("path");
const vscode = require("vscode");
const assetPathResolver_1 = require("./assetPathResolver");
const pathDisplay_1 = require("./pathDisplay");
class ItemsAdderSoundCodeLensProvider {
    constructor(options) {
        this.options = options;
    }
    provideCodeLenses(document) {
        if (document.uri.scheme !== 'file') {
            return [];
        }
        const text = document.getText();
        const namespace = readNamespace(text);
        if (!namespace) {
            return [];
        }
        const resolver = new assetPathResolver_1.AssetPathResolver({
            workspaceFolders: vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [],
            documentPath: document.uri.fsPath,
            fileNamespace: namespace,
            vanillaTexturePaths: this.options.vanillaTexturePaths,
            assetIndex: this.options.assetIndex
        });
        const lenses = [];
        for (const reference of findSoundPathReferences(text)) {
            const resolution = resolver.resolveSound(reference.value);
            if (!resolution.assetPath) {
                continue;
            }
            const range = new vscode.Range(reference.line, reference.startCharacter, reference.line, reference.endCharacter);
            lenses.push(new vscode.CodeLens(range, {
                title: '$(play) Play sound',
                command: 'ia-vscode.playSound',
                arguments: [resolution.assetPath, reference.value]
            }));
            lenses.push(new vscode.CodeLens(range, {
                title: '$(debug-stop) Stop sound',
                command: 'ia-vscode.stopSound'
            }));
        }
        return lenses;
    }
}
exports.ItemsAdderSoundCodeLensProvider = ItemsAdderSoundCodeLensProvider;
class ItemsAdderSoundHoverProvider {
    constructor(options) {
        this.options = options;
    }
    provideHover(document, position) {
        if (document.uri.scheme !== 'file') {
            return undefined;
        }
        const text = document.getText();
        const reference = findSoundPathReferences(text).find(candidate => candidate.line === position.line &&
            position.character >= candidate.startCharacter &&
            position.character <= candidate.endCharacter);
        if (!reference) {
            return undefined;
        }
        const namespace = readNamespace(text);
        if (!namespace) {
            return undefined;
        }
        const resolver = new assetPathResolver_1.AssetPathResolver({
            workspaceFolders: vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [],
            documentPath: document.uri.fsPath,
            fileNamespace: namespace,
            vanillaTexturePaths: this.options.vanillaTexturePaths,
            assetIndex: this.options.assetIndex
        });
        const resolution = resolver.resolveSound(reference.value);
        if (!resolution.assetPath) {
            return undefined;
        }
        const markdown = new vscode.MarkdownString(undefined, true);
        markdown.isTrusted = true;
        markdown.appendMarkdown(`Found file: \`${(0, pathDisplay_1.displayWorkspacePath)(resolution.assetPath, 'sound')}\``);
        const args = encodeURIComponent(JSON.stringify([resolution.assetPath]));
        markdown.appendMarkdown(`\n\n[Open asset source](command:ia-vscode.openAssetSource?${args})`);
        return new vscode.Hover(markdown, new vscode.Range(reference.line, reference.startCharacter, reference.line, reference.endCharacter));
    }
}
exports.ItemsAdderSoundHoverProvider = ItemsAdderSoundHoverProvider;
class ItemsAdderSoundPlayer {
    play(soundPath, label) {
        this.stop();
        const soundUri = vscode.Uri.file(soundPath);
        this.panel = vscode.window.createWebviewPanel('itemsAdderSoundPlayer', `Sound: ${label || path.basename(soundPath)}`, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.dirname(soundPath))]
        });
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
        this.panel.webview.html = this.html(this.panel.webview.asWebviewUri(soundUri), label || path.basename(soundPath));
    }
    stop() {
        this.panel?.dispose();
        this.panel = undefined;
    }
    dispose() {
        this.stop();
    }
    html(soundUri, label) {
        const nonce = String(Date.now());
        const escapedLabel = escapeHtml(label);
        return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; media-src ${soundUri.scheme}:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapedLabel}</title>
</head>
<body>
	<h3>${escapedLabel}</h3>
	<audio id="sound" controls autoplay src="${soundUri}"></audio>
	<script nonce="${nonce}">
		const audio = document.getElementById('sound');
		audio.play().catch(() => {});
	</script>
</body>
</html>`;
    }
}
exports.ItemsAdderSoundPlayer = ItemsAdderSoundPlayer;
function findSoundPathReferences(text) {
    return yamlKeyEntries(text)
        .filter(entry => entry.key === 'path' && entry.parentPath.length === 2 && entry.parentPath[0] === 'sounds')
        .map(entry => {
        const scalar = readScalarValue(text.split('\n')[entry.line], entry.keyEnd);
        return scalar
            ? { line: entry.line, ...scalar }
            : undefined;
    })
        .filter((reference) => Boolean(reference));
}
function readNamespace(text) {
    const namespaceEntry = yamlKeyEntries(text).find(entry => entry.key === 'namespace' && entry.parentPath.join('.') === 'info');
    if (!namespaceEntry) {
        return undefined;
    }
    return readScalarValue(text.split('\n')[namespaceEntry.line], namespaceEntry.keyEnd)?.value;
}
function yamlKeyEntries(text) {
    const entries = [];
    const parents = [];
    text.split('\n').forEach((lineText, line) => {
        const match = lineText.match(/^(\s*)([^:#][^:]*):/);
        if (!match) {
            return;
        }
        const indent = match[1].length;
        const key = match[2].trimEnd();
        while (parents.length > 0 && parents[parents.length - 1].indent >= indent) {
            parents.pop();
        }
        entries.push({
            line,
            indent,
            key,
            keyEnd: indent + key.length,
            parentPath: parents.map(parent => parent.key)
        });
        parents.push({ indent, key });
    });
    return entries;
}
function readScalarValue(line, keyEnd) {
    const colon = line.indexOf(':', keyEnd);
    if (colon === -1) {
        return undefined;
    }
    let start = colon + 1;
    while (start < line.length && /\s/.test(line[start])) {
        start++;
    }
    if (start >= line.length) {
        return undefined;
    }
    const quote = line[start];
    if (quote === '"' || quote === "'") {
        const end = line.indexOf(quote, start + 1);
        if (end === -1) {
            return undefined;
        }
        return {
            startCharacter: start,
            endCharacter: end + 1,
            value: line.slice(start + 1, end)
        };
    }
    const commentStart = line.indexOf(' #', start);
    const end = commentStart === -1 ? line.length : commentStart;
    const valueEnd = line.slice(0, end).trimEnd().length;
    const value = line.slice(start, valueEnd).trim();
    return value
        ? { startCharacter: start, endCharacter: valueEnd, value }
        : undefined;
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=itemsAdderSoundPlayer.js.map