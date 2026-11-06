"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsAdderDiagnosticsProvider = void 0;
const YAML = require("yaml");
const definitionReferences_1 = require("./definitionReferences");
const itemsAdderPluginConfig_1 = require("../itemsAdderPluginConfig");
const HOSTING_PROVIDERS = [
    ['resource-pack', 'hosting', 'self-host'],
    ['resource-pack', 'hosting', 'simple_self_host'],
    ['resource-pack', 'hosting', 'external-host'],
    ['resource-pack', 'hosting', 'lobfile'],
    ['resource-pack', 'hosting', 'no-host'],
    ['resource-pack', 'hosting', 'auto-external-host']
];
const COOLDOWN_BOSSBAR_COLORS = new Set(['PINK', 'BLUE', 'RED', 'GREEN', 'YELLOW', 'PURPLE', 'WHITE']);
const COOLDOWN_BOSSBAR_STYLES = new Set(['SOLID', 'SEGMENTED_6', 'SEGMENTED_10', 'SEGMENTED_12', 'SEGMENTED_20']);
const PLAYER_STATS_SAVE_TYPES = new Set(['CUSTOM_NBT', 'PLAYER_DAT']);
const PLUGIN_CONFIG_MANUAL_SCHEMA_PATHS = new Set([
    'cooldown_bars.bossbar.color',
    'cooldown_bars.bossbar.style',
    'player_stats.save_type',
    'crops.rendering.max_shown_per_player',
    'crops.rendering.billboard.distance',
    'crops.rendering.tick_interval',
    'crops.rendering.radius_blocks',
    'crops.max_crops_in_area',
    'crops.area_limit_radius',
    'server.port',
    'resource-pack.hosting.self-host.pack-port',
    'resource-pack.hosting.self-host.protection.rate_limit.max_requests',
    'resource-pack.hosting.self-host.protection.rate_limit.period_seconds',
    'resource-pack.hosting.self-host.protection.rate_limit.cooldown.duration_minutes',
    'resource-pack.hosting.self-host.protection.rate_limit.cooldown.trigger_on_failed_times',
    'resource-pack.hosting.simple_self_host.optimization.max_downloads_per_ip',
    'resource-pack.hosting.simple_self_host.optimization.max_speed_in_megabyte_ps'
]);
class ItemsAdderDiagnosticsProvider {
    collect(doc, text, options) {
        const issues = [];
        const assetDecorations = [];
        if (this.isPluginConfig(doc)) {
            this.collectPluginConfigIssues(doc, issues);
            return { issues, assetDecorations };
        }
        const fileNamespace = this.getNamespace(doc);
        if (!fileNamespace) {
            return { issues, assetDecorations };
        }
        this.collectNamespaceIssues(doc, fileNamespace, issues, options);
        this.collectInfoIssues(doc, issues);
        const itemsNode = doc.get('items', true);
        if (itemsNode && YAML.isCollection(itemsNode)) {
            for (const pair of itemsNode.items) {
                if (!YAML.isPair(pair) || !YAML.isMap(pair.value)) {
                    continue;
                }
                this.collectItemIssues(pair.value, issues, assetDecorations, options);
            }
        }
        const entitiesNode = doc.get('entities', true);
        if (entitiesNode && YAML.isCollection(entitiesNode)) {
            for (const pair of entitiesNode.items) {
                if (!YAML.isPair(pair) || !YAML.isMap(pair.value)) {
                    continue;
                }
                this.collectScriptIssues(pair.value.get('script', true), issues, options);
            }
        }
        this.collectRecipeIssues(doc.get('recipes', true), issues);
        this.collectDefinitionReferenceIssues(doc.contents, [], this.getNamespace(doc), issues, options);
        this.collectFlowIssues(text, issues);
        return { issues, assetDecorations };
    }
    collectInfoIssues(doc, issues) {
        const infoNode = doc.get('info', true);
        if (!YAML.isMap(infoNode)) {
            return;
        }
        if (infoNode.has('dictionary-lang') && !doc.has('dictionary')) {
            this.pushNodeIssue(issues, infoNode.get('dictionary-lang', true), '`info.dictionary-lang` is used only with the top-level `dictionary` property.', 'warning');
        }
    }
    collectPluginConfigIssues(doc, issues) {
        this.collectPluginConfigSchemaIssues(doc.contents, (0, itemsAdderPluginConfig_1.isModernItemsAdderPluginConfig)(doc) ? itemsAdderPluginConfig_1.itemsAdderPluginConfigModernSchema : itemsAdderPluginConfig_1.itemsAdderPluginConfigSchema, [], issues);
        this.collectMutuallyExclusiveEnabledIssues(doc, HOSTING_PROVIDERS, 'Only one resource pack hosting method can be enabled at a time.', issues);
        this.collectMutuallyExclusiveEnabledIssues(doc, [
            ['blocks', 'convert-vanilla-blocks'],
            ['blocks', 'fix-glitched-blocks']
        ], 'Use either `blocks.convert-vanilla-blocks` or `blocks.fix-glitched-blocks`, not both.', issues);
        this.collectMutuallyExclusiveEnabledIssues(doc, [
            ['advanced', 'legacy_shader_armor_conversion', 'append_new_equipment_tag'],
            ['advanced', 'legacy_shader_armor_conversion', 'completely_convert_to_new_equipment_tag']
        ], 'Use either `append_new_equipment_tag` or `completely_convert_to_new_equipment_tag`, not both.', issues);
        this.collectMutuallyExclusiveBooleanIssues(doc, [
            ['resource-pack', 'zip', 'emotes', '1_21_5_to_1_21_9_shaders'],
            ['resource-pack', 'zip', 'emotes', '1_21_4_plus_modern_method']
        ], 'Only one emotes resource pack method is needed.', 'warning', issues);
        this.collectEnumIssue(doc, ['cooldown_bars', 'bossbar', 'color'], COOLDOWN_BOSSBAR_COLORS, 'Invalid cooldown bossbar color.', issues);
        this.collectEnumIssue(doc, ['cooldown_bars', 'bossbar', 'style'], COOLDOWN_BOSSBAR_STYLES, 'Invalid cooldown bossbar style.', issues);
        this.collectEnumIssue(doc, ['player_stats', 'save_type'], PLAYER_STATS_SAVE_TYPES, '`player_stats.save_type` must be `CUSTOM_NBT` or `PLAYER_DAT`.', issues);
        this.collectIntegerRangeIssue(doc, ['crops', 'rendering', 'max_shown_per_player'], 200, 1800, issues);
        this.collectIntegerRangeIssue(doc, ['crops', 'rendering', 'billboard', 'distance'], 0, 10, issues);
        this.collectIntegerRangeIssue(doc, ['crops', 'rendering', 'tick_interval'], 0, 10, issues);
        this.collectIntegerRangeIssue(doc, ['crops', 'rendering', 'radius_blocks'], 16, 64, issues);
        this.collectIntegerRangeIssue(doc, ['crops', 'max_crops_in_area'], 0, undefined, issues);
        this.collectIntegerRangeIssue(doc, ['crops', 'area_limit_radius'], 16, 64, issues);
        this.collectIntegerRangeIssue(doc, ['server', 'port'], 1, 65535, issues, true);
        this.collectIntegerRangeIssue(doc, ['resource-pack', 'hosting', 'self-host', 'pack-port'], 1, 65535, issues);
        this.collectIntegerRangeIssue(doc, ['resource-pack', 'hosting', 'self-host', 'protection', 'rate_limit', 'max_requests'], 1, undefined, issues);
        this.collectIntegerRangeIssue(doc, ['resource-pack', 'hosting', 'self-host', 'protection', 'rate_limit', 'period_seconds'], 1, undefined, issues);
        this.collectIntegerRangeIssue(doc, ['resource-pack', 'hosting', 'self-host', 'protection', 'rate_limit', 'cooldown', 'duration_minutes'], 0, undefined, issues);
        this.collectIntegerRangeIssue(doc, ['resource-pack', 'hosting', 'self-host', 'protection', 'rate_limit', 'cooldown', 'trigger_on_failed_times'], 1, undefined, issues);
        this.collectIntegerRangeIssue(doc, ['resource-pack', 'hosting', 'simple_self_host', 'optimization', 'max_downloads_per_ip'], 1, undefined, issues);
        this.collectIntegerRangeIssue(doc, ['resource-pack', 'hosting', 'simple_self_host', 'optimization', 'max_speed_in_megabyte_ps'], 1, undefined, issues);
        this.collectHostAddressIssue(doc, ['server', 'address'], issues);
        this.collectHostAddressIssue(doc, ['resource-pack', 'hosting', 'simple_self_host', 'server_address'], issues);
    }
    collectMutuallyExclusiveEnabledIssues(doc, paths, message, issues) {
        this.collectMutuallyExclusiveBooleanIssues(doc, paths.map(path => [...path, 'enabled']), message, 'error', issues);
    }
    collectMutuallyExclusiveBooleanIssues(doc, paths, message, severity, issues) {
        const enabled = paths
            .map(path => ({ path, node: doc.getIn(path, true) }))
            .filter(entry => this.isScalarValue(entry.node, true));
        if (enabled.length <= 1) {
            return;
        }
        for (const entry of enabled) {
            this.pushNodeIssue(issues, entry.node, message, severity);
        }
    }
    collectEnumIssue(doc, path, allowedValues, message, issues) {
        const node = doc.getIn(path, true);
        if (!YAML.isScalar(node) || typeof node.value !== 'string') {
            return;
        }
        if (!allowedValues.has(node.value.toUpperCase())) {
            this.pushNodeIssue(issues, node, `${message} Allowed values: ${[...allowedValues].join(', ')}.`, 'error');
        }
    }
    collectIntegerRangeIssue(doc, path, min, max, issues, allowAuto = false) {
        const node = doc.getIn(path, true);
        if (!YAML.isScalar(node)) {
            return;
        }
        if (allowAuto && node.value === 'auto') {
            return;
        }
        const value = typeof node.value === 'number' ? node.value : Number(node.value);
        if (!Number.isInteger(value)) {
            this.pushNodeIssue(issues, node, `\`${path.join('.')}\` must be an integer${allowAuto ? ' or `auto`' : ''}.`, 'error');
            return;
        }
        if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
            const range = min !== undefined && max !== undefined ? `${min}-${max}` : min !== undefined ? `>= ${min}` : `<= ${max}`;
            this.pushNodeIssue(issues, node, `\`${path.join('.')}\` should be ${range}.`, 'warning');
        }
    }
    collectHostAddressIssue(doc, path, issues) {
        const node = doc.getIn(path, true);
        if (!YAML.isScalar(node) || typeof node.value !== 'string' || node.value === 'auto') {
            return;
        }
        const value = node.value.trim();
        if (value !== node.value ||
            /^https?:\/\//i.test(value) ||
            value.includes('/') ||
            /\s/.test(value) ||
            !this.isValidHostAddress(value)) {
            this.pushNodeIssue(issues, node, `\`${path.join('.')}\` must be \`auto\`, \`host\` or \`host:port\` without protocol or path.`, 'error');
        }
    }
    isValidHostAddress(value) {
        const match = value.match(/^([a-z0-9.-]+)(?::([0-9]+))?$/i);
        if (!match) {
            return false;
        }
        if (!/[a-z0-9]/i.test(match[1])) {
            return false;
        }
        if (match[2] === undefined) {
            return true;
        }
        const port = Number(match[2]);
        return Number.isInteger(port) && port >= 1 && port <= 65535;
    }
    isPluginConfig(doc) {
        const resourcePackNode = doc.get('resource-pack', true);
        return (0, itemsAdderPluginConfig_1.isModernItemsAdderPluginConfig)(doc) || (YAML.isMap(resourcePackNode) && resourcePackNode.has('uuid'));
    }
    collectItemIssues(itemNode, issues, assetDecorations, options) {
        const resourceNode = itemNode.get('resource', true);
        const graphicsNode = itemNode.get('graphics', true);
        const hasGraphics = itemNode.has('graphics');
        const hasResource = itemNode.has('resource');
        if (hasGraphics && hasResource) {
            this.pushNodeIssue(issues, YAML.isMap(resourceNode) ? resourceNode : itemNode, 'Use either `resource` or `graphics` property, not both.', 'error');
        }
        if (resourceNode && YAML.isMap(resourceNode)) {
            this.collectResourceIssues(itemNode, resourceNode, issues, assetDecorations, options);
        }
        if (graphicsNode && YAML.isMap(graphicsNode)) {
            this.collectGraphicsIssues(graphicsNode, issues, assetDecorations, options);
        }
        this.collectItemModelIssues(itemNode.get('item_model', true), issues, assetDecorations, options);
    }
    collectResourceIssues(itemNode, resourceNode, issues, assetDecorations, options) {
        const hasTexture = resourceNode.has('texture');
        const hasTextures = resourceNode.has('textures');
        const hasModelPath = resourceNode.has('model_path');
        if (hasTexture && hasTextures) {
            this.pushNodeIssue(issues, resourceNode, 'Use either `texture` or `textures` property, not both.', 'error');
        }
        if (hasModelPath && (hasTexture || hasTextures)) {
            this.pushNodeIssue(issues, resourceNode, 'Do not use `texture` or `textures` property when `model_path` is specified.', 'error');
        }
        if (this.isScalarValue(resourceNode.get('generate', true), true) && hasModelPath) {
            this.pushNodeIssue(issues, resourceNode.get('model_path', true), 'Set `generate: false` to use `model_path`.', 'error');
        }
        if (this.isScalarValue(resourceNode.get('generate', true), true) && !hasTexture && !hasTextures) {
            this.pushNodeIssue(issues, resourceNode, '`generate: true` requires `texture` or `textures` property.', 'error');
        }
        const specificPropertiesNode = itemNode.get('specific_properties', true);
        const armorNode = YAML.isMap(specificPropertiesNode) ? specificPropertiesNode.get('armor', true) : undefined;
        if (!resourceNode.has('material') && !armorNode) {
            this.pushNodeIssue(issues, resourceNode, 'Missing `material` property!', 'error');
        }
        this.collectAssetIssues(resourceNode, issues, assetDecorations, options);
        this.collectScriptIssues(itemNode.get('script', true), issues, options);
    }
    collectGraphicsIssues(graphicsNode, issues, assetDecorations, options) {
        const sourceKeys = ['model', 'models', 'texture', 'textures'].filter(key => graphicsNode.has(key));
        if (sourceKeys.length > 1) {
            this.pushNodeIssue(issues, graphicsNode, 'Use exactly one graphics source: `model`, `models`, `texture`, or `textures`.', 'error');
        }
        if (graphicsNode.has('parent') && (graphicsNode.has('model') || graphicsNode.has('models'))) {
            this.pushNodeIssue(issues, graphicsNode.get('parent', true), '`graphics.parent` is allowed only with `graphics.texture` or `graphics.textures`.', 'error');
        }
        if (!options.assetResolver?.isDocumentInWorkspace()) {
            return;
        }
        const severity = options.isDocumentDirty ? 'warning' : 'error';
        this.checkModelNode(graphicsNode.get('model', true), issues, assetDecorations, severity, options.assetResolver);
        this.checkTextureNode(graphicsNode.get('texture', true), issues, assetDecorations, severity, options.assetResolver);
        this.checkTextureNode(graphicsNode.get('icon', true), issues, assetDecorations, severity, options.assetResolver);
        this.checkModelMap(graphicsNode.get('models', true), issues, assetDecorations, severity, options.assetResolver);
        this.checkTextureMap(graphicsNode.get('textures', true), issues, assetDecorations, severity, options.assetResolver);
    }
    collectItemModelIssues(itemModelNode, issues, assetDecorations, options) {
        if (!options.assetResolver?.isDocumentInWorkspace()) {
            return;
        }
        const severity = options.isDocumentDirty ? 'warning' : 'error';
        this.checkModelNode(itemModelNode, issues, assetDecorations, severity, options.assetResolver);
    }
    collectAssetIssues(resourceNode, issues, assetDecorations, options) {
        if (!options.assetResolver?.isDocumentInWorkspace()) {
            return;
        }
        const severity = options.isDocumentDirty ? 'warning' : 'error';
        this.checkTextureNode(resourceNode.get('texture', true), issues, assetDecorations, severity, options.assetResolver);
        this.checkTextureNode(resourceNode.get('icon', true), issues, assetDecorations, severity, options.assetResolver);
        const texturesNode = resourceNode.get('textures', true);
        if (texturesNode && YAML.isSeq(texturesNode)) {
            for (const item of texturesNode.items) {
                this.checkTextureNode(item, issues, assetDecorations, severity, options.assetResolver);
            }
        }
        this.checkModelNode(resourceNode.get('model_path', true), issues, assetDecorations, severity, options.assetResolver);
    }
    collectScriptIssues(scriptNode, issues, options) {
        if (!options.scriptResolver?.isDocumentInWorkspace() || !YAML.isMap(scriptNode)) {
            return;
        }
        if (this.isScalarValue(scriptNode.get('enabled', true), false)) {
            return;
        }
        const pathNode = scriptNode.get('path', true);
        const range = this.getNodeRange(pathNode);
        if (!range || !YAML.isScalar(pathNode) || typeof pathNode.value !== 'string') {
            return;
        }
        const resolution = options.scriptResolver.resolve(pathNode.value);
        if (!resolution.found) {
            issues.push({
                range,
                message: 'Script file not found. Expected a `.jspp` or `.java` file in this namespace.',
                severity: options.isDocumentDirty ? 'warning' : 'error'
            });
        }
    }
    collectRecipeIssues(recipesNode, issues) {
        if (!YAML.isMap(recipesNode)) {
            return;
        }
        const craftingTableNode = recipesNode.get('crafting_table', true);
        if (!YAML.isMap(craftingTableNode)) {
            return;
        }
        for (const item of craftingTableNode.items) {
            if (!YAML.isPair(item) || !YAML.isMap(item.value)) {
                continue;
            }
            this.collectCraftingRecipeIssues(item.value, issues);
        }
    }
    collectCraftingRecipeIssues(recipeNode, issues) {
        if (this.isScalarValue(recipeNode.get('shapeless', true), true)) {
            for (const item of recipeNode.items) {
                if (!YAML.isPair(item) || !YAML.isScalar(item.key) || typeof item.key.value !== 'string') {
                    continue;
                }
                if (!/^pattern(?:$|_)/.test(item.key.value)) {
                    continue;
                }
                this.pushNodeIssue(issues, item.key, '`shapeless: true` recipes cannot use `pattern` properties.', 'error');
            }
            return;
        }
        this.collectCraftingRecipeIngredientSymbolIssues(recipeNode, issues);
    }
    collectCraftingRecipeIngredientSymbolIssues(recipeNode, issues) {
        const ingredientKeys = this.craftingRecipeIngredientKeys(recipeNode.get('ingredients', true));
        if (ingredientKeys.size === 0) {
            return;
        }
        const patternSymbols = new Set();
        const reportedMissingIngredients = new Set();
        for (const item of recipeNode.items) {
            if (!YAML.isPair(item) || !YAML.isScalar(item.key) || typeof item.key.value !== 'string') {
                continue;
            }
            if (!/^pattern(?:$|_)/.test(item.key.value)) {
                continue;
            }
            for (const patternEntry of this.craftingRecipePatternEntries(item.value)) {
                for (const symbol of patternEntry.value) {
                    if (symbol === 'X' || symbol === ' ') {
                        continue;
                    }
                    patternSymbols.add(symbol);
                    if (!ingredientKeys.has(symbol) && !reportedMissingIngredients.has(symbol)) {
                        reportedMissingIngredients.add(symbol);
                        issues.push({
                            range: patternEntry.range,
                            message: `Pattern symbol \`${symbol}\` does not have a matching ingredient.`,
                            severity: 'error'
                        });
                    }
                }
            }
        }
        for (const [symbol, range] of ingredientKeys) {
            if (!patternSymbols.has(symbol)) {
                issues.push({
                    range,
                    message: `Ingredient symbol \`${symbol}\` does not appear in any pattern.`,
                    severity: 'error'
                });
            }
        }
    }
    craftingRecipeIngredientKeys(ingredientsNode) {
        const keys = new Map();
        if (!YAML.isMap(ingredientsNode)) {
            return keys;
        }
        for (const item of ingredientsNode.items) {
            if (!YAML.isPair(item) || !YAML.isScalar(item.key) || typeof item.key.value !== 'string') {
                continue;
            }
            const range = this.getNodeRange(item.key);
            if (range) {
                keys.set(item.key.value, range);
            }
        }
        return keys;
    }
    craftingRecipePatternEntries(node) {
        if (YAML.isSeq(node)) {
            return node.items.flatMap(item => {
                const range = this.getNodeRange(item);
                return YAML.isScalar(item) && typeof item.value === 'string' && range ? [{ value: item.value, range }] : [];
            });
        }
        const range = this.getNodeRange(node);
        return YAML.isScalar(node) && typeof node.value === 'string' && range ? [{ value: node.value, range }] : [];
    }
    checkTextureNode(node, issues, assetDecorations, severity, assetResolver) {
        const range = this.getNodeRange(node);
        if (!range || !YAML.isScalar(node) || typeof node.value !== 'string') {
            return;
        }
        const resolution = assetResolver.resolveTexture(node.value);
        if (!resolution.found) {
            issues.push({ range, message: 'Texture not found!', severity });
        }
        assetDecorations.push({ range, resolution, missing: !resolution.found });
    }
    checkModelNode(node, issues, assetDecorations, severity, assetResolver) {
        const range = this.getNodeRange(node);
        if (!range || !YAML.isScalar(node) || typeof node.value !== 'string') {
            return;
        }
        const resolution = assetResolver.resolveModel(node.value);
        if (resolution.skipped) {
            return;
        }
        if (!resolution.found) {
            issues.push({ range, message: 'Model not found!', severity });
        }
        assetDecorations.push({ range, resolution, missing: !resolution.found });
    }
    checkTextureMap(node, issues, assetDecorations, severity, assetResolver) {
        this.checkAssetMap(node, issues, assetDecorations, severity, assetResolver, 'texture');
    }
    checkModelMap(node, issues, assetDecorations, severity, assetResolver) {
        this.checkAssetMap(node, issues, assetDecorations, severity, assetResolver, 'model');
    }
    checkAssetMap(node, issues, assetDecorations, severity, assetResolver, assetType) {
        if (!YAML.isMap(node)) {
            return;
        }
        for (const item of node.items) {
            if (!YAML.isPair(item)) {
                continue;
            }
            const keyRange = this.getNodeRange(item.key);
            const key = YAML.isScalar(item.key) && typeof item.key.value === 'string' ? item.key.value : undefined;
            if (key && !this.isValidAssetKey(key) && keyRange) {
                issues.push({
                    range: keyRange,
                    message: `Invalid ${assetType} key \`${key}\`.`,
                    severity: 'error'
                });
            }
            if (assetType === 'texture') {
                this.checkTextureNode(item.value, issues, assetDecorations, severity, assetResolver);
            }
            else {
                this.checkModelNode(item.value, issues, assetDecorations, severity, assetResolver);
            }
        }
    }
    collectFlowIssues(text, issues) {
        const lines = text.split('\n');
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            if (!/(.*)flow:/.test(line)) {
                continue;
            }
            let count = 0;
            for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex++) {
                const nextLine = lines[nextIndex];
                if (/(.*)(skip|stop)_if(.*)(_success|_fail):/.test(nextLine)) {
                    count++;
                    continue;
                }
                if (count > 0) {
                    break;
                }
            }
            if (count > 1) {
                const start = this.lineOffset(lines, index) + Math.max(0, line.search(/\S/));
                issues.push({
                    range: { start, end: this.lineOffset(lines, index) + line.length },
                    message: 'Multiple `stop_` `skip_` flow attributes found in action.\nUse only one action.',
                    severity: 'error'
                });
            }
        }
    }
    collectDefinitionReferenceIssues(node, path, fileNamespace, issues, options) {
        if (!fileNamespace || !options.definitionIndex) {
            return;
        }
        if (YAML.isMap(node)) {
            for (const pair of node.items) {
                if (!YAML.isPair(pair)) {
                    continue;
                }
                const key = YAML.isScalar(pair.key) && typeof pair.key.value === 'string' ? pair.key.value : undefined;
                this.collectDefinitionReferenceIssues(pair.value, key ? [...path, key] : path, fileNamespace, issues, options);
            }
            return;
        }
        if (YAML.isSeq(node)) {
            for (const item of node.items) {
                this.collectDefinitionReferenceIssues(item, path, fileNamespace, issues, options);
            }
            return;
        }
        if (!YAML.isScalar(node) || typeof node.value !== 'string') {
            return;
        }
        const kinds = (0, definitionReferences_1.definitionKindsForPath)(path);
        if (!kinds.length || (0, definitionReferences_1.isDefinitionDeclarationPath)(path)) {
            return;
        }
        const rawValue = node.value.trim();
        if (!rawValue || rawValue.startsWith('<') || ((0, definitionReferences_1.allowsVanillaMaterial)(kinds) && /^[A-Z0-9_]+$/.test(rawValue))) {
            return;
        }
        const reference = (0, definitionReferences_1.splitNamespacedReference)(rawValue, fileNamespace);
        if (!reference || reference.namespace === 'minecraft') {
            return;
        }
        const found = kinds.some(kind => options.definitionIndex?.findDefinition(kind, reference.namespace, (0, definitionReferences_1.normalizeDefinitionId)(kind, reference.id)));
        if (!found) {
            this.pushNodeIssue(issues, node, `Unknown ItemsAdder ${(0, definitionReferences_1.definitionKindLabel)(kinds)} \`${rawValue}\`.`, 'warning');
        }
    }
    collectNamespaceIssues(doc, fileNamespace, issues, options) {
        if (!options.expectedNamespace || options.expectedNamespace === fileNamespace) {
            return;
        }
        const infoNode = doc.get('info', true);
        if (!YAML.isMap(infoNode)) {
            return;
        }
        this.pushNodeIssue(issues, infoNode.get('namespace', true), `Namespace \`${fileNamespace}\` does not match folder namespace \`${options.expectedNamespace}\`.`, 'warning');
    }
    getNamespace(doc) {
        const infoNode = doc.get('info', true);
        if (!YAML.isMap(infoNode)) {
            return undefined;
        }
        const namespaceNode = infoNode.get('namespace', true);
        if (YAML.isScalar(namespaceNode) && typeof namespaceNode.value === 'string') {
            return namespaceNode.value;
        }
        return typeof namespaceNode === 'string' ? namespaceNode : undefined;
    }
    collectPluginConfigSchemaIssues(node, schemaNode, path, issues) {
        if (!schemaNode) {
            return;
        }
        const currentPath = path.join('.');
        if (currentPath && !PLUGIN_CONFIG_MANUAL_SCHEMA_PATHS.has(currentPath)) {
            const message = this.pluginConfigSchemaIssueMessage(node, schemaNode, currentPath);
            if (message) {
                this.pushNodeIssue(issues, node, message, 'error');
                return;
            }
        }
        if (YAML.isMap(node) && schemaNode.properties) {
            for (const pair of node.items) {
                if (!YAML.isPair(pair)) {
                    continue;
                }
                const key = YAML.isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
                const childSchema = schemaNode.properties[key] ?? schemaNode.additionalProperties;
                if (childSchema && childSchema !== true) {
                    this.collectPluginConfigSchemaIssues(pair.value, childSchema, [...path, key], issues);
                }
            }
            return;
        }
        if (YAML.isSeq(node) && schemaNode.items) {
            for (const item of node.items) {
                this.collectPluginConfigSchemaIssues(item, schemaNode.items, path, issues);
            }
        }
    }
    pluginConfigSchemaIssueMessage(node, schemaNode, path) {
        if (Array.isArray(schemaNode.anyOf)) {
            return schemaNode.anyOf.some((entry) => !this.pluginConfigSchemaIssueMessage(node, entry, path))
                ? undefined
                : `\`${path}\` has invalid value.`;
        }
        const value = YAML.isScalar(node) ? node.value : undefined;
        if (Array.isArray(schemaNode.enum) && !schemaNode.enum.includes(value)) {
            return `\`${path}\` must be one of: ${schemaNode.enum.map((entry) => `\`${String(entry)}\``).join(', ')}.`;
        }
        if (schemaNode.const !== undefined && value !== schemaNode.const) {
            return `\`${path}\` must be \`${String(schemaNode.const)}\`.`;
        }
        if (schemaNode.type && !this.nodeMatchesSchemaType(node, schemaNode.type)) {
            return `\`${path}\` must be ${this.schemaTypeLabel(schemaNode.type)}.`;
        }
        return undefined;
    }
    nodeMatchesSchemaType(node, type) {
        if (type === 'object') {
            return YAML.isMap(node);
        }
        if (type === 'array') {
            return YAML.isSeq(node);
        }
        if (!YAML.isScalar(node)) {
            return false;
        }
        if (type === 'string') {
            return typeof node.value === 'string';
        }
        if (type === 'boolean') {
            return typeof node.value === 'boolean';
        }
        if (type === 'integer') {
            return typeof node.value === 'number' && Number.isInteger(node.value);
        }
        if (type === 'number') {
            return typeof node.value === 'number';
        }
        return true;
    }
    schemaTypeLabel(type) {
        return type === 'integer' ? 'an integer' : `a ${type}`;
    }
    pushNodeIssue(issues, node, message, severity) {
        const range = this.getNodeRange(node);
        if (!range) {
            return;
        }
        issues.push({ range, message, severity });
    }
    getNodeRange(node) {
        if (!node || typeof node !== 'object' || !('range' in node)) {
            return undefined;
        }
        const range = node.range;
        if (!range) {
            return undefined;
        }
        return { start: range[0], end: range[1] };
    }
    isScalarValue(node, expectedValue) {
        return YAML.isScalar(node) && node.value === expectedValue;
    }
    isValidAssetKey(key) {
        return /^[a-z0-9_./:-]+$/.test(key);
    }
    lineOffset(lines, lineIndex) {
        let offset = 0;
        for (let index = 0; index < lineIndex; index++) {
            offset += lines[index].length + 1;
        }
        return offset;
    }
}
exports.ItemsAdderDiagnosticsProvider = ItemsAdderDiagnosticsProvider;
//# sourceMappingURL=itemsAdderDiagnostics.js.map