"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictionaryTranslationInlayHintProvider = void 0;
const vscode = require("vscode");
const dictionaryReferences_1 = require("./dictionaryReferences");
const minecraftTextColors_1 = require("./minecraftTextColors");
class DictionaryTranslationInlayHintProvider {
    constructor(dictionaryIndex) {
        this.dictionaryIndex = dictionaryIndex;
        this.changeEmitter = new vscode.EventEmitter();
        this.onDidChangeInlayHints = this.changeEmitter.event;
        this.dictionarySubscription = this.dictionaryIndex.onDidChange(() => this.changeEmitter.fire());
    }
    provideInlayHints(document, range) {
        const hints = [];
        for (const reference of (0, dictionaryReferences_1.findDictionaryReferenceRanges)(document.getText())) {
            if (!range.intersection(new vscode.Range(reference.line, reference.startCharacter, reference.line, reference.endCharacter))) {
                continue;
            }
            const entry = reference.kind === 'minecraft_lang'
                ? this.dictionaryIndex.lookupMinecraftLang(reference.key)
                : this.dictionaryIndex.lookup(reference.key);
            if (!entry) {
                continue;
            }
            if ((0, minecraftTextColors_1.findMinecraftTextColorTokens)(entry.value).length > 0) {
                continue;
            }
            const previewText = (0, minecraftTextColors_1.formatMinecraftTextPreviewParts)(entry.value).map(part => part.text).join('');
            if (!previewText) {
                continue;
            }
            const spacer = new vscode.InlayHintLabelPart('    ');
            const label = new vscode.InlayHintLabelPart(previewText);
            label.tooltip = this.tooltipFor(reference.kind, reference.key, entry.sourcePath);
            if (entry.sourcePath) {
                label.command = {
                    title: 'Open translation source',
                    command: 'ia-vscode.openTranslationSource',
                    arguments: [entry.sourcePath]
                };
            }
            const hint = new vscode.InlayHint(new vscode.Position(reference.line, reference.endCharacter), [spacer, label], vscode.InlayHintKind.Type);
            hint.paddingLeft = false;
            hints.push(hint);
        }
        return hints;
    }
    dispose() {
        this.dictionarySubscription.dispose();
        this.changeEmitter.dispose();
    }
    tooltipFor(kind, key, sourcePath) {
        const tooltip = new vscode.MarkdownString(undefined, true);
        tooltip.isTrusted = true;
        tooltip.appendMarkdown(`${kind === 'minecraft_lang' ? 'Minecraft lang' : 'Dictionary'} key \`${key}\``);
        if (sourcePath) {
            const args = encodeURIComponent(JSON.stringify([sourcePath]));
            tooltip.appendMarkdown(`\n\n[Open translation source](command:ia-vscode.openTranslationSource?${args})`);
        }
        return tooltip;
    }
}
exports.DictionaryTranslationInlayHintProvider = DictionaryTranslationInlayHintProvider;
//# sourceMappingURL=dictionaryTranslationInlayHintProvider.js.map