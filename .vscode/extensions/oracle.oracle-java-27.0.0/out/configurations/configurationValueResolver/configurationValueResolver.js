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
exports.ConfigurationValueResolver = void 0;
const vscode_1 = require("vscode");
const configuration_1 = require("../configuration");
const globalState_1 = require("../../globalState");
const utils_1 = require("../../utils");
const internalDebugResolutionBackend_1 = require("./internalDebugResolutionBackend");
const logger_1 = require("../../logger");
const utils_2 = require("./utils");
class ConfigurationValueResolver {
    constructor(extensionContext) {
        this.supportedConfigKeys = new Set(configuration_1.configsThatNeedAdditionalResolver);
        this.internalResolver = new internalDebugResolutionBackend_1.InternalDebugResolutionBackend();
        this.resolverDisposable = new vscode_1.Disposable(() => this.dispose());
        extensionContext.subscriptions.push(this.resolverDisposable);
    }
    static getInstance() {
        if (!ConfigurationValueResolver.instance) {
            const extensionContext = globalState_1.globalState.getExtensionContextInfo().getExtensionContext();
            ConfigurationValueResolver.instance = new ConfigurationValueResolver(extensionContext);
        }
        return ConfigurationValueResolver.instance;
    }
    isPrefixAmongstSupportedKeys(prefixConfigKey) {
        if (this.isSupported(prefixConfigKey)) {
            return true;
        }
        const sectionPrefix = `${prefixConfigKey}.`;
        for (const key of this.supportedConfigKeys) {
            if (key.startsWith(sectionPrefix))
                return true;
        }
        return false;
    }
    isSupported(configKey) {
        return this.supportedConfigKeys.has(configKey);
    }
    resolveIfNeeded(resolveConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield this.resolveIfNeededBatch([resolveConfig]);
            return values[0];
        });
    }
    resolveIfNeededBatch(configs) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolvedValues = configs.map(config => config.rawValue);
            const resolvableEntries = [];
            configs.forEach(({ configKey: prefixConfigKey, rawValue }, index) => {
                if (this.isPrefixAmongstSupportedKeys(prefixConfigKey)) {
                    resolvableEntries.push({ index, configKey: prefixConfigKey, rawValue });
                }
            });
            if (resolvableEntries.length === 0) {
                return resolvedValues;
            }
            try {
                const resolvedBatch = yield this.internalResolver.resolveBatch(resolvableEntries);
                resolvedBatch.forEach((value, idx) => {
                    const { index, configKey, rawValue } = resolvableEntries[idx];
                    resolvedValues[index] = (0, utils_2.mergeConfigurations)(configKey, rawValue, value);
                });
            }
            catch (error) {
                logger_1.LOGGER.warn(`Failed to resolve VS Code variables for configuration payload: ${(0, utils_1.isError)(error) ? error.message : error}`);
            }
            return resolvedValues;
        });
    }
    completePendingInternalResolver(requestId, resolvedValues) {
        this.internalResolver.completePendingInternalResolver(requestId, resolvedValues);
    }
    dispose() {
        this.internalResolver.dispose();
    }
}
exports.ConfigurationValueResolver = ConfigurationValueResolver;
//# sourceMappingURL=configurationValueResolver.js.map