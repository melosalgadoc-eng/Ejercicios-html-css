"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const fs = require("fs");
const https = require("https");
const vscode = require("vscode");
const definitionReferenceHoverProvider_1 = require("./itemsadder/definitionReferenceHoverProvider");
const editorDecorationController_1 = require("./itemsadder/editorDecorationController");
const itemsAdderDictionaryIndex_1 = require("./itemsadder/itemsAdderDictionaryIndex");
const itemsAdderCompletionProvider_1 = require("./itemsadder/itemsAdderCompletionProvider");
const itemsAdderSoundPlayer_1 = require("./itemsadder/itemsAdderSoundPlayer");
const javaScriptSupportConfigurator_1 = require("./itemsadder/javaScriptSupportConfigurator");
const projectAssetIndex_1 = require("./itemsadder/projectAssetIndex");
const schemaHoverProvider_1 = require("./itemsadder/schemaHoverProvider");
const scriptPathHoverProvider_1 = require("./itemsadder/scriptPathHoverProvider");
const vanillaMinecraftAssets_1 = require("./itemsadder/vanillaMinecraftAssets");
const itemsAdderPluginConfig_1 = require("./itemsAdderPluginConfig");
const jspp_1 = require("./jspp");
const schemas_1 = require("./schemas");
const vscodeSuggestions_1 = require("./vscodeSuggestions");
const DEBUG = false;
const SCHEME = 'itemsadder';
const RESOURCE_SCHEMA_URI = `${SCHEME}://schema/itemsadder-resource`;
const PLUGIN_CONFIG_SCHEMA_URI = `${SCHEME}://schema/itemsadder-plugin-config`;
const JSON_SCHEMA = JSON.stringify(stripSchemaHoverMetadata(schemas_1.schemas));
const MODERN_PLUGIN_CONFIG_SCHEMA_URI = `${SCHEME}://schema/itemsadder-plugin-config-modern`;
const ITEMSADDER_PLUGIN_CONFIG_MODERN_SCHEMA = JSON.stringify(stripSchemaHoverMetadata(itemsAdderPluginConfig_1.itemsAdderPluginConfigModernSchema));
const ITEMSADDER_PLUGIN_CONFIG_SCHEMA = JSON.stringify(stripSchemaHoverMetadata(itemsAdderPluginConfig_1.itemsAdderPluginConfigSchema));
const DOWNLOAD_VANILLA_TEXTURES_LIST = false;
const ITEMSADDER_CONTEXT_KEY = 'ia-vscode.itemsAdderResourceConfig';
let activeEditor;
let timeout;
let lastAutoSuggestKey;
let decorationController;
let javaScriptSupportConfigurator;
let itemsAdderStatusBarItem;
const config = vscode.workspace.getConfiguration('ia-vscode');
let neverWarnAboutCopilot = config.get('neverWarnAboutCopilot');
let originalWordBasedSuggestionsEnabled = null;
let originalCopilotEnabled = undefined;
let vanillaTexturePaths = [];
function getExtensionSettings() {
    const currentConfig = vscode.workspace.getConfiguration('ia-vscode');
    return {
        enableDecorations: currentConfig.get('enableDecorations', true),
        enableDiagnostics: currentConfig.get('enableDiagnostics', true),
        enableIndexing: currentConfig.get('enableIndexing', true),
        enableCustomReferenceAutocomplete: currentConfig.get('enableCustomReferenceAutocomplete', true),
        enableImplicitNamespaceHints: currentConfig.get('enableImplicitNamespaceHints', true),
        enableTextPreviews: currentConfig.get('enableTextPreviews', true),
        enableHoverProviders: currentConfig.get('enableHoverProviders', true),
        enableSoundTools: currentConfig.get('enableSoundTools', true),
        enableAutoSuggestionsOnEmptyLine: currentConfig.get('enableAutoSuggestionsOnEmptyLine', true),
        enableStatusBar: currentConfig.get('enableStatusBar', true)
    };
}
function stripSchemaHoverMetadata(schema) {
    const cloned = JSON.parse(JSON.stringify(schema));
    stripSchemaNodeHoverMetadata(cloned);
    return cloned;
}
function stripSchemaNodeHoverMetadata(node) {
    if (!node || typeof node !== 'object') {
        return;
    }
    if (Array.isArray(node)) {
        node.forEach(stripSchemaNodeHoverMetadata);
        return;
    }
    delete node.markdownDescription;
    delete node.description;
    delete node.title;
    delete node.deprecationMessage;
    delete node.markdownDeprecationMessage;
    delete node.deprecated;
    for (const value of Object.values(node)) {
        stripSchemaNodeHoverMetadata(value);
    }
}
async function activate(context) {
    activeEditor = vscode.window.activeTextEditor;
    originalWordBasedSuggestionsEnabled = getOriginalYamlWordSuggestions();
    originalCopilotEnabled = getCopilotYaml();
    (0, jspp_1.registerJsppLanguageFeatures)(context);
    await registerYamlSchema();
    vanillaTexturePaths = await loadVanillaTexturePaths(context);
    const assetIndex = getExtensionSettings().enableIndexing
        ? new projectAssetIndex_1.ProjectAssetIndex(() => vscode.workspace.workspaceFolders, () => getExtensionSettings().enableIndexing)
        : undefined;
    if (assetIndex) {
        context.subscriptions.push(assetIndex);
        context.subscriptions.push(assetIndex.onDidRebuild(() => {
            if (activeEditor && isItemsAdderManagedConfig(activeEditor.document)) {
                triggerUpdateDecorations(true);
            }
        }));
    }
    const dictionaryIndex = new itemsAdderDictionaryIndex_1.ItemsAdderDictionaryIndex();
    context.subscriptions.push(dictionaryIndex);
    const soundPlayer = new itemsAdderSoundPlayer_1.ItemsAdderSoundPlayer();
    context.subscriptions.push(soundPlayer);
    javaScriptSupportConfigurator = new javaScriptSupportConfigurator_1.JavaScriptSupportConfigurator();
    const diagnostics = vscode.languages.createDiagnosticCollection('ia_diagnostics');
    context.subscriptions.push(diagnostics);
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.outdentWithoutAcceptingSuggestion', async () => {
        await vscode.commands.executeCommand('hideSuggestWidget');
        await vscode.commands.executeCommand('editor.action.outdentLines');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.openTranslationSource', async (sourcePath) => {
        if (!sourcePath) {
            return;
        }
        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(sourcePath));
        await vscode.window.showTextDocument(document);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.openAssetSource', async (sourcePath) => {
        if (!sourcePath) {
            return;
        }
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(sourcePath));
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.openUrlInVscode', async (url) => {
        if (!url) {
            return;
        }
        try {
            await vscode.commands.executeCommand('workbench.action.newGroupRight');
            await vscode.commands.executeCommand('simpleBrowser.show', url);
        }
        catch {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url));
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.configureJavaScriptSupport', async () => {
        await javaScriptSupportConfigurator?.configureWorkspace();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.cleanJavaLanguageServerWorkspace', async () => {
        try {
            await vscode.commands.executeCommand('java.clean.workspace');
        }
        catch {
            void vscode.window.showWarningMessage('Java extension command not available. Install or activate Extension Pack for Java.');
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.showItemsAdderMenu', async () => {
        const action = await vscode.window.showQuickPick([
            {
                label: '$(settings-gear) Configure Java Script Support',
                description: 'Setup Paper API and ItemsAdder API autocomplete'
            },
            {
                label: '$(trash) Clean Java Language Server Workspace',
                description: 'Clear Java LS cache and reload project metadata'
            }
        ], { placeHolder: 'ItemsAdder' });
        if (action?.label.includes('Configure Java Script Support')) {
            await vscode.commands.executeCommand('ia-vscode.configureJavaScriptSupport');
        }
        else if (action?.label.includes('Clean Java Language Server Workspace')) {
            await vscode.commands.executeCommand('ia-vscode.cleanJavaLanguageServerWorkspace');
        }
    }));
    if (getExtensionSettings().enableStatusBar) {
        itemsAdderStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        itemsAdderStatusBarItem.text = '$(symbol-misc) ItemsAdder';
        itemsAdderStatusBarItem.tooltip = 'ItemsAdder tools';
        itemsAdderStatusBarItem.command = 'ia-vscode.showItemsAdderMenu';
        itemsAdderStatusBarItem.show();
        context.subscriptions.push(itemsAdderStatusBarItem);
    }
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.playSound', (soundPath, label) => {
        soundPlayer.play(soundPath, label);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ia-vscode.stopSound', () => {
        soundPlayer.stop();
    }));
    const completionProvider = new itemsAdderCompletionProvider_1.ItemsAdderCompletionProvider({
        schemas: schemas_1.schemas,
        pluginConfigSchema: itemsAdderPluginConfig_1.itemsAdderPluginConfigSchema,
        itemTemplates: vscodeSuggestions_1.items,
        vanillaTexturePaths,
        assetIndex,
        getDevMode: () => Boolean(vscode.workspace.getConfiguration('ia-vscode').get('devMode')),
        getEnableCustomReferenceAutocomplete: () => {
            const settings = getExtensionSettings();
            return settings.enableIndexing && settings.enableCustomReferenceAutocomplete;
        }
    });
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'yaml' }, completionProvider));
    if (getExtensionSettings().enableHoverProviders) {
        context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'yaml' }, new schemaHoverProvider_1.SchemaHoverProvider({ schemas: schemas_1.schemas, pluginConfigSchema: itemsAdderPluginConfig_1.itemsAdderPluginConfigSchema })));
        context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'yaml' }, new scriptPathHoverProvider_1.ScriptPathHoverProvider()));
        if (assetIndex) {
            context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'yaml' }, new definitionReferenceHoverProvider_1.DefinitionReferenceHoverProvider({ assetIndex })));
        }
    }
    if (getExtensionSettings().enableSoundTools) {
        context.subscriptions.push(vscode.languages.registerCodeLensProvider({ language: 'yaml' }, new itemsAdderSoundPlayer_1.ItemsAdderSoundCodeLensProvider({ assetIndex, vanillaTexturePaths })));
        context.subscriptions.push(vscode.languages.registerHoverProvider({ language: 'yaml' }, new itemsAdderSoundPlayer_1.ItemsAdderSoundHoverProvider({ assetIndex, vanillaTexturePaths })));
    }
    decorationController = new editorDecorationController_1.EditorDecorationController({
        context,
        schemas: schemas_1.schemas,
        vanillaTexturePaths,
        diagnostics,
        assetIndex,
        dictionaryIndex,
        getSettings: getExtensionSettings
    });
    context.subscriptions.push(decorationController);
    for (const document of vscode.workspace.textDocuments) {
        await handleDocumentRefresh(document);
    }
    if (activeEditor && isItemsAdderManagedConfig(activeEditor.document)) {
        triggerUpdateDecorations();
    }
    await updateItemsAdderContext(activeEditor);
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (DEBUG) {
            console.log('Document changed.');
        }
        if (activeEditor && event.document === activeEditor.document && isItemsAdderManagedConfig(event.document)) {
            triggerUpdateDecorations(true);
            if (isItemsAdderManagedConfig(event.document)) {
                maybeTriggerSuggestionsOnEmptyLine(activeEditor);
            }
        }
        if (activeEditor && event.document === activeEditor.document) {
            void updateItemsAdderContext(activeEditor);
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor === activeEditor) {
            maybeTriggerSuggestionsOnEmptyLine(event.textEditor);
            if (isItemsAdderResourceConfig(event.textEditor.document)) {
                decorationController?.updateTextPreviews(event.textEditor);
            }
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (DEBUG) {
            console.log('Document opened.');
        }
        await handleDocumentRefresh(document);
    }));
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
        if (document.languageId === 'yaml' || document.fileName.endsWith('.yml') || document.fileName.endsWith('.yaml')) {
            dictionaryIndex.scheduleRebuild();
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (!event.affectsConfiguration('ia-vscode')) {
            return;
        }
        if (getExtensionSettings().enableStatusBar) {
            itemsAdderStatusBarItem?.show();
        }
        else {
            itemsAdderStatusBarItem?.hide();
        }
        assetIndex?.rebuild();
        if (activeEditor && isItemsAdderManagedConfig(activeEditor.document)) {
            decorationController?.clear(activeEditor);
            triggerUpdateDecorations();
        }
    }));
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        activeEditor = editor;
        if (!editor) {
            decorationController?.clear();
            await updateItemsAdderContext(undefined);
            return;
        }
        await updateItemsAdderContext(editor);
        if (isItemsAdderManagedConfig(editor.document)) {
            await setWordBasedSuggestions(false);
            if (isItemsAdderResourceConfig(editor.document)) {
                await setCopilot(false);
            }
            maybeTriggerSuggestionsOnEmptyLine(editor);
            triggerUpdateDecorations();
            return;
        }
        decorationController?.clear(editor);
        await restoreOriginalSettings();
    }));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(async (document) => {
        if (isItemsAdderManagedConfig(document)) {
            await restoreOriginalSettings();
        }
    }));
}
exports.activate = activate;
async function updateItemsAdderContext(editor) {
    await vscode.commands.executeCommand('setContext', ITEMSADDER_CONTEXT_KEY, Boolean(editor && isItemsAdderResourceConfig(editor.document)));
}
function deactivate() {
    decorationController?.dispose();
    void restoreOriginalSettings();
}
exports.deactivate = deactivate;
async function registerYamlSchema() {
    const vscodeYaml = vscode.extensions.getExtension('redhat.vscode-yaml');
    if (!vscodeYaml) {
        return;
    }
    const yamlExtensionAPI = await vscodeYaml.activate();
    yamlExtensionAPI.registerContributor(SCHEME, (resource) => {
        if (!resource.endsWith('.yml') && !resource.endsWith('.yaml')) {
            return undefined;
        }
        const document = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === resource);
        if (document) {
            if ((0, itemsAdderPluginConfig_1.isItemsAdderPluginConfig)(document)) {
                return (0, itemsAdderPluginConfig_1.pluginConfigSchemaForText)(document.getText()) === itemsAdderPluginConfig_1.itemsAdderPluginConfigModernSchema
                    ? MODERN_PLUGIN_CONFIG_SCHEMA_URI : PLUGIN_CONFIG_SCHEMA_URI;
            }
            if (isItemsAdderResourceConfig(document)) {
                return RESOURCE_SCHEMA_URI;
            }
        }
        return undefined;
    }, (schemaUri) => {
        if (!schemaUri.startsWith(`${SCHEME}://`)) {
            return undefined;
        }
        if (schemaUri === MODERN_PLUGIN_CONFIG_SCHEMA_URI) {
            return Promise.resolve(ITEMSADDER_PLUGIN_CONFIG_MODERN_SCHEMA);
        }
        if (schemaUri === PLUGIN_CONFIG_SCHEMA_URI) {
            return Promise.resolve(ITEMSADDER_PLUGIN_CONFIG_SCHEMA);
        }
        if (schemaUri === RESOURCE_SCHEMA_URI) {
            return Promise.resolve(JSON_SCHEMA);
        }
        return undefined;
    }, 'ItemsAdder');
    console.log('Registered YAML schemas for ItemsAdder.');
}
async function loadVanillaTexturePaths(context) {
    const vanillaTexturesListJsonPath = context.asAbsolutePath('images/vanilla_textures.json').replace(/\\/g, '/');
    const loadedPaths = [];
    try {
        if (fs.existsSync(vanillaTexturesListJsonPath)) {
            const textures = JSON.parse(fs.readFileSync(vanillaTexturesListJsonPath).toString());
            for (const texture of textures) {
                if (texture.endsWith('.png')) {
                    loadedPaths.push(texture);
                }
            }
            console.log('Vanilla textures paths loaded from:', vanillaTexturesListJsonPath);
        }
        else if (!DOWNLOAD_VANILLA_TEXTURES_LIST) {
            vscode.window.showErrorMessage('Missing bundled vanilla texture list.');
        }
        if (DOWNLOAD_VANILLA_TEXTURES_LIST) {
            vscode.window.showInformationMessage(`Downloading vanilla ${vanillaMinecraftAssets_1.VANILLA_MINECRAFT_ASSETS_VERSION} textures list...`);
            const texturesRoots = await fetchJson(`${vanillaMinecraftAssets_1.VANILLA_TEXTURES_API_ROOT}/_list.json`);
            await fetchTexturesRecursively(vanillaMinecraftAssets_1.VANILLA_TEXTURES_API_ROOT, texturesRoots.directories, loadedPaths);
            fs.writeFileSync(vanillaTexturesListJsonPath, JSON.stringify(loadedPaths));
            vscode.window.showInformationMessage('Vanilla textures paths saved to:', vanillaTexturesListJsonPath);
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Texture list error: ${error}`);
    }
    return loadedPaths;
}
async function fetchTexturesRecursively(baseUrl, directories, output) {
    for (const directory of directories) {
        if (!['item', 'block', 'entity', 'gui'].includes(directory)) {
            continue;
        }
        const url = `${baseUrl}/${directory}/_list.json`;
        const textures = await fetchJson(url);
        for (const texture of textures.files ?? []) {
            let fullPath = texture.includes('/') ? texture : `${directory}/${texture}`;
            const previousDirectories = baseUrl.split('textures/')[1];
            fullPath = previousDirectories ? `${previousDirectories}/${fullPath}` : fullPath;
            if (fullPath.endsWith('.png')) {
                output.push(fullPath);
            }
        }
        if (textures.directories?.length) {
            await fetchTexturesRecursively(`${baseUrl}/${directory}`, textures.directories, output);
        }
    }
}
function triggerUpdateDecorations(throttle = false) {
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
    if (throttle) {
        timeout = setTimeout(updateDecorations, 500);
        return;
    }
    updateDecorations();
}
function updateDecorations() {
    if (!activeEditor || !isItemsAdderManagedConfig(activeEditor.document)) {
        return;
    }
    decorationController?.update(activeEditor);
}
function maybeTriggerSuggestionsOnEmptyLine(editor) {
    const position = editor.selection.active;
    if (!getExtensionSettings().enableAutoSuggestionsOnEmptyLine ||
        !isItemsAdderManagedConfig(editor.document) ||
        editor.document.lineAt(position.line).text.trim() !== '') {
        lastAutoSuggestKey = undefined;
        return;
    }
    const key = `${editor.document.uri.toString()}:${editor.document.version}:${position.line}`;
    if (lastAutoSuggestKey === key) {
        return;
    }
    lastAutoSuggestKey = key;
    setTimeout(() => {
        if (vscode.window.activeTextEditor === editor &&
            editor.document.lineAt(editor.selection.active.line).text.trim() === '') {
            void vscode.commands.executeCommand('editor.action.triggerSuggest');
        }
    }, 50);
}
async function handleDocumentRefresh(document) {
    await javaScriptSupportConfigurator?.maybePromptForJavaScript(document);
    if (!isItemsAdderManagedConfig(document)) {
        return;
    }
    await setWordBasedSuggestions(false);
    if (isItemsAdderResourceConfig(document)) {
        await setCopilot(false);
    }
}
function isItemsAdderResourceConfig(document) {
    if (document.fileName.endsWith('settings.json') && document.uri.scheme === 'file' && document.uri.path.includes('Code')) {
        return false;
    }
    const uri = decodeURI(document.uri.toString());
    if (uri.startsWith(`${SCHEME}://`)) {
        return true;
    }
    for (let index = 0; index < Math.min(document.lineCount, 10); index++) {
        const line = document.lineAt(index).text.trim();
        if (!line) {
            continue;
        }
        return line === 'info:' || line.startsWith('info:');
    }
    return false;
}
function isItemsAdderManagedConfig(document) {
    return isItemsAdderResourceConfig(document) || (0, itemsAdderPluginConfig_1.isItemsAdderPluginConfig)(document);
}
async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Download failed: ${response.statusCode}`));
                return;
            }
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (error) {
                    reject(new Error('JSON parse failed'));
                }
            });
        }).on('error', reject);
    });
}
async function setCopilot(val) {
    const workspaceConfig = vscode.workspace.getConfiguration();
    const inspect = workspaceConfig.inspect('github.copilot.enable');
    const current = inspect?.globalValue
        ?? inspect?.workspaceValue
        ?? inspect?.workspaceFolderValue
        ?? inspect?.defaultValue
        ?? {};
    await workspaceConfig.update('github.copilot.enable', { ...current, yaml: val }, vscode.ConfigurationTarget.Global);
    if (val || neverWarnAboutCopilot) {
        return;
    }
    const result = await vscode.window.showWarningMessage('GitHub Copilot temporarily disabled for ItemsAdder YAML.\nUse CTRL+SPACE to get ItemsAdder autocomplete suggestions.', 'OK', 'Never Show Again');
    if (result === 'Never Show Again') {
        await config.update('ia-vscode.neverWarnAboutCopilot', true, vscode.ConfigurationTarget.Global);
        neverWarnAboutCopilot = true;
    }
}
function getCopilotYaml() {
    const inspect = vscode.workspace.getConfiguration('github.copilot').inspect('enable');
    const current = inspect?.globalValue
        ?? inspect?.workspaceValue
        ?? inspect?.workspaceFolderValue
        ?? inspect?.defaultValue;
    return typeof current?.yaml === 'boolean' ? current.yaml : undefined;
}
function getOriginalYamlWordSuggestions() {
    const settings = vscode.workspace.getConfiguration('[yaml]');
    const wordBasedSuggestions = settings.inspect('editor.wordBasedSuggestions');
    return wordBasedSuggestions?.globalValue
        ?? wordBasedSuggestions?.workspaceValue
        ?? wordBasedSuggestions?.workspaceFolderValue
        ?? wordBasedSuggestions?.defaultValue;
}
async function setWordBasedSuggestions(val) {
    const workspaceConfig = vscode.workspace.getConfiguration();
    const yamlSettings = workspaceConfig.get('[yaml]') ?? {};
    if (!val) {
        yamlSettings['editor.wordBasedSuggestions'] = 'off';
    }
    else if (originalWordBasedSuggestionsEnabled !== null) {
        yamlSettings['editor.wordBasedSuggestions'] = originalWordBasedSuggestionsEnabled;
    }
    else {
        delete yamlSettings['editor.wordBasedSuggestions'];
    }
    await workspaceConfig.update('[yaml]', yamlSettings, vscode.ConfigurationTarget.Global);
}
async function restoreOriginalSettings() {
    const workspaceConfig = vscode.workspace.getConfiguration();
    const yamlSettings = workspaceConfig.get('[yaml]') ?? {};
    if (originalWordBasedSuggestionsEnabled !== null) {
        yamlSettings['editor.wordBasedSuggestions'] = originalWordBasedSuggestionsEnabled;
    }
    else {
        delete yamlSettings['editor.wordBasedSuggestions'];
    }
    await workspaceConfig.update('[yaml]', yamlSettings, vscode.ConfigurationTarget.Global);
    const inspect = workspaceConfig.inspect('github.copilot.enable');
    if (inspect) {
        if (originalCopilotEnabled !== undefined && originalCopilotEnabled !== null) {
            await workspaceConfig.update('github.copilot.enable', { ...inspect.globalValue, yaml: originalCopilotEnabled }, vscode.ConfigurationTarget.Global);
        }
        else {
            const updatedValue = { ...inspect.globalValue };
            delete updatedValue.yaml;
            if (JSON.stringify(updatedValue) === JSON.stringify(inspect.defaultValue)) {
                await workspaceConfig.update('github.copilot.enable', undefined, vscode.ConfigurationTarget.Global);
            }
            else {
                await workspaceConfig.update('github.copilot.enable', updatedValue, vscode.ConfigurationTarget.Global);
            }
        }
    }
    console.log('Restored original settings for YAML.');
}
//# sourceMappingURL=extension.js.map