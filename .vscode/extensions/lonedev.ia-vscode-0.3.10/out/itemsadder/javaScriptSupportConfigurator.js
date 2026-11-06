"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemsAdderJavaJdtCorePrefs = exports.itemsAdderJavaGradleProperties = exports.itemsAdderJavaSettingsGradleKts = exports.upsertItemsAdderGradleDependencies = exports.itemsAdderJavaBuildGradleKts = exports.JavaScriptSupportConfigurator = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const SKIPPED_DIRECTORY_NAMES = new Set([
    '.git',
    '.idea',
    '.vscode',
    'node_modules',
    'out',
    'dist',
    'build',
    'target',
    'resourcepack',
    'resource_pack'
]);
const ITEMSADDER_API_DEPENDENCY = 'beer.devs:itemsadder-api:4.0.18-beta-9';
const PAPER_API_DEPENDENCY = 'io.papermc.paper:paper-api:1.21.4-R0.1-SNAPSHOT';
const ITEMSADDER_DEPENDENCIES_START = '// <itemsadder-vscode-dependencies>';
const ITEMSADDER_DEPENDENCIES_END = '// </itemsadder-vscode-dependencies>';
class JavaScriptSupportConfigurator {
    constructor() {
        this.promptedForWorkspace = new Set();
    }
    async configureWorkspace() {
        const layout = this.discover();
        if (layout.sourcePaths.length === 0) {
            void vscode.window.showWarningMessage('No ItemsAdder Java script source folders found.');
            return layout;
        }
        await this.writeGradleBuildFiles(layout.sourcePaths);
        const configuration = vscode.workspace.getConfiguration();
        await configuration.update('java.project.sourcePaths', mergeStringList(removeItemsAdderSourcePaths(configuration.get('java.project.sourcePaths'), layout.sourcePaths), layout.sourcePaths), vscode.ConfigurationTarget.Workspace);
        void vscode.window.showInformationMessage(`ItemsAdder Java script support configured: ${layout.sourcePaths.length} Gradle project(s).`);
        await maybeReloadJavaProjects();
        return layout;
    }
    async maybePromptForJavaScript(document) {
        if (!this.isItemsAdderJavaScript(document)) {
            return;
        }
        if (!vscode.extensions.getExtension('redhat.java')) {
            const action = await vscode.window.showWarningMessage('Install the Java extension to get autocomplete and diagnostics for ItemsAdder Java scripts.', 'Search Java extension');
            if (action === 'Search Java extension') {
                await vscode.commands.executeCommand('workbench.extensions.search', '@id:redhat.java');
            }
            return;
        }
        const workspaceKey = vscode.workspace.workspaceFolders?.map(folder => folder.uri.fsPath).join('|') ?? document.uri.fsPath;
        if (this.promptedForWorkspace.has(workspaceKey) || this.hasConfiguredProject()) {
            return;
        }
        this.promptedForWorkspace.add(workspaceKey);
        const action = await vscode.window.showInformationMessage('Configure Java autocomplete for ItemsAdder scripts?', 'Configure');
        if (action === 'Configure') {
            await this.configureWorkspace();
        }
    }
    discover(workspaceFolders = vscode.workspace.workspaceFolders) {
        const roots = normalizeWorkspaceRoots(workspaceFolders);
        const sourcePaths = Array.from(new Set(roots.flatMap(root => findScriptSourcePaths(root)))).sort();
        return { sourcePaths };
    }
    isItemsAdderJavaScript(document) {
        if (document.uri.scheme !== 'file' || document.languageId !== 'java') {
            return false;
        }
        return /(?:^|\/)contents\/[^/]+\/.+\.java$/i.test(document.uri.fsPath.replace(/\\/g, '/'));
    }
    hasConfiguredProject() {
        const sourcePaths = vscode.workspace.getConfiguration().get('java.project.sourcePaths') ?? [];
        return sourcePaths.some(sourcePath => isItemsAdderSourcePath(sourcePath) && isFile(path.join(sourcePath, 'build.gradle.kts')));
    }
    async writeGradleBuildFiles(sourcePaths) {
        for (const sourcePath of sourcePaths) {
            const buildFilePath = path.join(sourcePath, 'build.gradle.kts');
            const currentBuildFile = isFile(buildFilePath) ? await fs.promises.readFile(buildFilePath, 'utf8') : undefined;
            await fs.promises.writeFile(buildFilePath, itemsAdderJavaBuildGradleKts(currentBuildFile), 'utf8');
            await fs.promises.writeFile(path.join(sourcePath, 'settings.gradle.kts'), itemsAdderJavaSettingsGradleKts(sourcePath), 'utf8');
            await fs.promises.writeFile(path.join(sourcePath, 'gradle.properties'), itemsAdderJavaGradleProperties(), 'utf8');
            await fs.promises.mkdir(path.join(sourcePath, '.settings'), { recursive: true });
            await fs.promises.writeFile(path.join(sourcePath, '.settings', 'org.eclipse.jdt.core.prefs'), itemsAdderJavaJdtCorePrefs(), 'utf8');
        }
    }
}
exports.JavaScriptSupportConfigurator = JavaScriptSupportConfigurator;
function itemsAdderJavaBuildGradleKts(existingBuildFile) {
    if (existingBuildFile) {
        return upsertItemsAdderGradleDependencies(existingBuildFile);
    }
    return `plugins {
    java
}

sourceSets {
    main {
        java {
            setSrcDirs(listOf("."))
        }
    }
}

dependencies {
${itemsAdderGradleDependenciesBlock('    ')}
}
`;
}
exports.itemsAdderJavaBuildGradleKts = itemsAdderJavaBuildGradleKts;
function upsertItemsAdderGradleDependencies(buildFile) {
    const block = itemsAdderGradleDependenciesBlock('    ');
    const markerPattern = new RegExp(`${escapeRegex(ITEMSADDER_DEPENDENCIES_START)}[\\s\\S]*?${escapeRegex(ITEMSADDER_DEPENDENCIES_END)}`, 'm');
    if (markerPattern.test(buildFile)) {
        return ensureTrailingNewline(buildFile.replace(markerPattern, block));
    }
    const dependenciesMatch = /dependencies\s*\{/.exec(buildFile);
    if (dependenciesMatch) {
        const insertPosition = dependenciesMatch.index + dependenciesMatch[0].length;
        return ensureTrailingNewline(`${buildFile.slice(0, insertPosition)}\n${block}${buildFile.slice(insertPosition)}`);
    }
    return ensureTrailingNewline(`${buildFile.trimEnd()}\n\ndependencies {\n${block}\n}`);
}
exports.upsertItemsAdderGradleDependencies = upsertItemsAdderGradleDependencies;
function itemsAdderGradleDependenciesBlock(indent) {
    return [
        `${indent}${ITEMSADDER_DEPENDENCIES_START}`,
        `${indent}compileOnly("${ITEMSADDER_API_DEPENDENCY}")`,
        `${indent}compileOnly("${PAPER_API_DEPENDENCY}")`,
        `${indent}${ITEMSADDER_DEPENDENCIES_END}`
    ].join('\n');
}
function itemsAdderJavaSettingsGradleKts(sourcePath) {
    return `pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
        maven("https://repo.papermc.io/repository/maven-public/")
        maven("https://hub.spigotmc.org/nexus/content/repositories/snapshots/")
        maven("https://maven.devs.beer/")
    }
}

rootProject.name = "${gradleProjectName(sourcePath)}"
`;
}
exports.itemsAdderJavaSettingsGradleKts = itemsAdderJavaSettingsGradleKts;
function itemsAdderJavaGradleProperties() {
    return `org.gradle.caching=false
org.gradle.configuration-cache=false
org.gradle.parallel=false
`;
}
exports.itemsAdderJavaGradleProperties = itemsAdderJavaGradleProperties;
function itemsAdderJavaJdtCorePrefs() {
    return `eclipse.preferences.version=1
org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures=disabled
org.eclipse.jdt.core.compiler.release=enabled
org.eclipse.jdt.core.compiler.codegen.targetPlatform=21
org.eclipse.jdt.core.compiler.compliance=21
org.eclipse.jdt.core.compiler.source=21
org.eclipse.jdt.core.builder.resourceCopyExclusionFilter=*.java,*.gradle,*.gradle.kts
`;
}
exports.itemsAdderJavaJdtCorePrefs = itemsAdderJavaJdtCorePrefs;
function normalizeWorkspaceRoots(workspaceFolders) {
    if (!workspaceFolders) {
        return [];
    }
    return workspaceFolders.map(folder => typeof folder === 'string' ? folder : folder.uri.fsPath);
}
function gradleProjectName(sourcePath) {
    return `itemsadder-${path.basename(sourcePath).replace(/[^A-Za-z0-9_-]/g, '-')}`;
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function ensureTrailingNewline(value) {
    return value.endsWith('\n') ? value : `${value}\n`;
}
function findScriptSourcePaths(root) {
    const result = new Set();
    const normalizedRoot = path.resolve(root);
    const namespaceRoot = namespaceRootFromPath(normalizedRoot);
    if (namespaceRoot && containsJavaFileRecursively(namespaceRoot)) {
        result.add(namespaceRoot);
    }
    const contentsRoot = path.basename(normalizedRoot) === 'contents'
        ? normalizedRoot
        : path.join(normalizedRoot, 'contents');
    if (isDirectory(contentsRoot)) {
        for (const namespace of fs.readdirSync(contentsRoot)) {
            const candidateNamespaceRoot = path.join(contentsRoot, namespace);
            if (containsJavaFileRecursively(candidateNamespaceRoot)) {
                result.add(candidateNamespaceRoot);
            }
        }
    }
    walkDirectories(normalizedRoot, 5, directory => {
        const discoveredNamespaceRoot = namespaceRootFromPath(directory);
        if (discoveredNamespaceRoot && containsJavaFile(directory)) {
            result.add(discoveredNamespaceRoot);
        }
    });
    return Array.from(result);
}
function namespaceRootFromPath(filePath) {
    const parts = path.resolve(filePath).split(path.sep);
    const contentsIndex = parts.lastIndexOf('contents');
    if (contentsIndex === -1 || !parts[contentsIndex + 1]) {
        return undefined;
    }
    return parts.slice(0, contentsIndex + 2).join(path.sep) || path.sep;
}
function walkDirectories(root, maxDepth, visit) {
    if (!isDirectory(root)) {
        return;
    }
    const stack = [{ directory: root, depth: 0 }];
    const visited = new Set();
    while (stack.length > 0) {
        const current = stack.pop();
        if (!current || visited.has(current.directory)) {
            continue;
        }
        visited.add(current.directory);
        visit(current.directory);
        if (current.depth >= maxDepth) {
            continue;
        }
        for (const entry of safeReadDirectory(current.directory)) {
            if (SKIPPED_DIRECTORY_NAMES.has(entry)) {
                continue;
            }
            const child = path.join(current.directory, entry);
            if (isDirectory(child)) {
                stack.push({ directory: child, depth: current.depth + 1 });
            }
        }
    }
}
function containsJavaFile(directory) {
    return safeReadDirectory(directory).some(fileName => {
        const filePath = path.join(directory, fileName);
        return isFile(filePath) && fileName.toLowerCase().endsWith('.java');
    });
}
function containsJavaFileRecursively(directory) {
    let found = false;
    walkDirectories(directory, 5, currentDirectory => {
        if (!found && containsJavaFile(currentDirectory)) {
            found = true;
        }
    });
    return found;
}
function safeReadDirectory(directory) {
    try {
        return fs.readdirSync(directory);
    }
    catch {
        return [];
    }
}
function isDirectory(filePath) {
    try {
        return fs.statSync(filePath).isDirectory();
    }
    catch {
        return false;
    }
}
function isFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    }
    catch {
        return false;
    }
}
function mergeStringList(existing, values) {
    return Array.from(new Set([...(existing ?? []), ...values])).sort();
}
function removeStringList(existing, values) {
    const resolvedValues = new Set(values.map(value => path.resolve(value)));
    return (existing ?? []).filter(value => !resolvedValues.has(path.resolve(value))).sort();
}
function removeItemsAdderSourcePaths(existing, scriptSourcePaths) {
    const exactRemoval = removeStringList(existing, scriptSourcePaths);
    return exactRemoval.filter(sourcePath => !isItemsAdderSourcePath(sourcePath));
}
function isItemsAdderSourcePath(sourcePath) {
    const normalized = path.resolve(sourcePath).replace(/\\/g, '/');
    return /\/contents\/[^/]+(?:\/scripts)?$/i.test(normalized);
}
async function maybeReloadJavaProjects() {
    try {
        await vscode.commands.executeCommand('java.projectConfiguration.update');
    }
    catch {
        // The command exists only when the Java extension is installed and active.
    }
    try {
        await vscode.commands.executeCommand('gradle.refresh');
    }
    catch {
        // The command exists only when the Gradle extension is installed and active.
    }
}
//# sourceMappingURL=javaScriptSupportConfigurator.js.map