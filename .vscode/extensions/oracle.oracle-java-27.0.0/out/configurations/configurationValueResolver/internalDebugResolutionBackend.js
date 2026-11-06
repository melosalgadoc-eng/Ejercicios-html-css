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
exports.InternalDebugResolutionBackend = void 0;
const crypto_1 = require("crypto");
const vscode_1 = require("vscode");
const constants_1 = require("../../constants");
const logger_1 = require("../../logger");
const utils_1 = require("../../utils");
const utils_2 = require("./utils");
class InternalDebugConfigProvider {
    resolveDebugConfiguration(folder, debugConfiguration, token) {
        return debugConfiguration;
    }
    resolveDebugConfigurationWithSubstitutedVariables(folder, debugConfiguration, token) {
        if ((0, utils_2.isInternalConfigurationResolverConfig)(debugConfiguration)) {
            (0, utils_2.completeInternalConfigurationResolver)(debugConfiguration);
            return undefined;
        }
        return debugConfiguration;
    }
}
class InternalDebugResolutionBackend {
    constructor() {
        this.pending = new Map();
        this.generateRequestId = () => (0, crypto_1.randomUUID)().toString();
        this.providerRegistration = vscode_1.debug.registerDebugConfigurationProvider(constants_1.extConstants.COMMAND_PREFIX, new InternalDebugConfigProvider());
    }
    resolveBatch(configs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (configs.length === 0) {
                return [];
            }
            const requestId = this.generateRequestId();
            const fallbackValues = this.createResolverValueMap(configs);
            const resolution = new Promise(resolve => {
                const timeout = setTimeout(() => {
                    logger_1.LOGGER.warn(`Timed out resolving VS Code variables, using raw values for request ${requestId}`);
                    this.completePendingInternalResolver(requestId);
                }, InternalDebugResolutionBackend.INTERNAL_RESOLVER_TIMEOUT_MS);
                this.pending.set(requestId, { resolve, timeout, fallbackValues });
            });
            try {
                const started = yield vscode_1.debug.startDebugging(undefined, this.createDebugConfig(requestId, fallbackValues), InternalDebugResolutionBackend.DUMMY_DEBUG_OPTIONS);
                if (!started && this.pending.has(requestId)) {
                    logger_1.LOGGER.warn(`Debug launch for VS Code variable resolution did not start, using raw values for request ${requestId}`);
                    this.completePendingInternalResolver(requestId);
                }
            }
            catch (error) {
                logger_1.LOGGER.warn(`Failed to resolve VS Code variables: ${(0, utils_1.isError)(error) ? error.message : error}`);
                this.completePendingInternalResolver(requestId);
            }
            const resolvedMap = yield resolution;
            return configs.map(config => {
                const resolved = resolvedMap[config.configKey];
                return resolved === undefined ? config.rawValue : resolved;
            });
        });
    }
    completePendingInternalResolver(requestId, resolvedValues) {
        const pending = this.pending.get(requestId);
        if (!pending) {
            return;
        }
        clearTimeout(pending.timeout);
        this.pending.delete(requestId);
        pending.resolve(resolvedValues !== null && resolvedValues !== void 0 ? resolvedValues : pending.fallbackValues);
    }
    dispose() {
        this.providerRegistration.dispose();
        for (const [requestId] of this.pending) {
            this.completePendingInternalResolver(requestId);
            logger_1.LOGGER.warn(`Disposing pending VS Code variable resolution request ${requestId}`);
        }
    }
    createDebugConfig(requestId, resolverValues) {
        return Object.assign(Object.assign({}, (0, utils_2.createInternalResolverConfig)(requestId, resolverValues)), { name: InternalDebugResolutionBackend.INTERNAL_RESOLVER_NAME, request: 'launch' });
    }
    createResolverValueMap(configs) {
        const result = {};
        for (const config of configs) {
            result[config.configKey] = config.rawValue;
        }
        return result;
    }
}
exports.InternalDebugResolutionBackend = InternalDebugResolutionBackend;
InternalDebugResolutionBackend.INTERNAL_RESOLVER_TIMEOUT_MS = 10000;
InternalDebugResolutionBackend.INTERNAL_RESOLVER_NAME = `__${constants_1.extConstants.COMMAND_PREFIX}_internal_resolver__`;
InternalDebugResolutionBackend.DUMMY_DEBUG_OPTIONS = Object.freeze({
    noDebug: true,
    suppressDebugToolbar: true,
    suppressDebugStatusbar: true,
    suppressDebugView: true,
    suppressSaveBeforeStart: true,
});
//# sourceMappingURL=internalDebugResolutionBackend.js.map