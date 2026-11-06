"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectMinecraftLangEntries = exports.collectDictionaryEntries = exports.ItemsAdderDictionaryIndex = void 0;
const fs = require("fs");
const vscode = require("vscode");
const YAML = require("yaml");
class ItemsAdderDictionaryIndex {
    constructor() {
        this.entries = new Map();
        this.minecraftLangEntries = new Map();
        this.changeEmitter = new vscode.EventEmitter();
        this.disposed = false;
        this.onDidChange = this.changeEmitter.event;
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{yml,yaml}');
        this.watcher.onDidCreate(() => this.scheduleRebuild());
        this.watcher.onDidChange(() => this.scheduleRebuild());
        this.watcher.onDidDelete(() => this.scheduleRebuild());
        void this.rebuild();
    }
    lookup(key) {
        return this.entries.get(key);
    }
    lookupMinecraftLang(key) {
        return this.minecraftLangEntries.get(key);
    }
    async rebuild() {
        if (this.disposed) {
            return;
        }
        const nextEntries = new Map();
        const nextMinecraftLangEntries = new Map();
        const files = await vscode.workspace.findFiles('**/*.{yml,yaml}', '**/{node_modules,.git,out}/**');
        for (const file of files) {
            for (const entry of collectDictionaryEntries(fs.readFileSync(file.fsPath, 'utf8'), file.fsPath)) {
                const previous = nextEntries.get(entry.key);
                if (!previous || entry.priority < previous.priority) {
                    nextEntries.set(entry.key, entry);
                }
            }
            for (const entry of collectMinecraftLangEntries(fs.readFileSync(file.fsPath, 'utf8'), file.fsPath)) {
                const previous = nextMinecraftLangEntries.get(entry.key);
                if (!previous || entry.priority < previous.priority) {
                    nextMinecraftLangEntries.set(entry.key, entry);
                }
            }
        }
        this.entries.clear();
        for (const [key, entry] of nextEntries) {
            this.entries.set(key, entry);
        }
        this.minecraftLangEntries.clear();
        for (const [key, entry] of nextMinecraftLangEntries) {
            this.minecraftLangEntries.set(key, entry);
        }
        this.changeEmitter.fire();
    }
    scheduleRebuild() {
        if (this.rebuildTimeout) {
            clearTimeout(this.rebuildTimeout);
        }
        this.rebuildTimeout = setTimeout(() => {
            void this.rebuild();
        }, 250);
    }
    dispose() {
        this.disposed = true;
        if (this.rebuildTimeout) {
            clearTimeout(this.rebuildTimeout);
        }
        this.watcher.dispose();
        this.changeEmitter.dispose();
    }
}
exports.ItemsAdderDictionaryIndex = ItemsAdderDictionaryIndex;
function collectDictionaryEntries(text, sourcePath) {
    const doc = YAML.parseDocument(text);
    const dictionaryNode = doc.get('dictionary', true);
    if (!YAML.isMap(dictionaryNode)) {
        return [];
    }
    const language = readInfoDictionaryLanguage(doc);
    const priority = dictionaryLanguagePriority(language);
    const entries = [];
    for (const item of dictionaryNode.items) {
        if (!YAML.isPair(item) || !YAML.isScalar(item.key) || !YAML.isScalar(item.value)) {
            continue;
        }
        const key = String(item.key.value ?? '').trim();
        const value = String(item.value.value ?? '').trim();
        if (!key) {
            continue;
        }
        entries.push({ key, value, sourcePath, language, priority });
    }
    return entries;
}
exports.collectDictionaryEntries = collectDictionaryEntries;
function collectMinecraftLangEntries(text, sourcePath) {
    const doc = YAML.parseDocument(text);
    const rootNode = doc.get('minecraft_lang_overwrite', true);
    if (!YAML.isMap(rootNode)) {
        return [];
    }
    const entries = [];
    for (const overwriteItem of rootNode.items) {
        if (!YAML.isPair(overwriteItem) || !YAML.isMap(overwriteItem.value)) {
            continue;
        }
        const languages = readStringArray(overwriteItem.value.get('languages', true));
        const priority = languagePriority(languages);
        const entriesNode = overwriteItem.value.get('entries', true);
        if (!YAML.isMap(entriesNode)) {
            continue;
        }
        for (const entryItem of entriesNode.items) {
            if (!YAML.isPair(entryItem) || !YAML.isScalar(entryItem.key) || !YAML.isScalar(entryItem.value)) {
                continue;
            }
            const key = String(entryItem.key.value ?? '').trim();
            const value = String(entryItem.value.value ?? '').trim();
            if (!key) {
                continue;
            }
            entries.push({ key, value, sourcePath, languages, priority });
        }
    }
    return entries;
}
exports.collectMinecraftLangEntries = collectMinecraftLangEntries;
function readStringArray(node) {
    if (YAML.isSeq(node)) {
        return node.items
            .filter(YAML.isScalar)
            .map(item => String(item.value ?? '').trim())
            .filter(Boolean);
    }
    if (YAML.isScalar(node) && node.value) {
        return [String(node.value).trim()];
    }
    return [];
}
function languagePriority(languages) {
    const normalized = languages.map(language => language.toLowerCase());
    if (normalized.includes('all')) {
        return 0;
    }
    if (normalized.includes('en_us')) {
        return 1;
    }
    return 2;
}
function readInfoDictionaryLanguage(doc) {
    const infoNode = doc.get('info', true);
    if (!YAML.isMap(infoNode)) {
        return undefined;
    }
    const languageNode = infoNode.get('dictionary-lang', true);
    if (YAML.isScalar(languageNode) && languageNode.value) {
        return String(languageNode.value).trim();
    }
    return undefined;
}
function dictionaryLanguagePriority(language) {
    if (!language) {
        return 1;
    }
    return language.toLowerCase() === 'en' ? 0 : 1;
}
//# sourceMappingURL=itemsAdderDictionaryIndex.js.map