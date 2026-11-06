"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectAssetIndex = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const YAML = require("yaml");
const assetPathLayout_1 = require("./assetPathLayout");
const CACHE_VERSION = 1;
const CACHE_FILE = path.join('.vscode', 'itemsadder-index.json');
const WATCHED_EXTENSIONS = new Set(['.png', '.json', '.mcmeta', '.ogg', '.yml', '.yaml', '.java', '.jspp']);
const SKIPPED_DIRECTORIES = new Set(['.git', '.gradle', '.vscode', '.vscode-test', 'node_modules', 'out', 'dist']);
const TOP_LEVEL_DEFINITIONS = [
    ['items', 'item'],
    ['blocks', 'block'],
    ['armors', 'armor'],
    ['sounds', 'sound'],
    ['font_images', 'font_image'],
    ['entities', 'entity'],
    ['loots', 'loot'],
    ['trees', 'tree'],
    ['categories', 'category'],
    ['huds', 'hud']
];
class ProjectAssetIndex {
    constructor(workspaceFoldersProvider, enabledProvider = () => true) {
        this.workspaceFoldersProvider = workspaceFoldersProvider;
        this.enabledProvider = enabledProvider;
        this.assetsByKey = new Map();
        this.definitionsByKey = new Map();
        this.rebuildEmitter = new vscode.EventEmitter();
        this.onDidRebuild = this.rebuildEmitter.event;
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{png,json,mcmeta,ogg,yml,yaml,java,jspp}');
        this.watcher.onDidCreate(() => this.scheduleRebuild());
        this.watcher.onDidChange(() => this.scheduleRebuild());
        this.watcher.onDidDelete(() => this.scheduleRebuild());
        this.rebuild();
    }
    list(kind, namespace) {
        return Array.from(this.assetsByKey.values())
            .filter(asset => asset.kind === kind && (!namespace || asset.namespace === namespace))
            .sort((a, b) => `${a.namespace}:${a.path}`.localeCompare(`${b.namespace}:${b.path}`));
    }
    find(kind, namespace, assetPath) {
        return this.assetsByKey.get(this.key(kind, namespace, assetPath));
    }
    listDefinitions(kind, namespace) {
        return Array.from(this.definitionsByKey.values())
            .filter(definition => definition.kind === kind && (!namespace || definition.namespace === namespace))
            .sort((a, b) => `${a.namespace}:${a.id}`.localeCompare(`${b.namespace}:${b.id}`));
    }
    findDefinition(kind, namespace, id) {
        return this.definitionsByKey.get(this.definitionKey(kind, namespace, id));
    }
    rebuild() {
        this.assetsByKey.clear();
        this.definitionsByKey.clear();
        if (!this.enabledProvider()) {
            this.rebuildEmitter.fire();
            return;
        }
        for (const folder of this.workspaceFoldersProvider() ?? []) {
            const workspacePath = folder.uri.fsPath;
            if (!this.isItemsAdderWorkspace(workspacePath)) {
                this.deleteCache(workspacePath);
                continue;
            }
            const files = this.collectWorkspaceFiles(workspacePath);
            const snapshot = this.snapshotFiles(files);
            const cached = this.readCache(workspacePath);
            if (cached && this.sameSnapshot(cached.files, snapshot)) {
                this.loadFromCache(cached);
                continue;
            }
            const assets = [];
            const definitions = [];
            for (const fullPath of files) {
                this.scanFile(fullPath, assets, definitions);
            }
            this.addAssets(assets);
            this.addDefinitions(definitions);
            this.writeCache(workspacePath, { version: CACHE_VERSION, files: snapshot, assets, definitions });
        }
        this.rebuildEmitter.fire();
    }
    dispose() {
        if (this.rebuildTimeout) {
            clearTimeout(this.rebuildTimeout);
        }
        this.watcher.dispose();
        this.rebuildEmitter.dispose();
    }
    scheduleRebuild() {
        if (this.rebuildTimeout) {
            clearTimeout(this.rebuildTimeout);
        }
        this.rebuildTimeout = setTimeout(() => {
            this.rebuildTimeout = undefined;
            this.rebuild();
        }, 500);
    }
    collectWorkspaceFiles(workspacePath) {
        const files = [];
        const visit = (directory) => {
            let entries;
            try {
                entries = fs.readdirSync(directory, { withFileTypes: true });
            }
            catch {
                return;
            }
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    if (!SKIPPED_DIRECTORIES.has(entry.name)) {
                        visit(path.join(directory, entry.name));
                    }
                    continue;
                }
                if (entry.isFile() && WATCHED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
                    files.push(path.join(directory, entry.name));
                }
            }
        };
        visit(workspacePath);
        return files.sort();
    }
    isItemsAdderWorkspace(workspacePath) {
        if (this.pathContainsContents(workspacePath)) {
            return true;
        }
        try {
            return fs.statSync(path.join(workspacePath, 'contents')).isDirectory();
        }
        catch {
            return false;
        }
    }
    pathContainsContents(filePath) {
        return filePath.replace(/\\/g, '/').split('/').includes('contents');
    }
    snapshotFiles(files) {
        const snapshot = {};
        for (const fullPath of files) {
            try {
                const stat = fs.statSync(fullPath);
                snapshot[fullPath] = { mtimeMs: stat.mtimeMs, size: stat.size };
            }
            catch {
                // Ignore files deleted while indexing. The watcher will schedule a new pass.
            }
        }
        return snapshot;
    }
    sameSnapshot(left, right) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length) {
            return false;
        }
        return leftKeys.every(key => left[key]?.mtimeMs === right[key]?.mtimeMs && left[key]?.size === right[key]?.size);
    }
    readCache(workspacePath) {
        try {
            const parsed = JSON.parse(fs.readFileSync(this.cachePath(workspacePath), 'utf8'));
            return parsed.version === CACHE_VERSION ? parsed : undefined;
        }
        catch {
            return undefined;
        }
    }
    writeCache(workspacePath, cache) {
        try {
            const cachePath = this.cachePath(workspacePath);
            fs.mkdirSync(path.dirname(cachePath), { recursive: true });
            fs.writeFileSync(cachePath, `${JSON.stringify(cache)}\n`);
        }
        catch {
            // Cache is an optimization; indexing still works if it cannot be written.
        }
    }
    deleteCache(workspacePath) {
        try {
            fs.unlinkSync(this.cachePath(workspacePath));
        }
        catch {
            // Missing or unwritable cache does not affect indexing.
        }
    }
    cachePath(workspacePath) {
        return path.join(workspacePath, CACHE_FILE);
    }
    loadFromCache(cache) {
        this.addAssets(cache.assets);
        this.addDefinitions(cache.definitions);
    }
    scanFile(fullPath, assets, definitions) {
        const asset = this.assetFromPath(fullPath);
        if (asset) {
            assets.push(asset);
        }
        const extension = path.extname(fullPath).toLowerCase();
        if (extension === '.yml' || extension === '.yaml') {
            definitions.push(...this.definitionsFromYaml(fullPath));
        }
        else if (extension === '.java' || extension === '.jspp') {
            const script = this.scriptDefinitionFromPath(fullPath);
            if (script) {
                definitions.push(script);
            }
        }
    }
    addAssets(assets) {
        for (const asset of assets) {
            this.assetsByKey.set(this.key(asset.kind, asset.namespace, asset.path), asset);
        }
    }
    addDefinitions(definitions) {
        for (const definition of definitions) {
            this.definitionsByKey.set(this.definitionKey(definition.kind, definition.namespace, definition.id), definition);
        }
    }
    definitionsFromYaml(fullPath) {
        let doc;
        try {
            doc = YAML.parseDocument(fs.readFileSync(fullPath, 'utf8'));
        }
        catch {
            return [];
        }
        const namespace = this.namespaceFromYaml(doc) ?? this.namespaceFromContentsPath(fullPath);
        if (!namespace) {
            return [];
        }
        const definitions = [];
        for (const [topLevelKey, kind] of TOP_LEVEL_DEFINITIONS) {
            this.collectMapDefinitions(doc.get(topLevelKey, true), kind, namespace, fullPath, definitions);
        }
        this.collectRecipeDefinitions(doc.get('recipes', true), namespace, fullPath, definitions);
        return definitions;
    }
    collectMapDefinitions(node, kind, namespace, fullPath, definitions) {
        if (!YAML.isMap(node)) {
            return;
        }
        for (const pair of node.items) {
            if (YAML.isPair(pair) && YAML.isScalar(pair.key) && typeof pair.key.value === 'string') {
                definitions.push({ kind, namespace, id: pair.key.value, fullPath });
            }
        }
    }
    collectRecipeDefinitions(node, namespace, fullPath, definitions) {
        if (!YAML.isMap(node)) {
            return;
        }
        for (const categoryPair of node.items) {
            if (!YAML.isPair(categoryPair) || !YAML.isMap(categoryPair.value)) {
                continue;
            }
            for (const recipePair of categoryPair.value.items) {
                if (YAML.isPair(recipePair) && YAML.isScalar(recipePair.key) && typeof recipePair.key.value === 'string') {
                    definitions.push({ kind: 'recipe', namespace, id: recipePair.key.value, fullPath });
                }
            }
        }
    }
    namespaceFromYaml(doc) {
        const namespace = doc.getIn(['info', 'namespace'], true);
        return YAML.isScalar(namespace) && typeof namespace.value === 'string' ? namespace.value : undefined;
    }
    scriptDefinitionFromPath(fullPath) {
        const normalizedPath = fullPath.replace(/\\/g, '/');
        const scriptsMarker = '/scripts/';
        const scriptsIndex = normalizedPath.lastIndexOf(scriptsMarker);
        const namespace = this.namespaceFromContentsPath(fullPath);
        if (!namespace || scriptsIndex === -1) {
            return undefined;
        }
        const extension = path.extname(fullPath);
        const id = normalizedPath.slice(scriptsIndex + scriptsMarker.length, normalizedPath.length - extension.length);
        return id ? { kind: 'script', namespace, id, fullPath } : undefined;
    }
    namespaceFromContentsPath(fullPath) {
        const parts = fullPath.replace(/\\/g, '/').split('/');
        const contentsIndex = parts.lastIndexOf('contents');
        return contentsIndex === -1 ? undefined : parts[contentsIndex + 1];
    }
    assetFromPath(fullPath) {
        const normalizedPath = fullPath.replace(/\\/g, '/');
        for (const kind of ['texture', 'model', 'sound']) {
            const extension = (0, assetPathLayout_1.assetKindToExtension)(kind);
            if (!normalizedPath.endsWith(extension)) {
                continue;
            }
            const directory = (0, assetPathLayout_1.assetKindToDirectory)(kind);
            const marker = `/${directory}/`;
            const markerIndex = normalizedPath.lastIndexOf(marker);
            if (markerIndex === -1) {
                continue;
            }
            const assetPath = normalizedPath.slice(markerIndex + marker.length);
            const namespace = this.namespaceFromPath(normalizedPath, markerIndex);
            if (!namespace) {
                continue;
            }
            return {
                kind,
                namespace,
                path: assetPath,
                fullPath
            };
        }
        return undefined;
    }
    namespaceFromPath(normalizedPath, markerIndex) {
        const beforeMarker = normalizedPath.slice(0, markerIndex);
        const segments = beforeMarker.split('/').filter(Boolean);
        const assetsIndex = segments.lastIndexOf('assets');
        if (assetsIndex !== -1 && segments[assetsIndex + 1]) {
            return segments[assetsIndex + 1];
        }
        return segments[segments.length - 1];
    }
    key(kind, namespace, assetPath) {
        return `asset:${kind}:${namespace}:${assetPath}`;
    }
    definitionKey(kind, namespace, id) {
        return `definition:${kind}:${namespace}:${id}`;
    }
}
exports.ProjectAssetIndex = ProjectAssetIndex;
//# sourceMappingURL=projectAssetIndex.js.map