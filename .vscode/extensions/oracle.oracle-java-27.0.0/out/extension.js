/*
 * Copyright (c) 2024-2026, Oracle and/or its affiliates.
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
'use strict';
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
exports.activate = activate;
exports.deactivate = deactivate;
const launchConfigurations = require("./launchConfigurations");
const constants_1 = require("./constants");
const initializer_1 = require("./lsp/initializer");
const register_1 = require("./commands/register");
const debugger_1 = require("./debugger/debugger");
const listener_1 = require("./configurations/listener");
const textDocumentContentProvider_1 = require("./lsp/listeners/textDocumentContentProvider");
const extensionContextInfo_1 = require("./extensionContextInfo");
const clientPromise_1 = require("./lsp/clientPromise");
const globalState_1 = require("./globalState");
const register_2 = require("./notebooks/register");
const telemetry_1 = require("./telemetry/telemetry");
const trustWorkspace_1 = require("./configurations/trustWorkspace");
const logger_1 = require("./logger");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const contextInfo = new extensionContextInfo_1.ExtensionContextInfo(context);
        globalState_1.globalState.initialize(contextInfo, new clientPromise_1.ClientPromise());
        (0, register_1.subscribeTrustSafeCommands)(context);
        trustWorkspace_1.trustProvider.registerListeners(contextInfo);
        try {
            yield trustWorkspace_1.trustProvider.checkTrust();
        }
        catch (err) {
            logger_1.LOGGER.error(`Java extension activation stopped because workspace trust failed: ${err.message}`);
            yield trustWorkspace_1.trustProvider.showTrustFailureErrorMessage();
            throw err;
        }
        globalState_1.globalState.getClientPromise().initialize();
        telemetry_1.Telemetry.initializeTelemetry(contextInfo);
        (0, listener_1.registerConfigChangeListeners)(context);
        (0, initializer_1.clientInit)();
        (0, debugger_1.registerDebugger)(context);
        (0, register_1.subscribeCommands)(context);
        (0, textDocumentContentProvider_1.registerFileProviders)(context);
        (0, register_2.registerNotebookProviders)(context);
        launchConfigurations.updateLaunchConfig();
        // register completions:
        launchConfigurations.registerCompletion(context);
        return Object.freeze({
            version: constants_1.extConstants.API_VERSION,
            apiVersion: constants_1.extConstants.API_VERSION
        });
    });
}
function deactivate() {
    var _a;
    telemetry_1.Telemetry.enqueueCloseEvent();
    const process = (_a = globalState_1.globalState.getNbProcessManager()) === null || _a === void 0 ? void 0 : _a.getProcess();
    if (process != null) {
        process === null || process === void 0 ? void 0 : process.kill();
    }
    return globalState_1.globalState.getClientPromise().stopClient();
}
//# sourceMappingURL=extension.js.map