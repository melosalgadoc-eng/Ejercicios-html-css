"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsAdderCompletionProvider = void 0;
const vscode = require("vscode");
const YAML = require("yaml");
const definitionReferences_1 = require("./definitionReferences");
const yamlPath_1 = require("./yamlPath");
const pathDisplay_1 = require("./pathDisplay");
const vanillaMinecraftAssets_1 = require("./vanillaMinecraftAssets");
const itemsAdderPluginConfig_1 = require("../itemsAdderPluginConfig");
class ItemsAdderCompletionProvider {
    constructor(options) {
        this.options = options;
    }
    provideCompletionItems(document, position) {
        const text = document.getText();
        if ((0, itemsAdderPluginConfig_1.isItemsAdderPluginConfigText)(text)) {
            return this.providePluginConfigCompletionItems(document, position);
        }
        const yamlPath = (0, yamlPath_1.getYamlParentPathFromText)(text, position);
        const items = [];
        this.addSpecialSuggestions(document, position, yamlPath, items);
        this.addDynamicEntrySuggestions(document, position, yamlPath, items);
        return items;
    }
    providePluginConfigCompletionItems(document, position) {
        const schema = (0, itemsAdderPluginConfig_1.pluginConfigSchemaForText)(document.getText(), this.options.pluginConfigSchema);
        if (!schema) {
            return [];
        }
        const currentLine = document.lineAt(position.line).text;
        const valueMatch = currentLine.match(/^(\s*[^:#][^:]*:\s*)(.*)$/);
        const yamlPath = (0, yamlPath_1.getYamlParentPathFromText)(document.getText(), position);
        const items = [];
        if (valueMatch && position.character >= valueMatch[1].length) {
            this.addSchemaValueSuggestions(schema, yamlPath, items);
            return items;
        }
        this.addSchemaPropertySuggestions(schema, document, position, yamlPath, items);
        return items;
    }
    addSchemaPropertySuggestions(schema, document, position, yamlPath, items) {
        const schemaNode = this.schemaNodeAtPathFrom(schema, yamlPath);
        const properties = schemaNode?.properties;
        if (!properties) {
            return;
        }
        const usedKeys = (0, yamlPath_1.getYamlSameLevelPropertiesFromText)(document.getText(), position);
        for (const [key, property] of Object.entries(properties)) {
            if (usedKeys.includes(key)) {
                continue;
            }
            const resolved = this.resolveRefFrom(property, schema);
            this.addEntrySuggestion(items, key, this.descriptionForFrom(resolved, schema, 'Config property.'));
        }
    }
    addSchemaValueSuggestions(schema, yamlPath, items) {
        const schemaNode = this.schemaNodeAtPathFrom(schema, yamlPath);
        const values = this.valueSuggestionsFor(schemaNode, schema);
        for (const value of values) {
            const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value);
            item.insertText = value;
            items.push(item);
        }
    }
    valueSuggestionsFor(schemaNode, rootSchema) {
        const resolved = this.resolveRefFrom(schemaNode, rootSchema);
        if (!resolved) {
            return [];
        }
        if (Array.isArray(resolved.enum)) {
            return resolved.enum.map((value) => String(value));
        }
        if (resolved.const !== undefined) {
            return [String(resolved.const)];
        }
        if (resolved.type === 'boolean') {
            return ['true', 'false'];
        }
        if (Array.isArray(resolved.anyOf)) {
            return Array.from(new Set(resolved.anyOf.flatMap((entry) => this.valueSuggestionsFor(entry, rootSchema))));
        }
        return [];
    }
    addSpecialSuggestions(document, position, yamlPath, items) {
        const currentLine = document.lineAt(position.line).text;
        const keyValueMatch = currentLine.match(/^(\s*[^:#][^:]*:\s*)(.*)$/);
        const arrayMatch = currentLine.match(/^(\s*-\s*)(.*)$/);
        const valuePrefixLength = arrayMatch?.[1].length ?? keyValueMatch?.[1].length;
        const isValuePosition = valuePrefixLength !== undefined && position.character >= valuePrefixLength;
        if (yamlPath.length === 4 && yamlPath[0] === 'items' && yamlPath[2] === 'consumable' && yamlPath[3] === 'effects') {
            this.addUniqueEntrySuggestion(document, position, items, 'apply_status_effects');
            this.addUniqueEntrySuggestion(document, position, items, 'remove_status_effects');
            this.addUniqueEntrySuggestion(document, position, items, 'play_sound');
        }
        if (yamlPath.length === 2 && yamlPath[0] === 'sounds') {
            this.addUniqueEntrySuggestion(document, position, items, 'variant');
        }
        if (isValuePosition && yamlPath.length === 3 && yamlPath[0] === 'items' && yamlPath[2] === 'name') {
            const name = this.toDisplayName(yamlPath[1]);
            this.addTextSuggestion(items, name, 'Name shown in inventory tooltip.');
            this.addTextSuggestion(items, `item-${yamlPath[1]}`, 'Dictionary key for multi-language item name.');
            this.addTextSuggestion(items, 'Item', 'Name shown in inventory tooltip.');
        }
        if (yamlPath.length === 2 && yamlPath[0] === 'items') {
            const usedKeys = (0, yamlPath_1.getYamlSameLevelPropertiesFromText)(document.getText(), position);
            if (!usedKeys.includes('name')) {
                this.addTextSuggestion(items, `name: ${this.toDisplayName(yamlPath[1])}`, 'Name shown in inventory tooltip.');
            }
        }
        if (yamlPath.length === 1 && yamlPath[0] === 'items') {
            this.addItemTemplates(items);
        }
        if (isValuePosition && this.isTexturePath(yamlPath)) {
            this.addVanillaTextureSuggestions(document, position, items);
            if (this.getEnableCustomReferenceAutocomplete()) {
                this.addWorkspaceAssetSuggestions(document, position, items, 'texture');
            }
        }
        if (isValuePosition && this.isModelPath(yamlPath) && this.getEnableCustomReferenceAutocomplete()) {
            this.addWorkspaceAssetSuggestions(document, position, items, 'model');
        }
        if (isValuePosition && this.getEnableCustomReferenceAutocomplete()) {
            this.addWorkspaceDefinitionSuggestions(document, position, yamlPath, items);
        }
        if (yamlPath.length >= 5 &&
            yamlPath[0] === 'recipes' &&
            yamlPath[1] === 'crafting_table' &&
            yamlPath[3] === 'return_items' &&
            yamlPath[4] === 'replace') {
            if (!currentLine.includes(': ') && !currentLine.endsWith(':')) {
                for (const material of this.options.schemas.$defs.bukkit_materials.enum) {
                    this.addEntrySuggestion(items, material, 'Material to replace.', false, vscode.CompletionItemKind.EnumMember);
                }
            }
        }
    }
    addDynamicEntrySuggestions(document, position, yamlPath, items) {
        const schemaNode = this.schemaNodeAtPath(yamlPath);
        const properties = schemaNode?.properties;
        if (!properties) {
            return;
        }
        const usedKeys = (0, yamlPath_1.getYamlSameLevelPropertiesFromText)(document.getText(), position);
        for (const key of Object.keys(properties)) {
            const property = this.resolveRef(properties[key]);
            if (property?.doNotSuggest) {
                continue;
            }
            if (!key.startsWith('my_')) {
                continue;
            }
            const uniqueKey = this.uniqueKey(`${key}_1`, usedKeys);
            this.addEntrySuggestion(items, uniqueKey, this.descriptionFor(property, 'New entry.'));
        }
    }
    schemaNodeAtPath(yamlPath) {
        return this.schemaNodeAtPathFrom(this.options.schemas, yamlPath);
    }
    schemaNodeAtPathFrom(schema, yamlPath) {
        let current = this.resolveRefFrom(schema, schema);
        for (const segment of yamlPath) {
            current = this.resolveRefFrom(current, schema);
            if (!current) {
                return undefined;
            }
            if (current.properties?.[segment]) {
                current = current.properties[segment];
                continue;
            }
            if (current.additionalProperties) {
                current = current.additionalProperties;
                continue;
            }
            return undefined;
        }
        return this.resolveRefFrom(current, schema);
    }
    resolveRef(schemaNode) {
        return this.resolveRefFrom(schemaNode, this.options.schemas);
    }
    resolveRefFrom(schemaNode, rootSchema) {
        if (!schemaNode?.$ref) {
            return schemaNode;
        }
        const refKey = String(schemaNode.$ref).split('/').pop();
        return refKey ? rootSchema.$defs?.[refKey] ?? schemaNode : schemaNode;
    }
    descriptionFor(schemaNode, fallback) {
        return this.descriptionForFrom(schemaNode, this.options.schemas, fallback);
    }
    descriptionForFrom(schemaNode, rootSchema, fallback) {
        const resolved = this.resolveRefFrom(schemaNode, rootSchema);
        return resolved?.markdownDescription ?? resolved?.description ?? fallback;
    }
    addUniqueEntrySuggestion(document, position, items, key) {
        const usedKeys = (0, yamlPath_1.getYamlSameLevelPropertiesFromText)(document.getText(), position);
        this.addEntrySuggestion(items, this.uniqueKey(key, usedKeys), 'New entry.');
    }
    uniqueKey(baseKey, usedKeys) {
        let key = baseKey;
        let index = 1;
        while (usedKeys.includes(key)) {
            key = `${baseKey}_${index}`;
            index++;
        }
        return key;
    }
    addEntrySuggestion(items, name, description, addNewLine = true, kind = vscode.CompletionItemKind.Property) {
        const item = new vscode.CompletionItem(name, kind);
        item.detail = description;
        item.insertText = addNewLine ? `${name}:\n  ` : `${name}: `;
        items.push(item);
    }
    addTextSuggestion(items, name, description) {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Text);
        item.detail = description;
        item.insertText = name;
        items.push(item);
    }
    addItemTemplates(items) {
        for (const template of this.options.itemTemplates) {
            if (template.devMode && !this.options.getDevMode()) {
                continue;
            }
            const item = new vscode.CompletionItem(template.label, vscode.CompletionItemKind.Class);
            item.sortText = `~${template.label}`;
            item.detail = template.detail ?? template.label;
            item.insertText = YAML.stringify(template.object);
            items.push(item);
        }
    }
    addVanillaTextureSuggestions(document, position, items) {
        for (const texturePath of this.options.vanillaTexturePaths) {
            const namespacedPath = `minecraft:${texturePath}`;
            const item = new vscode.CompletionItem(namespacedPath, vscode.CompletionItemKind.File);
            item.detail = 'Vanilla texture';
            item.insertText = this.withArrayPrefix(document, position, namespacedPath);
            item.documentation = new vscode.MarkdownString(`\`assets/minecraft/textures/${texturePath}\`\n\n![Texture Preview](${(0, vanillaMinecraftAssets_1.vanillaTextureUrl)(texturePath)}|width=100)`);
            items.push(item);
        }
    }
    addWorkspaceAssetSuggestions(document, position, items, kind) {
        const namespace = this.readNamespace(document);
        if (!namespace || !this.options.assetIndex) {
            return;
        }
        const replacementRange = this.currentScalarReplacementRange(document, position);
        for (const asset of this.options.assetIndex.list(kind)) {
            const assetLabel = this.workspaceAssetLabel(asset.path, kind);
            const label = asset.namespace === namespace ? assetLabel : `${asset.namespace}:${assetLabel}`;
            const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.File);
            item.insertText = this.withArrayPrefix(document, position, label);
            if (replacementRange) {
                item.range = replacementRange;
            }
            item.documentation = this.workspaceAssetDocumentation(asset.fullPath, label, kind);
            items.push(item);
        }
    }
    currentScalarReplacementRange(document, position) {
        const line = document.lineAt(position.line).text;
        const keyValueMatch = line.match(/^(\s*[^:#][^:]*:\s*)(.*)$/);
        const arrayMatch = line.match(/^(\s*-\s+)(.*)$/);
        const prefixLength = arrayMatch?.[1].length ?? keyValueMatch?.[1].length;
        const rawValue = arrayMatch?.[2] ?? keyValueMatch?.[2];
        if (prefixLength === undefined || rawValue === undefined) {
            return undefined;
        }
        const leadingSpaces = rawValue.length - rawValue.trimStart().length;
        const startCharacter = prefixLength + leadingSpaces;
        if (position.character < startCharacter) {
            return undefined;
        }
        return new vscode.Range(position.line, startCharacter, position.line, position.character);
    }
    workspaceAssetLabel(assetPath, kind) {
        if (kind === 'texture') {
            return assetPath.replace(/\.png$/, '');
        }
        if (kind === 'model') {
            return assetPath.replace(/\.json$/, '');
        }
        return assetPath.replace(/\.ogg$/, '');
    }
    workspaceAssetDocumentation(fullPath, assetPath, kind) {
        const normalizedPath = fullPath.replace(/\\/g, '/');
        const displayPath = (0, pathDisplay_1.displayWorkspacePath)(normalizedPath, kind);
        if (kind !== 'texture') {
            return new vscode.MarkdownString(`\`${displayPath}\``);
        }
        return new vscode.MarkdownString(`Texture: \`${assetPath}\`\n\nFile: \`${displayPath}\`\n\n![Texture Preview](${vscode.Uri.file(fullPath).toString()}|width=100)`);
    }
    addWorkspaceDefinitionSuggestions(document, position, yamlPath, items) {
        const namespace = this.readNamespace(document);
        if (!namespace || !this.options.assetIndex) {
            return;
        }
        const seenLabels = new Set();
        for (const kind of (0, definitionReferences_1.definitionKindsForPath)(yamlPath)) {
            for (const definition of this.options.assetIndex.listDefinitions(kind)) {
                const label = definition.namespace === namespace ? definition.id : `${definition.namespace}:${definition.id}`;
                if (seenLabels.has(label)) {
                    continue;
                }
                seenLabels.add(label);
                const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Reference);
                item.detail = `ItemsAdder ${kind.replace('_', ' ')}`;
                item.insertText = this.withArrayPrefix(document, position, label);
                item.documentation = new vscode.MarkdownString(`\`${(0, pathDisplay_1.displayWorkspacePath)(definition.fullPath)}\``);
                items.push(item);
            }
        }
    }
    withArrayPrefix(document, position, insertText) {
        const currentLine = document.lineAt(position.line).text.trim();
        const previousLine = position.line > 0 ? document.lineAt(position.line - 1).text.trim() : '';
        if (!currentLine.includes('-') && previousLine.startsWith('-')) {
            return `- ${insertText}`;
        }
        return insertText;
    }
    isTexturePath(yamlPath) {
        const target = yamlPath[yamlPath.length - 1];
        return yamlPath[0] === 'items' &&
            (((yamlPath[2] === 'resource' || yamlPath[2] === 'graphics') &&
                (target === 'texture' || target === 'textures' || target === 'icon')) ||
                (yamlPath[2] === 'elytra' &&
                    (target === 'wings_texture' || target === 'broken_item_texture')));
    }
    isModelPath(yamlPath) {
        return yamlPath[0] === 'items' && yamlPath[2] === 'resource' && yamlPath[yamlPath.length - 1] === 'model_path';
    }
    getEnableCustomReferenceAutocomplete() {
        return this.options.getEnableCustomReferenceAutocomplete?.() ?? true;
    }
    readNamespace(document) {
        const infoNamespace = document.getText().match(/^\s*namespace:\s*["']?([^"'\s]+)["']?/m)?.[1];
        if (infoNamespace) {
            return infoNamespace;
        }
        const pathParts = document.uri.fsPath.replace(/\\/g, '/').split('/');
        const contentsIndex = pathParts.lastIndexOf('contents');
        return contentsIndex >= 0 ? pathParts[contentsIndex + 1] : undefined;
    }
    toDisplayName(entryId) {
        return entryId.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    }
}
exports.ItemsAdderCompletionProvider = ItemsAdderCompletionProvider;
//# sourceMappingURL=itemsAdderCompletionProvider.js.map