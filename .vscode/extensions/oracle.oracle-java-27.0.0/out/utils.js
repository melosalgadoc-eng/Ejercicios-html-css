"use strict";
/*
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
exports.FileUtils = exports.parseArguments = exports.hasSameKeys = exports.isObject = exports.appendPrefixToCommand = exports.calculateChecksum = exports.MultiStepInput = void 0;
exports.httpsGet = httpsGet;
exports.downloadFileWithProgressBar = downloadFileWithProgressBar;
exports.isString = isString;
exports.isError = isError;
exports.initializeRunConfiguration = initializeRunConfiguration;
const vscode = require("vscode");
const https = require("https");
const fs = require("fs");
const util_1 = require("util");
const crypto = require("crypto");
const localiser_1 = require("./localiser");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
class InputFlowAction {
}
InputFlowAction.back = new InputFlowAction();
InputFlowAction.cancel = new InputFlowAction();
InputFlowAction.resume = new InputFlowAction();
class MultiStepInput {
    constructor() {
        this.steps = [];
    }
    static run(start) {
        return __awaiter(this, void 0, void 0, function* () {
            const input = new MultiStepInput();
            return input.stepThrough(start);
        });
    }
    stepThrough(start) {
        return __awaiter(this, void 0, void 0, function* () {
            let step = start;
            while (step) {
                this.steps.push(step);
                if (this.current) {
                    this.current.enabled = false;
                    this.current.busy = true;
                }
                try {
                    step = yield step(this);
                }
                catch (err) {
                    if (err === InputFlowAction.back) {
                        this.steps.pop();
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.resume) {
                        step = this.steps.pop();
                    }
                    else if (err === InputFlowAction.cancel) {
                        step = undefined;
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (this.current) {
                this.current.dispose();
            }
        });
    }
    showQuickPick(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, step, totalSteps, items, selectedItems, placeholder, canSelectMany, buttons, shouldResume }) {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode.window.createQuickPick();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.placeholder = placeholder;
                    input.items = items;
                    if (canSelectMany) {
                        input.canSelectMany = canSelectMany;
                    }
                    if (selectedItems) {
                        input.selectedItems = selectedItems;
                    }
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    input.ignoreFocusOut = true;
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => {
                        resolve(input.selectedItems);
                    }), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
    showInputBox(_a) {
        return __awaiter(this, arguments, void 0, function* ({ title, step, totalSteps, value, prompt, validate, password, buttons, shouldResume }) {
            const disposables = [];
            try {
                return yield new Promise((resolve, reject) => {
                    const input = vscode.window.createInputBox();
                    input.title = title;
                    input.step = step;
                    input.totalSteps = totalSteps;
                    input.value = value || '';
                    input.prompt = prompt;
                    if (password) {
                        input.password = password;
                    }
                    input.buttons = [
                        ...(this.steps.length > 1 ? [vscode.QuickInputButtons.Back] : []),
                        ...(buttons || [])
                    ];
                    input.ignoreFocusOut = true;
                    // let validating = validate('');
                    disposables.push(input.onDidTriggerButton(item => {
                        if (item === vscode.QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        }
                        else {
                            resolve(item);
                        }
                    }), input.onDidAccept(() => __awaiter(this, void 0, void 0, function* () {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        const validationMessage = yield validate(value);
                        if (validationMessage) {
                            input.validationMessage = validationMessage;
                        }
                        else {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    })), input.onDidHide(() => {
                        (() => __awaiter(this, void 0, void 0, function* () {
                            reject(shouldResume && (yield shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        }))()
                            .catch(reject);
                    }));
                    if (this.current) {
                        this.current.dispose();
                    }
                    this.current = input;
                    this.current.show();
                });
            }
            finally {
                disposables.forEach(d => d.dispose());
            }
        });
    }
}
exports.MultiStepInput = MultiStepInput;
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(localiser_1.l10n.value("jdk.extension.utils.error_message.failedHttpsRequest", {
                    url,
                    statusCode: res.statusCode
                })));
            }
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}
function downloadFileWithProgressBar(downloadUrl, downloadLocation, message) {
    return vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, cancellable: false }, p => {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(downloadLocation);
            https.get(downloadUrl, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(localiser_1.l10n.value("jdk.extension.utils.error_message.failedHttpsRequest", {
                        url: downloadUrl,
                        statusCode: response.statusCode
                    })));
                }
                const totalSize = parseInt(response.headers['content-length'] || '0');
                let downloadedSize = 0;
                response.pipe(file);
                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    if (totalSize) {
                        const increment = parseFloat(((chunk.length / totalSize) * 100).toFixed(2));
                        const progress = parseFloat(((downloadedSize / totalSize) * 100).toFixed(2));
                        p.report({ increment, message: `${message}: ${progress} %` });
                    }
                });
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(downloadLocation, () => reject(err));
            });
        });
    });
}
const calculateChecksum = (filePath_1, ...args_1) => __awaiter(void 0, [filePath_1, ...args_1], void 0, function* (filePath, algorithm = 'sha256') {
    const hash = crypto.createHash(algorithm);
    const pipeline = (0, util_1.promisify)(require('stream').pipeline);
    const readStream = fs.createReadStream(filePath);
    yield pipeline(readStream, hash);
    const checksum = hash.digest('hex');
    return checksum;
});
exports.calculateChecksum = calculateChecksum;
const appendPrefixToCommand = (command) => `${constants_1.extConstants.COMMAND_PREFIX}.${command}`;
exports.appendPrefixToCommand = appendPrefixToCommand;
function isString(obj) {
    return typeof obj === 'string';
}
function isError(obj) {
    return obj instanceof Error;
}
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
exports.isObject = isObject;
const hasSameKeys = (a, b) => {
    if (a == null || b == null)
        return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length)
        return false;
    const bSet = new Set(bKeys);
    return aKeys.every((k) => bSet.has(k));
};
exports.hasSameKeys = hasSameKeys;
function initializeRunConfiguration() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (vscode.workspace.name || vscode.workspace.workspaceFile) {
            const java = yield vscode.workspace.findFiles('**/*.java', '**/node_modules/**', 1);
            if ((java === null || java === void 0 ? void 0 : java.length) > 0) {
                return true;
            }
        }
        else {
            for (let doc of vscode.workspace.textDocuments) {
                if ((_a = doc.fileName) === null || _a === void 0 ? void 0 : _a.endsWith(".java")) {
                    return true;
                }
            }
        }
        return false;
    });
}
const isQuotes = (c) => {
    return c === "'" || c === '"';
};
const parseArguments = (input) => {
    const result = [];
    let current = "";
    if (input.search(/['"]/) < 0)
        return input.split(/\s+/);
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === " ") {
            result.push(current);
            current = "";
        }
        else if (isQuotes(char)) {
            const quoteType = char;
            current += char;
            i++;
            let f = true;
            while (i < input.length && f) {
                current += input[i];
                const isEscapingSomethingElse = (i > 1 && input[i - 1] == "\\" && input[i - 2] == "\\");
                if (input[i] === quoteType && input[i - 1] != "\\" && !isEscapingSomethingElse)
                    f = false;
                else
                    i++;
            }
        }
        else {
            current += char;
        }
    }
    if (current) {
        result.push(current);
    }
    return result;
};
exports.parseArguments = parseArguments;
var FileUtils;
(function (FileUtils) {
    const FILE_SCHEME = "file:";
    /**
     * Converts a given file system path or URI-like string into a {@link vscode.Uri} instance.
     *
     * This utility attempts to correctly handle both raw file paths and strings that may
     * already represent a valid file URI.
     *
     * ### Behavior
     * - If `treatAsUriIfPossible` is **true** and the input starts with the `"file:"` scheme:
     *   - Attempts to parse the input using `vscode.Uri.parse(path, true)`.
     *   - If parsing fails, logs the error and throws a generic error.
     * - Otherwise:
     *   - Treats the input as a standard file system path and returns `vscode.Uri.file(path)`.
     *
     * Any unexpected errors during URI creation are logged through the `LOGGER` and
     * rethrown as a generic error.
     *
     * @param {string} path - The input file system path or URI-like string.
     * @param {boolean} [treatAsUriIfPossible=false] - When `true`, attempts to parse the input as a URI
     * if it starts with the `"file:"` scheme before falling back to `vscode.Uri.file`.
     * @returns {vscode.Uri} The resulting {@link vscode.Uri} object.
     * @throws {Error} When both URI parsing and file wrapping fail.
     */
    FileUtils.toUri = (path, treatAsUriIfPossible = false) => {
        try {
            if (treatAsUriIfPossible && path.startsWith(FILE_SCHEME)) {
                return vscode.Uri.parse(path, true);
            }
            return vscode.Uri.file(path);
        }
        catch (err) {
            logger_1.LOGGER.log(`Error while parsing uri: ${isError(err) ? err.message : err}`);
            throw new Error("Error while parsing URI");
        }
    };
})(FileUtils || (exports.FileUtils = FileUtils = {}));
//# sourceMappingURL=utils.js.map