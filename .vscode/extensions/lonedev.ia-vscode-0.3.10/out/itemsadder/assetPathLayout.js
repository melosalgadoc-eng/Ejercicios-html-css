"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetKindToExtension = exports.assetKindToDirectory = exports.normalizeNamespacedAssetPath = void 0;
function normalizeNamespacedAssetPath(assetPath, defaultNamespace, extension) {
    if (!assetPath) {
        return undefined;
    }
    let normalizedPath = assetPath.trim();
    if (!normalizedPath) {
        return undefined;
    }
    if (!normalizedPath.endsWith(extension)) {
        normalizedPath += extension;
    }
    const separatorIndex = normalizedPath.indexOf(':');
    if (separatorIndex === -1) {
        return { namespace: defaultNamespace, path: normalizedPath };
    }
    return {
        namespace: normalizedPath.slice(0, separatorIndex),
        path: normalizedPath.slice(separatorIndex + 1)
    };
}
exports.normalizeNamespacedAssetPath = normalizeNamespacedAssetPath;
function assetKindToDirectory(kind) {
    if (kind === 'texture') {
        return 'textures';
    }
    return kind === 'model' ? 'models' : 'sounds';
}
exports.assetKindToDirectory = assetKindToDirectory;
function assetKindToExtension(kind) {
    if (kind === 'texture') {
        return '.png';
    }
    return kind === 'model' ? '.json' : '.ogg';
}
exports.assetKindToExtension = assetKindToExtension;
//# sourceMappingURL=assetPathLayout.js.map