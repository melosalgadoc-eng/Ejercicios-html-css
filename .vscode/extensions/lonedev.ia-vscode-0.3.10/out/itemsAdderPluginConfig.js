"use strict";
/* eslint-disable @typescript-eslint/no-var-requires */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isItemsAdderPluginConfigText = exports.isItemsAdderPluginConfig = exports.pluginConfigSchemaForText = exports.isModernItemsAdderPluginConfig = exports.itemsAdderPluginConfigModernSchema = exports.itemsAdderPluginConfigSchema = void 0;
const YAML = require("yaml");
exports.itemsAdderPluginConfigSchema = require('./itemsAdderPluginConfigSchema.json');
exports.itemsAdderPluginConfigModernSchema = require('./itemsAdderPluginConfigModernSchema.json');
function isModernItemsAdderPluginConfig(doc) {
    const delivery = doc.getIn(['pack_delivery'], true);
    return YAML.isMap(delivery) && delivery.has('uuid');
}
exports.isModernItemsAdderPluginConfig = isModernItemsAdderPluginConfig;
function pluginConfigSchemaForText(text, legacySchema = exports.itemsAdderPluginConfigSchema) {
    return isModernItemsAdderPluginConfig(YAML.parseDocument(text)) ? exports.itemsAdderPluginConfigModernSchema : legacySchema;
}
exports.pluginConfigSchemaForText = pluginConfigSchemaForText;
function isItemsAdderPluginConfig(document) {
    if (!isYamlDocument(document)) {
        return false;
    }
    return isItemsAdderPluginConfigText(document.getText());
}
exports.isItemsAdderPluginConfig = isItemsAdderPluginConfig;
function isItemsAdderPluginConfigText(text) {
    const doc = YAML.parseDocument(text);
    const resourcePack = doc.getIn(['resource-pack'], true);
    if (isModernItemsAdderPluginConfig(doc)) {
        return true;
    }
    if (!YAML.isMap(resourcePack)) {
        return false;
    }
    return resourcePack.has('uuid');
}
exports.isItemsAdderPluginConfigText = isItemsAdderPluginConfigText;
function isYamlDocument(document) {
    return document.languageId === 'yaml' || document.fileName.endsWith('.yml') || document.fileName.endsWith('.yaml');
}
//# sourceMappingURL=itemsAdderPluginConfig.js.map