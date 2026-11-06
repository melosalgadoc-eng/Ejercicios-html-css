"use strict";
/*
  Copyright (c) 2023-2024, Oracle and/or its affiliates.

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
exports.registerBuildOperationCommands = void 0;
const logger_1 = require("../logger");
const localiser_1 = require("../localiser");
const commands_1 = require("./commands");
const utils_1 = require("./utils");
const vscode_1 = require("vscode");
const fs = require("fs");
const saveFilesInWorkspaceBeforeBuild = (callbackFn) => __awaiter(void 0, void 0, void 0, function* () {
    const docsTosave = vscode_1.workspace.textDocuments.
        filter(d => fs.existsSync(d.uri.fsPath)).
        map(d => d.save());
    yield Promise.all(docsTosave);
    return callbackFn();
});
const compileWorkspaceHandler = () => {
    const complileFunction = () => (0, utils_1.wrapCommandWithProgress)(commands_1.nbCommands.buildWorkspace, localiser_1.l10n.value('jdk.extension.command.progress.compilingWorkSpace'), logger_1.LOGGER.getOutputChannel());
    return saveFilesInWorkspaceBeforeBuild(complileFunction);
};
const cleanWorkspaceHandler = () => {
    const cleanFunction = () => (0, utils_1.wrapCommandWithProgress)(commands_1.nbCommands.cleanWorkspace, localiser_1.l10n.value('jdk.extension.command.progress.cleaningWorkSpace'), logger_1.LOGGER.getOutputChannel());
    return saveFilesInWorkspaceBeforeBuild(cleanFunction);
};
const compileProjectHandler = (args) => {
    var _a;
    let commandArgs = args;
    if (!commandArgs) {
        commandArgs = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.toString();
    }
    const compileProjectFunction = () => (0, utils_1.wrapProjectActionWithProgress)('build', undefined, localiser_1.l10n.value('jdk.extension.command.progress.compilingProject'), logger_1.LOGGER.getOutputChannel(), commandArgs);
    saveFilesInWorkspaceBeforeBuild(compileProjectFunction);
};
const cleanProjectHandler = (args) => {
    var _a;
    let commandArgs = args;
    if (!commandArgs) {
        commandArgs = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.toString();
    }
    const cleanProjectHandler = () => (0, utils_1.wrapProjectActionWithProgress)('clean', undefined, localiser_1.l10n.value('jdk.extension.command.progress.cleaningProject'), logger_1.LOGGER.getOutputChannel(), commandArgs);
    saveFilesInWorkspaceBeforeBuild(cleanProjectHandler);
};
exports.registerBuildOperationCommands = [
    {
        command: commands_1.extCommands.compileWorkspace,
        handler: compileWorkspaceHandler
    }, {
        command: commands_1.extCommands.cleanWorkspace,
        handler: cleanWorkspaceHandler
    }, {
        command: commands_1.extCommands.compileProject,
        handler: compileProjectHandler
    }, {
        command: commands_1.extCommands.cleanProject,
        handler: cleanProjectHandler
    }
];
//# sourceMappingURL=buildOperations.js.map