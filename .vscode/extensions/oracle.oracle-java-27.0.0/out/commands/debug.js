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
exports.registerDebugCommands = void 0;
const vscode = require("vscode");
const commands_1 = require("./commands");
const constants_1 = require("../constants");
const utils_1 = require("./utils");
const runTest = (uri, methodName, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    yield runDebug(true, true, uri, methodName, launchConfiguration);
});
const debugTest = (uri, methodName, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    yield runDebug(false, true, uri, methodName, launchConfiguration);
});
const runSingle = (uri, methodName, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    yield runDebug(true, false, uri, methodName, launchConfiguration);
});
const debugSingle = (uri, methodName, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    yield runDebug(false, false, uri, methodName, launchConfiguration);
});
const projectRun = (node, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return runDebug(true, false, ((_a = (0, utils_1.getContextUriFromFile)(node)) === null || _a === void 0 ? void 0 : _a.toString()) || '', undefined, launchConfiguration, true);
});
const projectDebug = (node, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return runDebug(false, false, ((_a = (0, utils_1.getContextUriFromFile)(node)) === null || _a === void 0 ? void 0 : _a.toString()) || '', undefined, launchConfiguration, true);
});
const projectTest = (node, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return runDebug(true, true, ((_a = (0, utils_1.getContextUriFromFile)(node)) === null || _a === void 0 ? void 0 : _a.toString()) || '', undefined, launchConfiguration, true);
});
const projectTestDebug = (node, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return runDebug(false, true, ((_a = (0, utils_1.getContextUriFromFile)(node)) === null || _a === void 0 ? void 0 : _a.toString()) || '', undefined, launchConfiguration, true);
});
const packageTest = (uri, launchConfiguration) => __awaiter(void 0, void 0, void 0, function* () {
    yield runDebug(true, true, uri, undefined, launchConfiguration);
});
const runDebug = (noDebug_1, testRun_1, uri_1, methodName_1, launchConfiguration_1, ...args_1) => __awaiter(void 0, [noDebug_1, testRun_1, uri_1, methodName_1, launchConfiguration_1, ...args_1], void 0, function* (noDebug, testRun, uri, methodName, launchConfiguration, project = false) {
    const docUri = (0, utils_1.getContextUriFromFile)(uri);
    if (docUri) {
        let debugConfig = {
            type: constants_1.extConstants.COMMAND_PREFIX,
            name: `Java ${project ? "Project" : "Single"} ${testRun ? "Test" : ""} ${noDebug ? "Run" : "Debug"} `,
            request: "launch"
        };
        if (methodName) {
            debugConfig['methodName'] = methodName;
        }
        if (launchConfiguration == '') {
            if (debugConfig['launchConfiguration']) {
                delete debugConfig['launchConfiguration'];
            }
        }
        else {
            debugConfig['launchConfiguration'] = launchConfiguration;
        }
        debugConfig['testRun'] = testRun;
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(docUri);
        if (project || testRun) {
            debugConfig['projectFile'] = docUri.toString();
            debugConfig['project'] = project;
        }
        else {
            debugConfig['mainClass'] = docUri.toString();
        }
        const debugOptions = {
            noDebug: noDebug,
        };
        const ret = yield vscode.debug.startDebugging(workspaceFolder, debugConfig, debugOptions);
        return ret ? new Promise((resolve) => {
            const listener = vscode.debug.onDidTerminateDebugSession(() => {
                listener.dispose();
                resolve(true);
            });
        }) : ret;
    }
});
exports.registerDebugCommands = [
    {
        command: commands_1.extCommands.runTest,
        handler: runTest
    }, {
        command: commands_1.extCommands.debugTest,
        handler: debugTest
    }, {
        command: commands_1.extCommands.runSingle,
        handler: runSingle
    }, {
        command: commands_1.extCommands.debugSingle,
        handler: debugSingle
    }, {
        command: commands_1.extCommands.projectRun,
        handler: projectRun
    }, {
        command: commands_1.extCommands.projectDebug,
        handler: projectDebug
    }, {
        command: commands_1.extCommands.projectTest,
        handler: projectTest
    }, {
        command: commands_1.extCommands.projectTestDebug,
        handler: projectTestDebug
    }, {
        command: commands_1.extCommands.packageTest,
        handler: packageTest
    }
];
//# sourceMappingURL=debug.js.map