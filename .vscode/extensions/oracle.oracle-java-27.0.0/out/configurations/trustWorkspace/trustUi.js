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
exports.TrustUi = void 0;
const vscode_1 = require("vscode");
const commands_1 = require("../../commands/commands");
const localiser_1 = require("../../localiser");
const constants_1 = require("../constants");
const types_1 = require("./types");
class TrustUi {
    constructor() {
        this.requestTrust = (workspaceFoldersForPopUp_1, ...args_1) => __awaiter(this, [workspaceFoldersForPopUp_1, ...args_1], void 0, function* (workspaceFoldersForPopUp, showAsModal = true) {
            const reviewSettingsAction = localiser_1.l10n.value("jdk.extension.trust.label.reviewSettings");
            const yesAction = localiser_1.l10n.value("jdk.downloader.message.confirmation.yes");
            const noAction = localiser_1.l10n.value("jdk.downloader.message.confirmation.no");
            const selectedAction = yield vscode_1.window.showWarningMessage(localiser_1.l10n.value("jdk.extension.trust.message.confirmWorkspaceSettings"), { modal: showAsModal }, reviewSettingsAction, yesAction, noAction);
            switch (selectedAction) {
                case reviewSettingsAction:
                    yield this.openSettingsFiles(workspaceFoldersForPopUp);
                    return this.requestTrust(workspaceFoldersForPopUp, false);
                case yesAction:
                    return types_1.TRUST_TYPE.TRUSTED;
                default:
                    return types_1.TRUST_TYPE.NOT_TRUSTED;
            }
        });
        this.showTrustFailureErrorMessage = () => __awaiter(this, void 0, void 0, function* () {
            const openWorkspaceTrustSettings = localiser_1.l10n.value("jdk.extension.trust.label.openWorkspaceSettingsTrustDecisions");
            const selectedAction = yield vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.extension.trust.error_msg.activationStopped"), openWorkspaceTrustSettings);
            if (selectedAction == openWorkspaceTrustSettings) {
                yield vscode_1.commands.executeCommand(commands_1.extCommands.workspaceSettingsTrustDecisions);
            }
        });
        this.showWorkspaceSettingsTrust = (settingLocationTrustDecisions) => __awaiter(this, void 0, void 0, function* () {
            const items = settingLocationTrustDecisions.map(decision => this.createTrustQuickPickItem(decision));
            if (!items.length) {
                yield vscode_1.window.showInformationMessage(localiser_1.l10n.value("jdk.extension.trust.message.noWorkspaceSettingsTrustDecisions"));
                return undefined;
            }
            const quickPick = vscode_1.window.createQuickPick();
            quickPick.title = localiser_1.l10n.value("jdk.extension.trust.quickPick.title");
            quickPick.placeholder = localiser_1.l10n.value("jdk.extension.trust.quickPick.placeholder");
            quickPick.canSelectMany = true;
            quickPick.items = items;
            quickPick.selectedItems = items.filter(item => item.resource.isTrusted);
            quickPick.ignoreFocusOut = true;
            return new Promise(resolve => {
                let accepted = false;
                quickPick.onDidAccept(() => {
                    accepted = true;
                    const selectedWorkspaceFolders = quickPick.selectedItems.map(item => item.resource);
                    quickPick.hide();
                    resolve(selectedWorkspaceFolders);
                });
                quickPick.onDidHide(() => {
                    quickPick.dispose();
                    if (!accepted) {
                        resolve(undefined);
                    }
                });
                quickPick.show();
            });
        });
        this.openSettingsFiles = (settingLocationTrustDecisions) => __awaiter(this, void 0, void 0, function* () {
            for (const folder of settingLocationTrustDecisions) {
                const settingsUri = this.getSettingsUri(folder);
                const document = yield vscode_1.workspace.openTextDocument(settingsUri);
                yield vscode_1.window.showTextDocument(document, { preview: false });
            }
        });
        this.getSettingsUri = (settingLocationTrustDecision) => {
            if (settingLocationTrustDecision.type == 1 /* SettingLocation.WORKSPACE_FILE */) {
                return settingLocationTrustDecision.uri;
            }
            return vscode_1.Uri.joinPath(settingLocationTrustDecision.uri, constants_1.vscodeConfigConstants.VSCODE_WORKSPACE_CONFIG_FOLDER, constants_1.vscodeConfigConstants.VSCODE_CONFIG_FILE_NAME);
        };
        this.showReloadPrompt = () => __awaiter(this, void 0, void 0, function* () {
            const reloadNow = localiser_1.l10n.value("jdk.downloader.message.reload");
            const selected = yield vscode_1.window.showInformationMessage(localiser_1.l10n.value("jdk.configChanged"), reloadNow);
            if (selected === reloadNow) {
                yield vscode_1.commands.executeCommand(commands_1.builtInCommands.reloadWindow);
            }
        });
        this.createTrustQuickPickItem = (settingLocationTrustDecision) => {
            return {
                label: this.getWorkspaceFolderSettingsLabel(settingLocationTrustDecision),
                description: settingLocationTrustDecision.isTrusted ? localiser_1.l10n.value("jdk.extension.trust.label.trusted") : localiser_1.l10n.value("jdk.extension.trust.label.notTrusted"),
                detail: settingLocationTrustDecision.uri.fsPath || settingLocationTrustDecision.uri.toString(),
                resource: settingLocationTrustDecision
            };
        };
        this.getWorkspaceFolderSettingsLabel = (settingLocationTrustDecision) => {
            if (settingLocationTrustDecision.type == 1 /* SettingLocation.WORKSPACE_FILE */) {
                return localiser_1.l10n.value("jdk.extension.trust.label.workspaceFile");
            }
            const folder = vscode_1.workspace.getWorkspaceFolder(settingLocationTrustDecision.uri);
            return (folder === null || folder === void 0 ? void 0 : folder.name) || settingLocationTrustDecision.uri.fsPath || settingLocationTrustDecision.uri.toString();
        };
    }
}
exports.TrustUi = TrustUi;
//# sourceMappingURL=trustUi.js.map