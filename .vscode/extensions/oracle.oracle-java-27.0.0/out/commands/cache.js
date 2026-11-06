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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCacheCommands = void 0;
/*
  Copyright (c) 2023-2025, Oracle and/or its affiliates.

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
const vscode_1 = require("vscode");
const commands_1 = require("./commands");
const localiser_1 = require("../localiser");
const fs = require("fs");
const path = require("path");
const globalState_1 = require("../globalState");
const handlers_1 = require("../configurations/handlers");
const configuration_1 = require("../configurations/configuration");
const logger_1 = require("../logger");
const utils_1 = require("../utils");
const getLanguageServerUserDir = () => {
    var _a;
    const userdirScope = process.env['nbcode_userdir'] || (0, handlers_1.getConfigurationValue)(configuration_1.configKeys.userdir, "local");
    const workspaceStoragePath = (_a = globalState_1.globalState.getExtensionContextInfo().getWorkspaceStorage()) === null || _a === void 0 ? void 0 : _a.fsPath;
    const userdirParentDir = userdirScope === "local" && workspaceStoragePath
        ? workspaceStoragePath
        : globalState_1.globalState.getExtensionContextInfo().getGlobalStorage().fsPath;
    const userDir = path.join(userdirParentDir, "userdir");
    return userDir;
};
const deleteCache = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userDir = getLanguageServerUserDir();
    if (userDir && fs.existsSync(userDir)) {
        const yes = localiser_1.l10n.value("jdk.extension.cache.label.confirmation.yes");
        const cancel = localiser_1.l10n.value("jdk.extension.cache.label.confirmation.cancel");
        const confirmation = yield vscode_1.window.showInformationMessage(localiser_1.l10n.value("jdk.extension.cache.message.confirmToDeleteCache"), yes, cancel);
        if (confirmation === yes) {
            const reloadWindowActionLabel = localiser_1.l10n.value("jdk.extension.cache.label.reloadWindow");
            try {
                yield globalState_1.globalState.getClientPromise().stopClient();
                globalState_1.globalState.setDeactivated(true);
                yield ((_a = globalState_1.globalState.getNbProcessManager()) === null || _a === void 0 ? void 0 : _a.killProcess(false));
                yield fs.promises.rm(userDir, { recursive: true });
                yield vscode_1.window.showInformationMessage(localiser_1.l10n.value("jdk.extension.message.cacheDeleted"), reloadWindowActionLabel);
            }
            catch (err) {
                logger_1.LOGGER.error(`Error while deleting the cache  : ${(0, utils_1.isError)(err) ? err.message : err}`);
                const openLSUserDirLabel = localiser_1.l10n.value("jdk.extension.cache.label.openLSUserDir");
                const selectedAction = yield vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.extension.error_msg.cacheDeletionError"), openLSUserDirLabel);
                if (selectedAction === openLSUserDirLabel) {
                    const opened = yield openLanguageServerUserDir();
                    if (opened)
                        yield vscode_1.window.showInformationMessage(localiser_1.l10n.value("jdk.extension.cache.message.reloadWindow.afterUserDirDeletion"), reloadWindowActionLabel);
                    else
                        yield vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.extension.error_msg.cacheDeletion.notOpenUserDir", { userDir }), reloadWindowActionLabel);
                }
            }
            finally {
                vscode_1.commands.executeCommand(commands_1.builtInCommands.reloadWindow);
            }
        }
    }
    else {
        vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.extension.cache.message.noUserDir"));
    }
});
const openLanguageServerUserDir = () => __awaiter(void 0, void 0, void 0, function* () {
    const userDir = getLanguageServerUserDir();
    if (userDir && fs.existsSync(userDir)) {
        return vscode_1.env.openExternal(utils_1.FileUtils.toUri(userDir));
    }
    else {
        vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.extension.cache.message.noUserDir"));
        return false;
    }
});
exports.registerCacheCommands = [
    {
        command: commands_1.extCommands.deleteCache,
        handler: deleteCache
    }, {
        command: commands_1.extCommands.openLanguageServerUserDir,
        handler: openLanguageServerUserDir
    },
];
//# sourceMappingURL=cache.js.map