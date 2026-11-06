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
exports.TrustProvider = void 0;
const vscode_1 = require("vscode");
const handlers_1 = require("../handlers");
const logger_1 = require("../../logger");
const globalState_1 = require("../../globalState");
const localiser_1 = require("../../localiser");
const trustUi_1 = require("./trustUi");
const types_1 = require("./types");
const workspaceSettingsTrustCacheValue_1 = require("../../cache/workspaceSettingsTrustCacheValue");
class TrustProvider {
    constructor(cacheService) {
        this.cacheService = cacheService;
        this.registerListeners = (context) => {
            context.pushSubscription(vscode_1.workspace.onDidChangeWorkspaceFolders(this.onChangeWorkspaceHandler));
        };
        this.checkTrust = () => __awaiter(this, void 0, void 0, function* () {
            yield this.handleWorkspaceFoldersTrustStatus(this.getWorkspaceFoldersTrustStatus());
        });
        this.showTrustFailureErrorMessage = () => __awaiter(this, void 0, void 0, function* () {
            yield this.trustUi.showTrustFailureErrorMessage();
        });
        this.showWorkspaceSettingsTrust = () => __awaiter(this, void 0, void 0, function* () {
            const allWorkspaceFoldersTrustStatus = this.getWorkspaceFoldersTrustStatus();
            const workspaceFoldersWithoutUserInput = allWorkspaceFoldersTrustStatus.filter(settingsLocation => !settingsLocation.isUserInputAvailable);
            const workspaceFoldersWithSettings = allWorkspaceFoldersTrustStatus.filter(settingsLocation => settingsLocation.isUserInputAvailable)
                .concat(this.getWorkspaceFoldersSettingsFile(workspaceFoldersWithoutUserInput, (0, handlers_1.getAllConfigurationKeys)()));
            const selectedWorkspaceFolders = yield this.trustUi.showWorkspaceSettingsTrust(workspaceFoldersWithSettings);
            if (!selectedWorkspaceFolders) {
                return;
            }
            yield this.updateTrustSettingsSelection(workspaceFoldersWithSettings, selectedWorkspaceFolders);
            if (selectedWorkspaceFolders.length == workspaceFoldersWithSettings.length) {
                yield this.trustUi.showReloadPrompt();
                return;
            }
            yield this.stopExtension();
        });
        this.onChangeWorkspaceHandler = (event) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.handleWorkspaceFoldersTrustStatus(this.getFolderTrustStatus(event.added));
            }
            catch (err) {
                logger_1.LOGGER.error(`Java extension stopped because workspace trust failed after adding a folder: ${err.message}`);
                yield this.stopExtension();
            }
        });
        this.handleWorkspaceFoldersTrustStatus = (settingsLocationTrustStatus) => __awaiter(this, void 0, void 0, function* () {
            if (!(settingsLocationTrustStatus === null || settingsLocationTrustStatus === void 0 ? void 0 : settingsLocationTrustStatus.length)) {
                return;
            }
            if (settingsLocationTrustStatus.some(settingsLocation => settingsLocation.isUserInputAvailable && !settingsLocation.isTrusted)) {
                logger_1.LOGGER.log("Untrusted workspace folders found");
                throw new Error(localiser_1.l10n.value("jdk.extension.trust.error_msg.rejected"));
            }
            if (settingsLocationTrustStatus.every(settingsLocation => settingsLocation.isUserInputAvailable && settingsLocation.isTrusted)) {
                logger_1.LOGGER.log("All workspace folders are trusted.");
                return;
            }
            const workspaceFoldersForPopUp = this.getWorkspaceFoldersForPopUp(settingsLocationTrustStatus);
            if (!workspaceFoldersForPopUp.length) {
                logger_1.LOGGER.log("Settings not found in the untrusted workspace folders, so skipping pop-up");
                return;
            }
            const trustType = yield this.trustUi.requestTrust(workspaceFoldersForPopUp);
            yield this.updateWorkspaceFoldersTrustDecision(workspaceFoldersForPopUp, trustType);
            if (trustType == types_1.TRUST_TYPE.NOT_TRUSTED) {
                throw new Error(localiser_1.l10n.value("jdk.extension.trust.error_msg.rejected"));
            }
        });
        this.getWorkspaceFoldersTrustStatus = () => {
            const settingsLocationTrustStatus = [];
            const workspaceLevelUri = vscode_1.workspace.workspaceFile;
            if (workspaceLevelUri) {
                settingsLocationTrustStatus.push(this.getWorkspaceFolderTrustStatus(workspaceLevelUri, 1 /* SettingLocation.WORKSPACE_FILE */));
            }
            const { workspaceFolders } = vscode_1.workspace;
            if (workspaceFolders) {
                settingsLocationTrustStatus.push(...this.getFolderTrustStatus(workspaceFolders));
            }
            return settingsLocationTrustStatus;
        };
        this.getFolderTrustStatus = (folders) => {
            return folders.map(folder => this.getWorkspaceFolderTrustStatus(folder.uri, 0 /* SettingLocation.FOLDER */));
        };
        this.getWorkspaceFolderTrustStatus = (uri, type) => {
            const trustStatus = this.cacheService.get(uri.toString());
            return {
                uri,
                type,
                isUserInputAvailable: trustStatus != undefined,
                isTrusted: trustStatus == types_1.TRUST_TYPE.TRUSTED
            };
        };
        this.getWorkspaceFoldersForPopUp = (settingLocationTrustDecisions) => {
            const workspaceFoldersWithoutUserInput = settingLocationTrustDecisions.filter(folder => !folder.isUserInputAvailable);
            if (!workspaceFoldersWithoutUserInput.length) {
                return [];
            }
            return this.getWorkspaceFoldersSettingsFile(workspaceFoldersWithoutUserInput, (0, handlers_1.getAllConfigurationKeys)());
        };
        this.updateWorkspaceFoldersTrustDecision = (settingLocationTrustDecisions, trustType) => __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(settingLocationTrustDecisions.map(decision => this.cacheService.put(decision.uri.toString(), new workspaceSettingsTrustCacheValue_1.WorkspaceSettingsTrustCacheValue(trustType))));
        });
        this.updateTrustSettingsSelection = (settingLocationTrustDecisions, trustedWorkspaceFolders) => __awaiter(this, void 0, void 0, function* () {
            const trustedWorkspaceFolderUris = new Set(trustedWorkspaceFolders.map(folder => folder.uri.toString()));
            yield Promise.all(settingLocationTrustDecisions.map(decision => this.cacheService.put(decision.uri.toString(), new workspaceSettingsTrustCacheValue_1.WorkspaceSettingsTrustCacheValue(trustedWorkspaceFolderUris.has(decision.uri.toString()) ? types_1.TRUST_TYPE.TRUSTED : types_1.TRUST_TYPE.NOT_TRUSTED))));
        });
        this.getWorkspaceFoldersSettingsFile = (settingLocationTrustDecisions, keys) => {
            let isConfigPresentAtWorkspaceLevel = false;
            const workspaceFoldersWithSettingsFile = [];
            const workspaceFile = settingLocationTrustDecisions.find(decision => decision.type == 1 /* SettingLocation.WORKSPACE_FILE */);
            const folderResources = new Map(settingLocationTrustDecisions
                .filter(decision => decision.type == 0 /* SettingLocation.FOLDER */)
                .map(decision => [decision.uri.toString(), decision]));
            for (const key of keys) {
                if (workspaceFile && !isConfigPresentAtWorkspaceLevel) {
                    isConfigPresentAtWorkspaceLevel = this.hasWorkspaceLevelConfiguration(key);
                    if (isConfigPresentAtWorkspaceLevel) {
                        workspaceFoldersWithSettingsFile.push(workspaceFile);
                    }
                }
                for (const [folderUriKey, folderResource] of folderResources) {
                    if (this.hasWorkspaceFolderConfiguration(key, folderResource.uri)) {
                        workspaceFoldersWithSettingsFile.push(folderResource);
                        folderResources.delete(folderUriKey);
                    }
                }
                if (isConfigPresentAtWorkspaceLevel && folderResources.size == 0) {
                    break;
                }
            }
            return workspaceFoldersWithSettingsFile;
        };
        this.hasWorkspaceLevelConfiguration = (key) => {
            var _a;
            return ((_a = vscode_1.workspace.getConfiguration(TrustProvider.BASE_EMPTY_KEY).inspect(key)) === null || _a === void 0 ? void 0 : _a.workspaceValue) != undefined;
        };
        this.hasWorkspaceFolderConfiguration = (key, folderUri) => {
            var _a;
            return ((_a = vscode_1.workspace.getConfiguration(TrustProvider.BASE_EMPTY_KEY, folderUri).inspect(key)) === null || _a === void 0 ? void 0 : _a.workspaceFolderValue) != undefined;
        };
        this.stopExtension = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                yield globalState_1.globalState.getClientPromise().stopClient();
                globalState_1.globalState.setDeactivated(true);
                yield ((_a = globalState_1.globalState.getNbProcessManager()) === null || _a === void 0 ? void 0 : _a.killProcess(false));
            }
            catch (stopErr) {
                logger_1.LOGGER.error(`Failed to stop Java extension after workspace trust failure: ${stopErr.message}`);
            }
            finally {
                yield this.trustUi.showTrustFailureErrorMessage();
            }
        });
        this.trustUi = new trustUi_1.TrustUi();
    }
}
exports.TrustProvider = TrustProvider;
TrustProvider.BASE_EMPTY_KEY = "";
//# sourceMappingURL=trustProvider.js.map