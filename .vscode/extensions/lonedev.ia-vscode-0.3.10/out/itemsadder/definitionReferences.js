"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitNamespacedReference = exports.definitionKindLabel = exports.normalizeDefinitionId = exports.allowsVanillaMaterial = exports.isDefinitionDeclarationPath = exports.definitionKindsForPath = void 0;
function definitionKindsForPath(path) {
    const last = path[path.length - 1];
    const parent = path[path.length - 2];
    if (last === 'script' || (last === 'path' && parent === 'script')) {
        return ['script'];
    }
    if (last === 'song' && path.includes('jukebox_disc')) {
        return ['sound'];
    }
    if (last === 'name' && path.includes('play_sound')) {
        return ['sound'];
    }
    if ((last === 'log' || last === 'leaves') && path[0] === 'trees') {
        return ['block'];
    }
    if (last === 'item' || last === 'icon' || last === 'items' || parent === 'ingredients') {
        return ['item', 'block'];
    }
    if (last === 'sound') {
        return ['sound'];
    }
    if (last === 'entity') {
        return ['entity'];
    }
    if (last === 'font_image' || last === 'font-image') {
        return ['font_image'];
    }
    return [];
}
exports.definitionKindsForPath = definitionKindsForPath;
function isDefinitionDeclarationPath(path) {
    return path.length === 2 && [
        'items',
        'blocks',
        'armors',
        'sounds',
        'font_images',
        'entities',
        'loots',
        'trees',
        'categories',
        'huds'
    ].includes(path[0]);
}
exports.isDefinitionDeclarationPath = isDefinitionDeclarationPath;
function allowsVanillaMaterial(kinds) {
    return kinds.includes('item') || kinds.includes('block');
}
exports.allowsVanillaMaterial = allowsVanillaMaterial;
function normalizeDefinitionId(kind, id) {
    return kind === 'script' ? id.replace(/\.(java|jspp)$/i, '') : id;
}
exports.normalizeDefinitionId = normalizeDefinitionId;
function definitionKindLabel(kinds) {
    return kinds.map(kind => kind.replace('_', ' ')).join(' or ');
}
exports.definitionKindLabel = definitionKindLabel;
function splitNamespacedReference(value, defaultNamespace) {
    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }
    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) {
        return { namespace: defaultNamespace, id: trimmed };
    }
    const namespace = trimmed.slice(0, separatorIndex);
    const id = trimmed.slice(separatorIndex + 1);
    return namespace && id ? { namespace, id } : undefined;
}
exports.splitNamespacedReference = splitNamespacedReference;
//# sourceMappingURL=definitionReferences.js.map