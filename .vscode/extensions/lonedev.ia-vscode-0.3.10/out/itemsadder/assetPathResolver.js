"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetPathResolver = void 0;
const fs = require("fs");
const path = require("path");
const assetPathLayout_1 = require("./assetPathLayout");
const vanillaMinecraftAssets_1 = require("./vanillaMinecraftAssets");
class AssetPathResolver {
    constructor(options) {
        this.options = options;
    }
    isDocumentInWorkspace() {
        return this.options.workspaceFolders.some(folder => {
            const relative = path.relative(folder, this.options.documentPath);
            return !relative.startsWith('..') && !path.isAbsolute(relative);
        });
    }
    resolveTexture(texturePath) {
        const normalized = (0, assetPathLayout_1.normalizeNamespacedAssetPath)(texturePath, this.options.fileNamespace, '.png');
        if (!normalized) {
            return { found: false };
        }
        if (normalized.namespace === 'minecraft') {
            if (this.options.vanillaTexturePaths.includes(normalized.path)) {
                return {
                    found: true,
                    remoteUrl: (0, vanillaMinecraftAssets_1.vanillaTextureUrl)(normalized.path)
                };
            }
            return { found: false };
        }
        const indexedAsset = this.options.assetIndex?.find('texture', normalized.namespace, normalized.path);
        if (indexedAsset) {
            return { found: true, assetPath: indexedAsset.fullPath };
        }
        return this.findInWorkspace(this.textureCandidates(normalized.namespace, normalized.path));
    }
    resolveModel(modelPath) {
        const normalized = (0, assetPathLayout_1.normalizeNamespacedAssetPath)(modelPath, this.options.fileNamespace, '.json');
        if (!normalized) {
            return { found: false };
        }
        if (normalized.namespace === 'minecraft') {
            return { found: true, skipped: true };
        }
        const indexedAsset = this.options.assetIndex?.find('model', normalized.namespace, normalized.path);
        if (indexedAsset) {
            return { found: true, assetPath: indexedAsset.fullPath };
        }
        return this.findInWorkspace(this.modelCandidates(normalized.namespace, normalized.path));
    }
    resolveSound(soundPath) {
        const normalized = (0, assetPathLayout_1.normalizeNamespacedAssetPath)(soundPath, this.options.fileNamespace, '.ogg');
        if (!normalized) {
            return { found: false };
        }
        const indexedAsset = this.options.assetIndex?.find('sound', normalized.namespace, normalized.path);
        if (indexedAsset) {
            return { found: true, assetPath: indexedAsset.fullPath };
        }
        return this.findInWorkspace(this.soundCandidates(normalized.namespace, normalized.path));
    }
    findInWorkspace(candidates) {
        const assetPath = candidates.find(candidate => fs.existsSync(candidate));
        if (!assetPath) {
            return { found: false };
        }
        return { found: true, assetPath };
    }
    textureCandidates(textureNamespace, texturePath) {
        return this.searchRoots().flatMap(workspacePath => [
            path.join(workspacePath, this.options.fileNamespace, 'textures', texturePath),
            path.join(workspacePath, this.options.fileNamespace, 'assets', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, this.options.fileNamespace, 'resourcepack', 'assets', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, this.options.fileNamespace, 'resourcepack', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, this.options.fileNamespace, 'resource_pack', 'assets', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, this.options.fileNamespace, 'resource_pack', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, textureNamespace, 'textures', texturePath),
            path.join(workspacePath, textureNamespace, 'assets', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, textureNamespace, 'resourcepack', 'assets', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, textureNamespace, 'resourcepack', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, textureNamespace, 'resource_pack', 'assets', textureNamespace, 'textures', texturePath),
            path.join(workspacePath, textureNamespace, 'resource_pack', textureNamespace, 'textures', texturePath)
        ]);
    }
    modelCandidates(modelNamespace, modelPath) {
        return this.searchRoots().flatMap(workspacePath => [
            path.join(workspacePath, this.options.fileNamespace, 'models', modelPath),
            path.join(workspacePath, this.options.fileNamespace, 'assets', modelNamespace, 'models', modelPath),
            path.join(workspacePath, this.options.fileNamespace, 'resourcepack', 'assets', modelNamespace, 'models', modelPath),
            path.join(workspacePath, this.options.fileNamespace, 'resourcepack', modelNamespace, 'models', modelPath),
            path.join(workspacePath, this.options.fileNamespace, 'resource_pack', 'assets', modelNamespace, 'models', modelPath),
            path.join(workspacePath, this.options.fileNamespace, 'resource_pack', modelNamespace, 'models', modelPath),
            path.join(workspacePath, modelNamespace, 'models', modelPath),
            path.join(workspacePath, modelNamespace, 'assets', modelNamespace, 'models', modelPath),
            path.join(workspacePath, modelNamespace, 'resourcepack', 'assets', modelNamespace, 'models', modelPath),
            path.join(workspacePath, modelNamespace, 'resourcepack', modelNamespace, 'models', modelPath),
            path.join(workspacePath, modelNamespace, 'resource_pack', 'assets', modelNamespace, 'models', modelPath),
            path.join(workspacePath, modelNamespace, 'resource_pack', modelNamespace, 'models', modelPath)
        ]);
    }
    soundCandidates(soundNamespace, soundPath) {
        return this.searchRoots().flatMap(workspacePath => [
            path.join(workspacePath, this.options.fileNamespace, 'sounds', soundPath),
            path.join(workspacePath, this.options.fileNamespace, 'assets', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, this.options.fileNamespace, 'resourcepack', 'assets', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, this.options.fileNamespace, 'resourcepack', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, this.options.fileNamespace, 'resource_pack', 'assets', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, this.options.fileNamespace, 'resource_pack', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, soundNamespace, 'assets', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, soundNamespace, 'resourcepack', 'assets', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, soundNamespace, 'resourcepack', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, soundNamespace, 'resource_pack', 'assets', soundNamespace, 'sounds', soundPath),
            path.join(workspacePath, soundNamespace, 'resource_pack', soundNamespace, 'sounds', soundPath)
        ]);
    }
    searchRoots() {
        const documentPath = this.options.documentPath.replace(/\\/g, '/');
        const contentsIndex = documentPath.lastIndexOf('/contents/');
        if (contentsIndex === -1) {
            return this.options.workspaceFolders;
        }
        return [path.normalize(documentPath.slice(0, contentsIndex + '/contents'.length)), ...this.options.workspaceFolders];
    }
}
exports.AssetPathResolver = AssetPathResolver;
//# sourceMappingURL=assetPathResolver.js.map