"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorDecorationController = void 0;
const vscode = require("vscode");
const YAML = require("yaml");
const animatedPngFirstFrame_1 = require("./animatedPngFirstFrame");
const assetPathResolver_1 = require("./assetPathResolver");
const decorationRanges_1 = require("./decorationRanges");
const dictionaryReferences_1 = require("./dictionaryReferences");
const editorDiagnosticsController_1 = require("./editorDiagnosticsController");
const minecraftTextColors_1 = require("./minecraftTextColors");
const pathDisplay_1 = require("./pathDisplay");
const vanillaMinecraftAssets_1 = require("./vanillaMinecraftAssets");
class EditorDecorationController {
    constructor(options) {
        this.options = options;
        this.assetDecorations = [];
        this.alternatingDecorations = [];
        this.textColorPreviewDecorations = [];
        this.textColorOriginalDecorations = [];
        this.dictionaryFormattedPreviewDecorations = [];
        this.dictionaryFormattedOriginalDecorations = [];
        this.fontImageDecorations = [];
        this.implicitNamespaceDecorations = [];
        this.diagnosticsController = new editorDiagnosticsController_1.EditorDiagnosticsController({
            extensionContext: options.context,
            vanillaTexturePaths: options.vanillaTexturePaths,
            assetIndex: options.assetIndex
        });
        this.templateDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: options.context.asAbsolutePath('images/template.png').replace(/\\/g, '/'),
            color: 'aqua'
        });
        this.variantDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: options.context.asAbsolutePath('images/variant.png').replace(/\\/g, '/'),
            color: '#B6A102'
        });
        this.resourceDecoration = vscode.window.createTextEditorDecorationType({ color: '#B6A102' });
        this.actionDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: options.context.asAbsolutePath('images/flash.png').replace(/\\/g, '/'),
            color: '#B6A102',
            gutterIconSize: 'contain'
        });
        this.behaviourDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: options.context.asAbsolutePath('images/cog.png').replace(/\\/g, '/'),
            color: '#B6A102',
            gutterIconSize: 'contain'
        });
        this.anvilRecipeDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: this.materialIconUri('anvil'),
            color: '#B6A102',
            gutterIconSize: 'contain'
        });
        this.craftingRecipeDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: this.materialIconUri('craftingTable'),
            color: '#B6A102',
            gutterIconSize: 'contain'
        });
        this.furnaceRecipeDecoration = vscode.window.createTextEditorDecorationType({
            gutterIconPath: this.materialIconUri('furnace'),
            color: '#B6A102',
            gutterIconSize: 'contain'
        });
        this.enabledDecoration = vscode.window.createTextEditorDecorationType({ color: '#20812d' });
        this.disabledDecoration = vscode.window.createTextEditorDecorationType({ color: '#444444' });
        this.disabledBlockDecoration = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            opacity: '0.7',
            isWholeLine: true
        });
        this.eventActionNameDecoration = vscode.window.createTextEditorDecorationType({
            color: '#C586C0',
            fontWeight: '600'
        });
        this.eventActionSuffixDecoration = vscode.window.createTextEditorDecorationType({
            color: '#6A737D'
        });
        this.deprecatedMarkerDecoration = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' *',
                color: '#FFD866',
                fontWeight: '700'
            }
        });
        this.genericDecorations = [
            this.templateDecoration,
            this.variantDecoration,
            this.resourceDecoration,
            this.actionDecoration,
            this.behaviourDecoration,
            this.anvilRecipeDecoration,
            this.craftingRecipeDecoration,
            this.furnaceRecipeDecoration,
            this.enabledDecoration,
            this.disabledDecoration,
            this.disabledBlockDecoration,
            this.eventActionNameDecoration,
            this.eventActionSuffixDecoration,
            this.deprecatedMarkerDecoration
        ];
        this.materialDecorations = this.createMaterialDecorations(options.schemas.$defs.bukkit_materials.enum);
        this.entityDecorations = this.createEntityDecorations(options.schemas.$defs.bukkit_entity_type.enum);
    }
    update(editor) {
        const text = editor.document.getText();
        const doc = YAML.parseDocument(text, { keepSourceTokens: true });
        const settings = this.options.getSettings();
        if (settings.enableDecorations) {
            this.applyRegexDecoration(editor, / template:\s*true/g, 'Template item', this.templateDecoration);
            this.applyRegexDecoration(editor, / variant_of:/g, 'Variant item', this.variantDecoration);
            this.applyRegexDecoration(editor, / resource:/g, 'The graphical part of item', this.resourceDecoration);
            this.applyRegexDecoration(editor, / events:/g, 'Events called by item', this.actionDecoration);
            this.applyRegexDecoration(editor, / behaviours:/g, 'Predefined behaviours item', this.behaviourDecoration);
            this.applyRegexDecoration(editor, /^\s*anvil_repair:/gm, 'Anvil repair recipes', this.anvilRecipeDecoration);
            this.applyRegexDecoration(editor, /^\s*crafting_table:/gm, 'Crafting table recipes', this.craftingRecipeDecoration);
            this.applyRegexDecoration(editor, /^\s*cooking:/gm, 'Furnace cooking recipes', this.furnaceRecipeDecoration);
            this.applyRegexDecoration(editor, /\btrue\b/g, 'This property **enabled**', this.enabledDecoration);
            this.applyRegexDecoration(editor, /\bfalse\b/g, 'This property is **disabled**', this.disabledDecoration);
            this.applyEnumDecorations(editor, text, 'Vanilla material', this.options.schemas.$defs.bukkit_materials.enum, this.materialDecorations);
            this.applyEnumDecorations(editor, text, 'Vanilla entity type', this.options.schemas.$defs.bukkit_entity_type.enum, this.entityDecorations);
            this.applyDisabledBlockDecorations(editor, text);
            this.applyAlternatingItemBackgrounds(editor, text);
            this.applyEventActionDecorations(editor, text);
            this.applyDeprecatedPropertyMarkers(editor, text);
            this.applyFontImagePreviews(editor, text, doc);
        }
        if (settings.enableImplicitNamespaceHints) {
            this.applyImplicitNamespaceHints(editor, text, doc);
        }
        if (settings.enableTextPreviews) {
            this.applyDictionaryFormattedPreviews(editor, text);
            this.applyTextColorPreviews(editor, text);
        }
        if (settings.enableDiagnostics) {
            this.assetDecorations = this.diagnosticsController.update(doc, text, editor, this.options.diagnostics, this.assetDecorations);
        }
        else {
            this.options.diagnostics.clear();
            this.assetDecorations.forEach(decoration => decoration.dispose());
            this.assetDecorations = [];
        }
    }
    updateTextPreviews(editor) {
        const text = editor.document.getText();
        const doc = YAML.parseDocument(text, { keepSourceTokens: true });
        const settings = this.options.getSettings();
        if (settings.enableImplicitNamespaceHints) {
            this.applyImplicitNamespaceHints(editor, text, doc);
        }
        if (settings.enableTextPreviews) {
            this.applyDictionaryFormattedPreviews(editor, text);
            this.applyTextColorPreviews(editor, text);
        }
    }
    clear(editor) {
        this.options.diagnostics.clear();
        this.assetDecorations.forEach(decoration => decoration.dispose());
        this.assetDecorations = [];
        this.alternatingDecorations.forEach(decoration => {
            editor?.setDecorations(decoration, []);
            decoration.dispose();
        });
        this.alternatingDecorations = [];
        this.textColorPreviewDecorations.forEach(decoration => {
            editor?.setDecorations(decoration, []);
            decoration.dispose();
        });
        this.textColorPreviewDecorations = [];
        this.textColorOriginalDecorations.forEach(decoration => {
            editor?.setDecorations(decoration, []);
            decoration.dispose();
        });
        this.textColorOriginalDecorations = [];
        this.dictionaryFormattedPreviewDecorations.forEach(decoration => {
            editor?.setDecorations(decoration, []);
            decoration.dispose();
        });
        this.dictionaryFormattedPreviewDecorations = [];
        this.dictionaryFormattedOriginalDecorations.forEach(decoration => {
            editor?.setDecorations(decoration, []);
            decoration.dispose();
        });
        this.dictionaryFormattedOriginalDecorations = [];
        this.fontImageDecorations.forEach(decoration => {
            editor?.setDecorations(decoration, []);
            decoration.dispose();
        });
        this.fontImageDecorations = [];
        this.implicitNamespaceDecorations.forEach(decoration => {
            editor?.setDecorations(decoration, []);
            decoration.dispose();
        });
        this.implicitNamespaceDecorations = [];
    }
    dispose() {
        this.clear();
        this.genericDecorations.forEach(decoration => decoration.dispose());
        for (const decoration of this.materialDecorations.types.values()) {
            decoration.dispose();
        }
        for (const decoration of this.entityDecorations.types.values()) {
            decoration.dispose();
        }
    }
    applyRegexDecoration(editor, regExp, description, decorationType) {
        const text = editor.document.getText();
        const decorations = [];
        let match;
        regExp.lastIndex = 0;
        while ((match = regExp.exec(text))) {
            decorations.push({
                range: new vscode.Range(editor.document.positionAt(match.index), editor.document.positionAt(match.index + match[0].length))
            });
        }
        editor.setDecorations(decorationType, decorations);
    }
    applyEnumDecorations(editor, text, description, values, decorationSet) {
        for (const value of values) {
            const decorationType = decorationSet.types.get(value);
            if (!decorationType) {
                continue;
            }
            const decorations = [];
            const regExp = new RegExp(`^(\\s*[\\w-]+\\s*:\\s*)(${this.escapeRegex(value)})\\b`, 'gmi');
            let match;
            while ((match = regExp.exec(text))) {
                const startOffset = match.index + match[1].length;
                decorations.push({
                    range: new vscode.Range(editor.document.positionAt(startOffset), editor.document.positionAt(startOffset + value.length))
                });
            }
            editor.setDecorations(decorationType, decorations);
        }
    }
    applyDisabledBlockDecorations(editor, text) {
        const decorations = (0, decorationRanges_1.findDisabledBlockRanges)(text).map(range => ({
            range: new vscode.Range(new vscode.Position(range.startLine, 0), new vscode.Position(range.endLine, range.endCharacter)),
            hoverMessage: '### element disabled.'
        }));
        editor.setDecorations(this.disabledBlockDecoration, decorations);
    }
    applyAlternatingItemBackgrounds(editor, text) {
        this.alternatingDecorations.forEach(decoration => decoration.dispose());
        this.alternatingDecorations = [];
        const isLightTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
        const decorationTypeA = vscode.window.createTextEditorDecorationType({
            backgroundColor: isLightTheme ? 'rgba(255, 0, 170, 0.2)' : 'rgba(255, 0, 170, 0.03)',
            isWholeLine: true
        });
        const decorationTypeB = vscode.window.createTextEditorDecorationType({
            backgroundColor: isLightTheme ? 'rgba(132, 0, 255, 0.2)' : 'rgba(0, 238, 255, 0.03)',
            isWholeLine: true
        });
        this.alternatingDecorations.push(decorationTypeA, decorationTypeB);
        const ranges = (0, decorationRanges_1.findCollectionBlockRanges)(text, this.options.schemas);
        const decorationsA = [];
        const decorationsB = [];
        const lines = text.split('\n');
        ranges.forEach((range, index) => {
            const target = index % 2 === 0 ? decorationsA : decorationsB;
            for (let lineIndex = range.startLine; lineIndex < range.endLine; lineIndex++) {
                const lineText = lines[lineIndex] ?? '';
                const firstTextColumn = lineText.search(/\S/);
                target.push({
                    range: new vscode.Range(new vscode.Position(lineIndex, firstTextColumn === -1 ? 0 : firstTextColumn), new vscode.Position(lineIndex, lineText.length))
                });
            }
        });
        editor.setDecorations(decorationTypeA, decorationsA);
        editor.setDecorations(decorationTypeB, decorationsB);
    }
    applyEventActionDecorations(editor, text) {
        const actionNames = this.eventActionNames();
        const actionNameDecorations = [];
        const actionSuffixDecorations = [];
        for (const entry of this.yamlKeyEntries(text)) {
            if (!entry.parentPath.includes('events') || entry.parentPath.some(parent => this.actionBaseFor(parent, actionNames))) {
                continue;
            }
            const actionBase = this.actionBaseFor(entry.key, actionNames);
            if (!actionBase) {
                continue;
            }
            actionNameDecorations.push({
                range: new vscode.Range(new vscode.Position(entry.line, entry.keyStart), new vscode.Position(entry.line, entry.keyStart + actionBase.length)),
                hoverMessage: `ItemsAdder action: \`${actionBase}\``
            });
            if (entry.key.length > actionBase.length) {
                actionSuffixDecorations.push({
                    range: new vscode.Range(new vscode.Position(entry.line, entry.keyStart + actionBase.length), new vscode.Position(entry.line, entry.keyEnd)),
                    hoverMessage: 'Action identifier suffix'
                });
            }
        }
        editor.setDecorations(this.eventActionNameDecoration, actionNameDecorations);
        editor.setDecorations(this.eventActionSuffixDecoration, actionSuffixDecorations);
    }
    applyDeprecatedPropertyMarkers(editor, text) {
        const decorations = [];
        for (const entry of this.yamlKeyEntries(text)) {
            const schemaNode = this.schemaNodeAtPath([...entry.parentPath, entry.key]);
            if (!schemaNode?.deprecated) {
                continue;
            }
            decorations.push({
                range: new vscode.Range(new vscode.Position(entry.line, entry.keyStart), new vscode.Position(entry.line, entry.keyEnd))
            });
        }
        editor.setDecorations(this.deprecatedMarkerDecoration, decorations);
    }
    applyFontImagePreviews(editor, text, doc) {
        this.fontImageDecorations.forEach(decoration => decoration.dispose());
        this.fontImageDecorations = [];
        const namespace = this.readNamespace(doc);
        if (!namespace || editor.document.uri.scheme !== 'file') {
            return;
        }
        const resolver = new assetPathResolver_1.AssetPathResolver({
            workspaceFolders: vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath) ?? [],
            documentPath: editor.document.uri.fsPath,
            fileNamespace: namespace,
            vanillaTexturePaths: this.options.vanillaTexturePaths,
            assetIndex: this.options.assetIndex
        });
        const lines = text.split('\n');
        for (const entry of this.yamlKeyEntries(text)) {
            if (entry.key !== 'path' || entry.parentPath.length !== 2 || entry.parentPath[0] !== 'font_images') {
                continue;
            }
            const scalar = this.readScalarValue(lines[entry.line] ?? '', entry.keyEnd);
            if (!scalar) {
                continue;
            }
            const resolution = resolver.resolveTexture(scalar.value);
            const decorationType = vscode.window.createTextEditorDecorationType({
                gutterIconPath: this.fontImageGutterIcon(resolution),
                gutterIconSize: 'contain'
            });
            this.fontImageDecorations.push(decorationType);
            editor.setDecorations(decorationType, [{
                    range: new vscode.Range(new vscode.Position(entry.line, scalar.startCharacter), new vscode.Position(entry.line, scalar.endCharacter)),
                    hoverMessage: this.assetHoverMessage(resolution.assetPath, resolution.found ? 'Font image preview' : 'Font image not found')
                }]);
        }
    }
    applyImplicitNamespaceHints(editor, text, doc) {
        this.implicitNamespaceDecorations.forEach(decoration => decoration.dispose());
        this.implicitNamespaceDecorations = [];
        const namespace = this.readNamespace(doc);
        if (!namespace) {
            return;
        }
        const references = this.findImplicitNamespaceReferences(text)
            .filter(reference => !this.isSelectionOnLine(editor, reference.line));
        if (references.length === 0) {
            return;
        }
        const decorationType = vscode.window.createTextEditorDecorationType({
            before: {
                contentText: `${namespace}:`,
                color: '#6A9955',
                fontStyle: 'italic'
            }
        });
        this.implicitNamespaceDecorations.push(decorationType);
        editor.setDecorations(decorationType, references.map(reference => {
            const position = new vscode.Position(reference.line, reference.character);
            return {
                range: new vscode.Range(position, position),
                hoverMessage: `Implicit ${reference.kind} namespace: \`${namespace}:${reference.value}\``
            };
        }));
    }
    findImplicitNamespaceReferences(text) {
        const entries = this.yamlKeyEntries(text);
        const lines = text.split('\n');
        const references = [];
        for (const entry of entries) {
            const kind = this.implicitNamespaceKindForScalar(entry);
            if (!kind) {
                continue;
            }
            const scalar = this.readScalarValue(lines[entry.line] ?? '', entry.keyEnd);
            if (!scalar || !this.isImplicitNamespaceValue(scalar.value)) {
                continue;
            }
            references.push({
                line: entry.line,
                character: this.scalarContentStart(lines[entry.line] ?? '', scalar.startCharacter),
                value: scalar.value,
                kind
            });
        }
        lines.forEach((lineText, line) => {
            const scalar = this.readSequenceScalarValue(lineText);
            if (!scalar || !this.isImplicitNamespaceValue(scalar.value)) {
                return;
            }
            const parentPath = this.parentPathForSequenceItem(entries, line, scalar.indent);
            const kind = this.implicitNamespaceKindForSequence(parentPath);
            if (!kind) {
                return;
            }
            references.push({
                line,
                character: scalar.startCharacter,
                value: scalar.value,
                kind
            });
        });
        return references;
    }
    implicitNamespaceKindForScalar(entry) {
        const schemaKind = this.implicitNamespaceKindForPath([...entry.parentPath, entry.key]);
        if (schemaKind) {
            return schemaKind;
        }
        const parent = entry.parentPath[entry.parentPath.length - 1];
        const key = entry.key;
        if (key === 'path' && entry.parentPath[0] === 'sounds') {
            return 'sound';
        }
        if (key === 'path' && entry.parentPath[0] === 'font_images') {
            return 'texture';
        }
        if (key === 'texture' || key === 'icon' || parent === 'textures') {
            return 'texture';
        }
        if (key === 'model' || key === 'model_path' || parent === 'models') {
            return 'model';
        }
        if (key === 'sound' || key === 'play_sound' || key.endsWith('_sound') || (key === 'song' && parent === 'jukebox_disc') || parent === 'sounds') {
            return 'sound';
        }
        if (key === 'item' || key === 'itemstack' || key === 'ingredient' || key === 'result' || key === 'drop' || parent === 'items') {
            return 'item';
        }
        if (key === 'block' || key === 'from' || key === 'to' || parent === 'blocks') {
            return 'block';
        }
        return undefined;
    }
    implicitNamespaceKindForSequence(parentPath) {
        const parent = parentPath[parentPath.length - 1];
        const schemaKind = this.implicitNamespaceKindForSequencePath(parentPath);
        if (schemaKind) {
            return schemaKind;
        }
        if (parent === 'textures') {
            return 'texture';
        }
        if (parent === 'models') {
            return 'model';
        }
        if (parent === 'sounds') {
            return 'sound';
        }
        if (parent === 'items') {
            return 'item';
        }
        if (parent === 'blocks') {
            return 'block';
        }
        return undefined;
    }
    implicitNamespaceKindForPath(path) {
        return this.implicitNamespaceKindForSchema(this.schemaNodeAtPath(path), path[path.length - 1], path);
    }
    implicitNamespaceKindForSequencePath(parentPath) {
        const parentSchema = this.schemaNodeAtPath(parentPath);
        return this.implicitNamespaceKindForSchema(parentSchema?.items ?? parentSchema, parentPath[parentPath.length - 1], parentPath);
    }
    implicitNamespaceKindForSchema(schemaNode, key, path) {
        const schema = this.resolveSchemaRef(schemaNode);
        if (!schema) {
            return undefined;
        }
        const id = String(schema.$id ?? '').toLowerCase();
        const keyName = String(key ?? '').toLowerCase();
        const text = [
            schema.title,
            schema.markdownDescription,
            schema.description,
            schema.detail
        ].filter(Boolean).join('\n').toLowerCase();
        if (id === 'bukkit_materials_and_customitems') {
            return 'item';
        }
        if (id === 'bukkit_and_custom_blocks') {
            return 'block';
        }
        if (id === 'vanilla_and_custom_sound') {
            return 'sound';
        }
        if (id === 'custom_and_bukkit_entity_type') {
            return 'entity';
        }
        if (text.includes('custom itemsadder block') || text.includes('vanilla/custom blocks')) {
            return 'block';
        }
        if (text.includes('itemsadder custom item') || text.includes('custom item or vanilla material')) {
            return 'item';
        }
        if (text.includes('custom entity') && (keyName === 'entity' || keyName === 'type' || keyName.endsWith('_entity'))) {
            return 'entity';
        }
        if ((keyName === 'texture' || keyName === 'textures' || keyName === 'icon' || keyName.endsWith('_texture')) && text.includes('texture')) {
            return 'texture';
        }
        if ((keyName === 'model' || keyName === 'models' || keyName === 'model_path' || keyName.endsWith('_model')) && text.includes('model')) {
            return 'model';
        }
        if ((keyName === 'sound' || keyName === 'name' || keyName === 'song' || keyName === 'play_sound' || keyName.endsWith('_sound')) &&
            (text.includes('custom sound') || text.includes('vanilla sound') || text.includes('sound played') || text.includes('declared in the `sounds` section'))) {
            return 'sound';
        }
        if (keyName === 'song' && (text.includes('namespaced id') || path.includes('jukebox_disc'))) {
            return 'sound';
        }
        return undefined;
    }
    isImplicitNamespaceValue(value) {
        if (!value || value.includes(':')) {
            return false;
        }
        if (/^(https?|file|command):/i.test(value) || value.startsWith('/') || value.startsWith('<')) {
            return false;
        }
        if (/\s|\\/.test(value)) {
            return false;
        }
        return !/^[A-Z0-9_]+$/.test(value);
    }
    scalarContentStart(line, startCharacter) {
        const quote = line[startCharacter];
        return quote === '"' || quote === "'" ? startCharacter + 1 : startCharacter;
    }
    readSequenceScalarValue(line) {
        const match = line.match(/^(\s*)-\s*/);
        if (!match) {
            return undefined;
        }
        const indent = match[1].length;
        const rawStart = match[0].length;
        if (rawStart >= line.length) {
            return undefined;
        }
        const quote = line[rawStart];
        if (quote === '"' || quote === "'") {
            const end = line.indexOf(quote, rawStart + 1);
            if (end === -1) {
                return undefined;
            }
            return {
                indent,
                startCharacter: rawStart + 1,
                value: line.slice(rawStart + 1, end)
            };
        }
        const commentStart = line.indexOf(' #', rawStart);
        const end = commentStart === -1 ? line.length : commentStart;
        const valueEnd = line.slice(0, end).trimEnd().length;
        const value = line.slice(rawStart, valueEnd).trim();
        return value
            ? { indent, startCharacter: rawStart, value }
            : undefined;
    }
    parentPathForSequenceItem(entries, line, indent) {
        let parent;
        for (const entry of entries) {
            if (entry.line >= line) {
                break;
            }
            if (entry.indent <= indent) {
                parent = entry;
            }
        }
        return parent ? [...parent.parentPath, parent.key] : [];
    }
    isSelectionOnLine(editor, line) {
        return editor.selections.some(selection => selection.active.line === line);
    }
    applyDictionaryFormattedPreviews(editor, text) {
        this.dictionaryFormattedPreviewDecorations.forEach(decoration => decoration.dispose());
        this.dictionaryFormattedPreviewDecorations = [];
        this.dictionaryFormattedOriginalDecorations.forEach(decoration => decoration.dispose());
        this.dictionaryFormattedOriginalDecorations = [];
        if (!this.options.dictionaryIndex) {
            return;
        }
        const previewGroups = new Map();
        const hiddenOriginals = [];
        for (const reference of (0, dictionaryReferences_1.findDictionaryReferenceRanges)(text)) {
            const entry = reference.kind === 'minecraft_lang'
                ? this.options.dictionaryIndex.lookupMinecraftLang(reference.key)
                : this.options.dictionaryIndex.lookup(reference.key);
            if (!entry) {
                continue;
            }
            const parts = (0, minecraftTextColors_1.formatMinecraftTextPreviewParts)(entry.value);
            if (parts.length === 0) {
                continue;
            }
            const isActive = this.isSelectionInPreviewContext(editor, reference.line);
            const shouldReplaceOriginal = !isActive;
            const previewCharacter = shouldReplaceOriginal ? reference.startCharacter : reference.endCharacter;
            if (shouldReplaceOriginal) {
                hiddenOriginals.push(new vscode.Range(new vscode.Position(reference.line, reference.startCharacter), new vscode.Position(reference.line, reference.endCharacter)));
            }
            parts.forEach((part, index) => {
                const contentText = `${!shouldReplaceOriginal && index === 0 ? '    ' : ''}${part.text}`;
                if (!contentText) {
                    return;
                }
                const key = JSON.stringify({
                    contentText,
                    color: part.color,
                    bold: part.bold,
                    italic: part.italic
                });
                const decorations = previewGroups.get(key) ?? [];
                const hover = new vscode.MarkdownString(undefined, true);
                hover.isTrusted = true;
                hover.appendMarkdown(`${reference.kind === 'minecraft_lang' ? 'Minecraft lang' : 'Dictionary'} key \`${reference.key}\``);
                if (entry.sourcePath) {
                    const args = encodeURIComponent(JSON.stringify([entry.sourcePath]));
                    hover.appendMarkdown(`\n\n[Open translation source](command:ia-vscode.openTranslationSource?${args})`);
                }
                decorations.push({
                    range: new vscode.Range(new vscode.Position(reference.line, previewCharacter), new vscode.Position(reference.line, previewCharacter)),
                    hoverMessage: hover
                });
                previewGroups.set(key, decorations);
            });
        }
        if (hiddenOriginals.length > 0) {
            const hiddenDecorationType = vscode.window.createTextEditorDecorationType({
                color: 'transparent',
                opacity: '0'
            });
            this.dictionaryFormattedOriginalDecorations.push(hiddenDecorationType);
            editor.setDecorations(hiddenDecorationType, hiddenOriginals);
        }
        for (const [key, decorations] of previewGroups) {
            const options = JSON.parse(key);
            const decorationType = vscode.window.createTextEditorDecorationType({
                after: {
                    contentText: options.contentText,
                    color: options.color,
                    fontStyle: options.italic ? 'italic' : undefined,
                    fontWeight: options.bold ? 'bold' : undefined
                }
            });
            this.dictionaryFormattedPreviewDecorations.push(decorationType);
            editor.setDecorations(decorationType, decorations);
        }
    }
    applyTextColorPreviews(editor, text) {
        this.textColorPreviewDecorations.forEach(decoration => decoration.dispose());
        this.textColorPreviewDecorations = [];
        this.textColorOriginalDecorations.forEach(decoration => decoration.dispose());
        this.textColorOriginalDecorations = [];
        const previewGroups = new Map();
        const hiddenOriginals = [];
        for (const preview of (0, minecraftTextColors_1.findMinecraftTextColorLinePreviews)(text)) {
            if (this.hasResolvedDictionaryPreview(text, preview)) {
                continue;
            }
            const isActive = this.isSelectionInPreviewContext(editor, preview.line);
            const previewCharacter = isActive ? preview.character : preview.startCharacter;
            if (!isActive) {
                hiddenOriginals.push(new vscode.Range(new vscode.Position(preview.line, preview.startCharacter), new vscode.Position(preview.line, preview.endCharacter)));
            }
            preview.parts.forEach((part, index) => {
                const contentText = `${isActive && index === 0 ? '    ' : ''}${part.text}`;
                const key = JSON.stringify({
                    contentText,
                    color: part.color,
                    bold: part.bold,
                    italic: part.italic
                });
                const decorations = previewGroups.get(key) ?? [];
                decorations.push({
                    range: new vscode.Range(new vscode.Position(preview.line, previewCharacter), new vscode.Position(preview.line, previewCharacter)),
                    hoverMessage: 'Minecraft formatted text preview'
                });
                previewGroups.set(key, decorations);
            });
        }
        if (hiddenOriginals.length > 0) {
            const hiddenDecorationType = vscode.window.createTextEditorDecorationType({
                color: 'transparent',
                opacity: '0'
            });
            this.textColorOriginalDecorations.push(hiddenDecorationType);
            editor.setDecorations(hiddenDecorationType, hiddenOriginals);
        }
        for (const [key, decorations] of previewGroups) {
            const options = JSON.parse(key);
            const decorationType = vscode.window.createTextEditorDecorationType({
                after: {
                    contentText: options.contentText,
                    color: options.color,
                    fontStyle: options.italic ? 'italic' : undefined,
                    fontWeight: options.bold ? 'bold' : undefined
                }
            });
            this.textColorPreviewDecorations.push(decorationType);
            editor.setDecorations(decorationType, decorations);
        }
    }
    isSelectionInPreviewContext(editor, line) {
        const active = editor.selection.active;
        return active.line === line;
    }
    hasResolvedDictionaryPreview(text, preview) {
        if (!this.options.dictionaryIndex) {
            return false;
        }
        return (0, dictionaryReferences_1.findDictionaryReferenceRanges)(text).some(reference => {
            if (reference.line !== preview.line ||
                reference.startCharacter !== preview.startCharacter ||
                reference.endCharacter !== preview.endCharacter) {
                return false;
            }
            return Boolean(reference.kind === 'minecraft_lang'
                ? this.options.dictionaryIndex?.lookupMinecraftLang(reference.key)
                : this.options.dictionaryIndex?.lookup(reference.key));
        });
    }
    closestParentBlock(lines, line) {
        const childIndent = this.lineIndent(lines[line] ?? '');
        for (let parentLine = line - 1; parentLine >= 0; parentLine--) {
            const parentText = lines[parentLine] ?? '';
            const trimmed = parentText.trim();
            if (!trimmed) {
                continue;
            }
            const parentIndent = this.lineIndent(parentText);
            if (parentIndent < childIndent && trimmed.endsWith(':')) {
                return {
                    startLine: parentLine,
                    endLine: this.blockEndLine(lines, parentLine, parentIndent)
                };
            }
        }
        return undefined;
    }
    blockEndLine(lines, startLine, blockIndent) {
        for (let line = startLine + 1; line < lines.length; line++) {
            const text = lines[line] ?? '';
            if (!text.trim()) {
                continue;
            }
            if (this.lineIndent(text) <= blockIndent) {
                return line - 1;
            }
        }
        return lines.length - 1;
    }
    lineIndent(text) {
        return text.match(/^\s*/)?.[0].length ?? 0;
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
    readScalarValue(line, keyEnd) {
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
    fontImageGutterIcon(resolution) {
        if (!resolution.found || !resolution.assetPath) {
            return vscode.Uri.file(this.options.context.asAbsolutePath('images/missing.png').replace(/\\/g, '/'));
        }
        return vscode.Uri.file((0, animatedPngFirstFrame_1.firstFramePngPath)(resolution.assetPath, this.options.context.globalStorageUri.fsPath));
    }
    assetHoverMessage(assetPath, title) {
        const markdown = new vscode.MarkdownString(undefined, true);
        markdown.isTrusted = true;
        markdown.appendMarkdown(title);
        if (assetPath) {
            markdown.appendMarkdown(`\n\nFound file: \`${(0, pathDisplay_1.displayWorkspacePath)(assetPath)}\``);
            const args = encodeURIComponent(JSON.stringify([assetPath]));
            markdown.appendMarkdown(`\n\n[Open asset source](command:ia-vscode.openAssetSource?${args})`);
        }
        return markdown;
    }
    yamlKeyEntries(text) {
        const entries = [];
        const parents = [];
        const lines = text.split('\n');
        lines.forEach((lineText, line) => {
            if (/^\s*-\s+/.test(lineText)) {
                return;
            }
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
                keyStart: indent,
                keyEnd: indent + key.length,
                parentPath: parents.map(parent => parent.key)
            });
            parents.push({ indent, key });
        });
        return entries;
    }
    eventActionNames() {
        return Object.keys(this.options.schemas.$defs?.actions?.properties ?? {})
            .sort((left, right) => right.length - left.length);
    }
    actionBaseFor(key, actionNames) {
        return actionNames.find(actionName => key === actionName || key.startsWith(`${actionName}_`));
    }
    schemaNodeAtPath(path) {
        let current = this.resolveSchemaRef(this.options.schemas);
        for (const segment of path) {
            current = this.resolveSchemaRef(current);
            if (!current) {
                return undefined;
            }
            if (current.properties?.[segment]) {
                current = current.properties[segment];
                continue;
            }
            const patternSchema = this.patternSchemaFor(current, segment);
            if (patternSchema) {
                current = patternSchema;
                continue;
            }
            if (current.additionalProperties) {
                current = current.additionalProperties;
                continue;
            }
            if (current.items) {
                current = current.items;
                continue;
            }
            return undefined;
        }
        return this.resolveSchemaRef(current);
    }
    patternSchemaFor(schemaNode, segment) {
        const patterns = schemaNode?.patternProperties;
        if (!patterns) {
            return undefined;
        }
        for (const [pattern, value] of Object.entries(patterns)) {
            if (new RegExp(pattern).test(segment)) {
                return value;
            }
        }
        return undefined;
    }
    resolveSchemaRef(schemaNode) {
        if (!schemaNode?.$ref) {
            return schemaNode;
        }
        const refKey = String(schemaNode.$ref).split('/').pop();
        return refKey ? this.options.schemas.$defs?.[refKey] ?? schemaNode : schemaNode;
    }
    materialIconUri(name) {
        const textureByMaterial = {
            anvil: 'block/anvil_top.png',
            craftingTable: 'block/crafting_table_top.png',
            furnace: 'block/furnace_front.png'
        };
        return vscode.Uri.parse((0, vanillaMinecraftAssets_1.vanillaTextureUrl)(textureByMaterial[name]));
    }
    createMaterialDecorations(materials) {
        return this.createEnumDecorations(materials, '#886c99', value => {
            const fileName = value.toLowerCase().replace(/_/g, '-');
            return vscode.Uri.parse(`https://raw.githubusercontent.com/LoneDev6/crafting-icons/master/32/${fileName}/${fileName}.png`);
        });
    }
    createEntityDecorations(entities) {
        return this.createEnumDecorations(entities, '#886c99', value => vscode.Uri.parse(`https://raw.githubusercontent.com/LoneDev6/mc-entities-icons/master/icons/${value}.gif`));
    }
    createEnumDecorations(values, color, iconUriForValue) {
        const types = new Map();
        for (const value of values) {
            types.set(value, vscode.window.createTextEditorDecorationType({
                color,
                gutterIconPath: iconUriForValue?.(value),
                gutterIconSize: iconUriForValue ? 'contain' : undefined,
                overviewRulerColor: iconUriForValue ? 'blue' : undefined,
                overviewRulerLane: iconUriForValue ? vscode.OverviewRulerLane.Right : undefined
            }));
        }
        return { types };
    }
    escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
exports.EditorDecorationController = EditorDecorationController;
//# sourceMappingURL=editorDecorationController.js.map