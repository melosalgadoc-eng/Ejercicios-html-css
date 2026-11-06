"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptPathResolver = void 0;
const fs = require("fs");
const path = require("path");
const SCRIPT_EXTENSIONS = {
    jspp: '.jspp',
    java: '.java'
};
class ScriptPathResolver {
    constructor(options) {
        this.options = options;
    }
    isDocumentInWorkspace() {
        return this.options.workspaceFolders.some(folder => {
            const relative = path.relative(folder, this.options.documentPath);
            return !relative.startsWith('..') && !path.isAbsolute(relative);
        });
    }
    resolve(scriptPath) {
        const relativePath = normalizeScriptPath(scriptPath);
        if (!relativePath) {
            return { found: false, candidates: [] };
        }
        const candidates = this.candidates(relativePath);
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return {
                    found: true,
                    scriptPath: candidate,
                    language: languageFromPath(candidate),
                    candidates
                };
            }
        }
        return { found: false, candidates };
    }
    candidates(relativePath) {
        const namespaceRoots = this.namespaceRoots();
        const paths = expandScriptExtensions(relativePath).flatMap(scriptPath => namespaceRoots.map(root => path.join(root, scriptPath)));
        return Array.from(new Set(paths));
    }
    namespaceRoots() {
        const roots = [
            namespaceRootFromDocument(this.options.documentPath, this.options.fileNamespace),
            ...this.options.workspaceFolders.flatMap(folder => {
                return path.basename(folder) === 'contents'
                    ? [path.join(folder, this.options.fileNamespace)]
                    : [path.join(folder, 'contents', this.options.fileNamespace)];
            })
        ].filter((root) => Boolean(root));
        return Array.from(new Set(roots));
    }
}
exports.ScriptPathResolver = ScriptPathResolver;
function normalizeScriptPath(scriptPath) {
    const value = scriptPath?.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    return value || undefined;
}
function expandScriptExtensions(scriptPath) {
    const extension = path.extname(scriptPath).toLowerCase();
    if (extension === SCRIPT_EXTENSIONS.jspp || extension === SCRIPT_EXTENSIONS.java) {
        return [scriptPath];
    }
    return [scriptPath + SCRIPT_EXTENSIONS.jspp, scriptPath + SCRIPT_EXTENSIONS.java];
}
function languageFromPath(scriptPath) {
    const extension = path.extname(scriptPath).toLowerCase();
    if (extension === SCRIPT_EXTENSIONS.jspp) {
        return 'jspp';
    }
    if (extension === SCRIPT_EXTENSIONS.java) {
        return 'java';
    }
    return undefined;
}
function namespaceRootFromDocument(documentPath, fileNamespace) {
    const normalized = documentPath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    const contentsIndex = parts.lastIndexOf('contents');
    if (contentsIndex !== -1 && parts[contentsIndex + 1] === fileNamespace) {
        return parts.slice(0, contentsIndex + 2).join('/') || path.sep;
    }
    const namespaceIndex = parts.lastIndexOf(fileNamespace);
    if (namespaceIndex !== -1) {
        return parts.slice(0, namespaceIndex + 1).join('/') || path.sep;
    }
    return undefined;
}
//# sourceMappingURL=scriptPathResolver.js.map