"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vanillaTextureUrl = exports.VANILLA_TEXTURES_API_ROOT = exports.VANILLA_MINECRAFT_ASSETS_VERSION = void 0;
exports.VANILLA_MINECRAFT_ASSETS_VERSION = '1.21.4';
exports.VANILLA_TEXTURES_API_ROOT = `https://assets.mcasset.cloud/${exports.VANILLA_MINECRAFT_ASSETS_VERSION}/assets/minecraft/textures`;
function vanillaTextureUrl(texturePath) {
    return `${exports.VANILLA_TEXTURES_API_ROOT}/${texturePath}`;
}
exports.vanillaTextureUrl = vanillaTextureUrl;
//# sourceMappingURL=vanillaMinecraftAssets.js.map