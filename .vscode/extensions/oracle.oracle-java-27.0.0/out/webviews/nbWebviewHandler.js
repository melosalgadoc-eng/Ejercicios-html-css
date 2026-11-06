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
exports.execInHtmlPage = exports.showHtmlPage = void 0;
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
const path = require("path");
const vscode_1 = require("vscode");
const commands_1 = require("../commands/commands");
const globalState_1 = require("../globalState");
const webviews = new Map();
const normalizeUriForComparison = (uri) => {
    // VS Code Uri.fsPath API guarantees normalization of the windows drive-letter to lower-case.
    // It also outputs platform-specific path separators.
    return uri.fsPath;
};
const assertUriInsideDirectory = (uri, parent, name) => {
    const parentPath = normalizeUriForComparison(parent);
    const uriPath = normalizeUriForComparison(uri);
    const parentPrefix = parentPath.endsWith(path.sep) ? parentPath : parentPath + path.sep;
    if (!uriPath.startsWith(parentPrefix)) {
        throw new Error(`Invalid ${name}: path escapes global storage`);
    }
};
const createNormalizedFileUri = (uri) => vscode_1.Uri.file(uri.fsPath);
const showHtmlPage = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise(resolve => {
        let data = params.text;
        const extensionContext = globalState_1.globalState.getExtensionContextInfo();
        const match = /<title>(.*)<\/title>/i.exec(data);
        const name = match && match.length > 1 ? match[1] : '';
        if (!(params === null || params === void 0 ? void 0 : params.id)) {
            throw new Error("Invalid showHtmlPage id");
        }
        const globalStorage = extensionContext.getGlobalStorage();
        const resourceDir = createNormalizedFileUri(vscode_1.Uri.joinPath(globalStorage, params.id));
        assertUriInsideDirectory(resourceDir, globalStorage, 'HTML page resource directory');
        vscode_1.workspace.fs.createDirectory(resourceDir);
        let view = vscode_1.window.createWebviewPanel('htmlView', name, vscode_1.ViewColumn.Beside, {
            enableScripts: true,
            localResourceRoots: [resourceDir]
        });
        webviews.set(params.id, view.webview);
        const resources = params.resources;
        if (resources) {
            for (const resourceName in resources) {
                if (!resourceName) {
                    throw new Error("Invalid resourceName");
                }
                const resourceText = resources[resourceName];
                const resourceUri = createNormalizedFileUri(vscode_1.Uri.joinPath(resourceDir, resourceName));
                assertUriInsideDirectory(resourceUri, resourceDir, 'HTML page resource URI');
                vscode_1.workspace.fs.writeFile(resourceUri, Buffer.from(resourceText, 'utf8'));
                data = data.replace(`href="${resourceName}"`, `href="${view.webview.asWebviewUri(resourceUri)}"`);
            }
        }
        view.webview.html = data;
        view.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'dispose':
                    webviews.delete(params.id);
                    view.dispose();
                    break;
                case 'command':
                    vscode_1.commands.executeCommand(commands_1.nbCommands.htmlProcessCmd, message.data);
                    break;
            }
        });
        view.onDidDispose(() => {
            resolve();
            vscode_1.workspace.fs.delete(resourceDir, { recursive: true });
        });
    });
});
exports.showHtmlPage = showHtmlPage;
const execInHtmlPage = (params) => {
    return new Promise(resolve => {
        const webview = webviews.get(params.id);
        if (webview) {
            webview.postMessage({
                execScript: params.text,
                pause: params.pause
            }).then(ret => {
                resolve(ret);
            });
        }
        resolve(false);
    });
};
exports.execInHtmlPage = execInHtmlPage;
//# sourceMappingURL=nbWebviewHandler.js.map