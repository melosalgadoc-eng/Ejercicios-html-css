"use strict";
/*
  Copyright (c) 2026, Oracle and/or its affiliates.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

     https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeConfigurations = exports.extractSettingsInformation = exports.completeInternalConfigurationResolver = exports.createInternalResolverConfig = exports.isInternalConfigurationResolverConfig = void 0;
const vscode_1 = require("vscode");
const constants_1 = require("../../constants");
const configurationValueResolver_1 = require("./configurationValueResolver");
const logger_1 = require("../../logger");
const utils_1 = require("../../utils");
const isInternalConfigurationResolverConfig = (config) => config.type === constants_1.extConstants.COMMAND_PREFIX && (config === null || config === void 0 ? void 0 : config.__internalConfigurationResolver) === true;
exports.isInternalConfigurationResolverConfig = isInternalConfigurationResolverConfig;
const createInternalResolverConfig = (requestId, resolverValues) => ({
    type: constants_1.extConstants.COMMAND_PREFIX,
    __internalConfigurationResolver: true,
    __resolverRequestId: requestId,
    __resolverValues: resolverValues,
});
exports.createInternalResolverConfig = createInternalResolverConfig;
const completeInternalConfigurationResolver = (config) => {
    if (!(0, exports.isInternalConfigurationResolverConfig)(config)) {
        logger_1.LOGGER.warn("Something went wrong while resolving config");
        return;
    }
    configurationValueResolver_1.ConfigurationValueResolver
        .getInstance()
        .completePendingInternalResolver(config.__resolverRequestId, config.__resolverValues);
};
exports.completeInternalConfigurationResolver = completeInternalConfigurationResolver;
const setByKeyPath = (target, key, value) => {
    const path = key.split('.');
    let current = target;
    let idx = 0;
    while (idx < path.length - 1) {
        const segment = path[idx];
        if (!(0, utils_1.isObject)(current[segment])) {
            current[segment] = Object.create(null);
        }
        current = current[segment];
        idx++;
    }
    current[path[idx]] = value;
};
const extractSettingsInformation = (keys) => __awaiter(void 0, void 0, void 0, function* () {
    const result = Object.create(null);
    const prefixedConfiguration = vscode_1.workspace.getConfiguration(constants_1.extConstants.COMMAND_PREFIX);
    const prefixedSection = `${constants_1.extConstants.COMMAND_PREFIX}.`;
    const entries = [];
    keys.forEach(configKey => {
        if (!configKey.startsWith(prefixedSection)) {
            return;
        }
        const prefixedKey = configKey.substring(prefixedSection.length);
        if (!prefixedKey) {
            return;
        }
        const rawValue = prefixedConfiguration.get(prefixedKey);
        if (rawValue !== undefined) {
            entries.push({ configKey, rawValue });
        }
    });
    const resolvedValues = yield configurationValueResolver_1.ConfigurationValueResolver.getInstance().resolveIfNeededBatch(entries);
    resolvedValues.forEach((resolvedValue, index) => {
        setByKeyPath(result, entries[index].configKey, resolvedValue);
    });
    return result;
});
exports.extractSettingsInformation = extractSettingsInformation;
const mergeConfigurations = (configurationSegment, rawConfigTree, resolvedConfigTree) => {
    if (configurationValueResolver_1.ConfigurationValueResolver.getInstance().isSupported(configurationSegment)) {
        return resolvedConfigTree;
    }
    if (configurationSegment == null ||
        !(0, utils_1.isObject)(rawConfigTree) ||
        !(0, utils_1.isObject)(resolvedConfigTree) ||
        !(0, utils_1.hasSameKeys)(rawConfigTree, resolvedConfigTree)) {
        return rawConfigTree;
    }
    const merged = Object.create(null);
    Object.entries(rawConfigTree).forEach(([key, value]) => {
        const nextSegment = `${configurationSegment}.${key}`;
        merged[key] = (0, exports.mergeConfigurations)(nextSegment, value, resolvedConfigTree[key]);
    });
    return merged;
};
exports.mergeConfigurations = mergeConfigurations;
//# sourceMappingURL=utils.js.map