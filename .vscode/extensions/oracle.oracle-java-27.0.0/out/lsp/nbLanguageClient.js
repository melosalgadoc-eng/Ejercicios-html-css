"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NbLanguageClient = void 0;
/*
  Copyright (c) 2023-2026, Oracle and/or its affiliates.

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
const node_1 = require("vscode-languageclient/node");
const vscode_languageclient_1 = require("vscode-languageclient");
const projects_1 = require("../views/projects");
const vscode_1 = require("vscode");
const constants_1 = require("../constants");
const configurationValueResolver_1 = require("../configurations/configurationValueResolver/configurationValueResolver");
const configuration_1 = require("../configurations/configuration");
const utils_1 = require("./utils");
const globalState_1 = require("../globalState");
const telemetry_1 = require("../telemetry/telemetry");
const utils_2 = require("../configurations/configurationValueResolver/utils");
class NbLanguageClient extends node_1.LanguageClient {
    constructor(id, name, s, log, c) {
        super(id, name, s, c);
        this._treeViewService = (0, projects_1.createTreeViewService)(log, this);
    }
    findTreeViewService() {
        return this._treeViewService;
    }
    stop() {
        const r = super.stop();
        this._treeViewService.dispose();
        return r;
    }
}
exports.NbLanguageClient = NbLanguageClient;
_a = NbLanguageClient;
NbLanguageClient.build = (serverOptions, logger) => {
    let client;
    let documentSelectors = [
        { language: constants_1.extConstants.LANGUAGE_ID },
        { language: 'properties', pattern: '**/*.properties' },
        { language: 'jackpot-hint' },
        { language: 'xml', pattern: '**/pom.xml' },
        { pattern: '*.gradle' },
        { pattern: '*.gradle.kts' }
    ];
    // Options to control the language client
    let clientOptions = {
        // Register the server for java documents
        documentSelector: documentSelectors,
        synchronize: {
            configurationSection: configuration_1.userConfigsListenedByServer,
            fileEvents: [
                vscode_1.workspace.createFileSystemWatcher('**/*.java')
            ]
        },
        outputChannel: logger.getOutputChannel(),
        revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never,
        progressOnInitialization: true,
        initializationOptions: {
            'nbcodeCapabilities': {
                'statusBarMessageSupport': true,
                'testResultsSupport': true,
                'showHtmlPageSupport': true,
                'wantsJavaSupport': true,
                'wantsGroovySupport': false,
                'wantsTelemetryEnabled': telemetry_1.Telemetry.getIsTelemetryFeatureAvailable(),
                'commandPrefix': constants_1.extConstants.COMMAND_PREFIX,
                'configurationPrefix': `${constants_1.extConstants.COMMAND_PREFIX}.`,
                'altConfigurationPrefix': `${constants_1.extConstants.COMMAND_PREFIX}.`,
                'wantsNotebookSupport': true
            }
        },
        middleware: {
            workspace: {
                configuration: (params, token, next) => __awaiter(void 0, void 0, void 0, function* () {
                    const rawValues = yield next(params, token);
                    const configsToBeResolved = [];
                    params.items.forEach((item, index) => {
                        var _b;
                        if ((_b = item === null || item === void 0 ? void 0 : item.section) === null || _b === void 0 ? void 0 : _b.trim()) {
                            configsToBeResolved.push({
                                configKey: item === null || item === void 0 ? void 0 : item.section.trim(),
                                rawValue: rawValues[index],
                            });
                        }
                    });
                    return configurationValueResolver_1.ConfigurationValueResolver.getInstance().resolveIfNeededBatch(configsToBeResolved);
                }),
                didChangeConfiguration: (sections, next) => __awaiter(void 0, void 0, void 0, function* () {
                    if (!sections || !client) {
                        return next(sections);
                    }
                    return client.sendNotification('workspace/didChangeConfiguration', {
                        settings: yield (0, utils_2.extractSettingsInformation)(sections)
                    });
                })
            }
        },
        errorHandler: {
            error: function (error, _message, count) {
                return { action: vscode_languageclient_1.ErrorAction.Continue, message: error.message };
            },
            closed: function () {
                logger.warn(`Connection to ${constants_1.extConstants.SERVER_NAME} closed.`);
                if (!globalState_1.globalState.getClientPromise().activationPending) {
                    (0, utils_1.restartWithJDKLater)(10000, false);
                }
                return { action: vscode_languageclient_1.CloseAction.DoNotRestart };
            }
        }
    };
    client = new _a(constants_1.extConstants.NB_LANGUAGE_CLIENT_ID, constants_1.extConstants.NB_LANGUAGE_CLIENT_NAME, serverOptions, logger.getOutputChannel(), clientOptions);
    return client;
};
//# sourceMappingURL=nbLanguageClient.js.map