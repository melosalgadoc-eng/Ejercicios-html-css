"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayWorkspacePath = void 0;
function displayWorkspacePath(filePath, preferredKind) {
    if (!filePath) {
        return '';
    }
    const normalizedPath = filePath.replace(/\\/g, '/');
    const contentsIndex = normalizedPath.indexOf('/contents/');
    if (contentsIndex !== -1) {
        return normalizedPath.slice(contentsIndex + 1);
    }
    const directories = preferredKind
        ? [assetDirectory(preferredKind)]
        : ['textures', 'models', 'sounds', 'scripts', 'resourcepack', 'resource_pack'];
    for (const directory of directories) {
        const directoryIndex = normalizedPath.indexOf(`/${directory}/`);
        if (directoryIndex !== -1) {
            return normalizedPath.slice(directoryIndex + 1);
        }
    }
    return normalizedPath;
}
exports.displayWorkspacePath = displayWorkspacePath;
function assetDirectory(kind) {
    if (kind === 'texture') {
        return 'textures';
    }
    return kind === 'model' ? 'models' : 'sounds';
}
//# sourceMappingURL=pathDisplay.js.map