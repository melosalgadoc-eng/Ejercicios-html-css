"use strict";
/*
 * Copyright (c) 2025, Oracle and/or its affiliates.
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
exports.notebookKernel = exports.IJNBKernel = void 0;
const globalState_1 = require("../globalState");
const utils_1 = require("../commands/utils");
const commands_1 = require("../commands/commands");
const protocol_1 = require("../lsp/protocol");
const vscode_1 = require("vscode");
const localiser_1 = require("../localiser");
const constants_1 = require("./constants");
const logger_1 = require("../logger");
const codeCellExecution_1 = require("./codeCellExecution");
const utils_2 = require("../utils");
const mimeTypeHandler_1 = require("./mimeTypeHandler");
const utils_3 = require("./utils");
class IJNBKernel {
    constructor() {
        this.controllers = [];
        this.cellControllerIdMap = new Map();
        this.handleCodeCellExecution = (notebookId, cell, controller) => __awaiter(this, void 0, void 0, function* () {
            const cellId = cell.document.uri.toString();
            const sourceCode = cell.document.getText();
            const codeCellExecution = new codeCellExecution_1.CodeCellExecution(controller.id, notebookId, cell);
            this.getIncrementedExecutionCounter(notebookId);
            try {
                this.cellControllerIdMap.set(cellId, codeCellExecution);
                const client = yield globalState_1.globalState.getClientPromise().client;
                if (!(yield (0, utils_1.isNbCommandRegistered)(commands_1.nbCommands.executeNotebookCell))) {
                    throw localiser_1.l10n.value("jdk.extension.error_msg.doesntSupportNotebookCellExecution", { client: client === null || client === void 0 ? void 0 : client.name });
                }
                const response = yield vscode_1.commands.executeCommand(commands_1.nbCommands.executeNotebookCell, notebookId, cellId, sourceCode);
                if (!response) {
                    logger_1.LOGGER.error(`Some error occurred while cell execution: ${cellId}`);
                }
            }
            catch (error) {
                logger_1.LOGGER.error((0, utils_2.isError)(error) ? error.message : String(error));
            }
            finally {
                this.cellControllerIdMap.delete(cellId);
            }
        });
        this.handleCellExecutionNotification = (params) => __awaiter(this, void 0, void 0, function* () {
            const codeCellExecution = this.cellControllerIdMap.get(params.cellUri);
            if (!codeCellExecution) {
                logger_1.LOGGER.warn(`There is no code cell execution object created for ${params.cellUri}`);
                return;
            }
            switch (params.status) {
                case protocol_1.NotebookCellExecutionResult.STATUS.QUEUED:
                    const controller = this.controllers.find(el => el.id === codeCellExecution.getControllerId());
                    codeCellExecution.queued(controller);
                    break;
                case protocol_1.NotebookCellExecutionResult.STATUS.EXECUTING:
                    const { outputStream, errorStream, diagnostics, errorDiagnostics, metadata } = params;
                    yield codeCellExecution.executing(outputStream, errorStream, diagnostics, errorDiagnostics, metadata, this.getExecutionCounter(codeCellExecution.getNotebookId()));
                    break;
                case protocol_1.NotebookCellExecutionResult.STATUS.SUCCESS:
                    codeCellExecution.executionCompleted(true);
                    this.cellControllerIdMap.delete(params.cellUri);
                    break;
                case protocol_1.NotebookCellExecutionResult.STATUS.FAILURE:
                    codeCellExecution.executionCompleted(false);
                    this.cellControllerIdMap.delete(params.cellUri);
                    break;
                case protocol_1.NotebookCellExecutionResult.STATUS.INTERRUPTED:
                    codeCellExecution.executionInterrupted();
                    this.cellControllerIdMap.delete(params.cellUri);
                    break;
            }
        });
        this.handleUnkownLanguageTypeExecution = (notebookId, cell, controller) => __awaiter(this, void 0, void 0, function* () {
            const exec = controller.createNotebookCellExecution(cell);
            exec.executionOrder = this.getIncrementedExecutionCounter(notebookId);
            exec.start(Date.now());
            yield exec.replaceOutput((0, utils_3.createErrorOutput)(new Error(localiser_1.l10n.value("jdk.notebook.cell.language.not.found", { languageId: cell.document.languageId }))));
            exec.end(false, Date.now());
        });
        this.getIncrementedExecutionCounter = (notebookId) => {
            var _a;
            const next = ((_a = IJNBKernel.executionCounter.get(notebookId)) !== null && _a !== void 0 ? _a : 0) + 1;
            IJNBKernel.executionCounter.set(notebookId, next);
            return next;
        };
        this.getExecutionCounter = (notebookId) => {
            return IJNBKernel.executionCounter.get(notebookId);
        };
        this.handleMarkdownCellExecution = (notebookId, cell, controller) => __awaiter(this, void 0, void 0, function* () {
            const exec = controller.createNotebookCellExecution(cell);
            const mimeType = 'text/markdown';
            exec.executionOrder = this.getIncrementedExecutionCounter(notebookId);
            try {
                exec.start(Date.now());
                yield exec.replaceOutput([
                    new vscode_1.NotebookCellOutput([new mimeTypeHandler_1.MimeTypeHandler(mimeType).makeOutputItem(cell.document.getText())]),
                ]);
                exec.end(true, Date.now());
            }
            catch (error) {
                yield exec.replaceOutput((0, utils_3.createErrorOutput)(error));
                exec.end(false, Date.now());
            }
        });
        this.cleanUpKernel = vscode_1.workspace.onDidCloseNotebookDocument(doc => {
            if (doc.notebookType === constants_1.ijnbConstants.NOTEBOOK_TYPE || doc.notebookType === constants_1.ipynbConstants.NOTEBOOK_TYPE) {
                IJNBKernel.executionCounter.delete(doc.uri.toString());
            }
        });
        const custom = vscode_1.notebooks.createNotebookController(constants_1.ijnbConstants.KERNEL_ID, constants_1.ijnbConstants.NOTEBOOK_TYPE, constants_1.ijnbConstants.KERNEL_LABEL);
        const jupyter = vscode_1.notebooks.createNotebookController(constants_1.ipynbConstants.KERNEL_ID, constants_1.ipynbConstants.NOTEBOOK_TYPE, constants_1.ipynbConstants.KERNEL_LABEL);
        for (const ctr of [custom, jupyter]) {
            ctr.supportedLanguages = [constants_1.supportLanguages.JAVA, constants_1.supportLanguages.MARKDOWN];
            ctr.supportsExecutionOrder = true;
            ctr.executeHandler = this.executeCells.bind(this);
            this.controllers.push(ctr);
        }
    }
    dispose() {
        for (const ctr of this.controllers) {
            ctr.dispose();
        }
    }
    executeCells(cells, notebook, controller) {
        return __awaiter(this, void 0, void 0, function* () {
            const notebookId = notebook.uri.toString();
            for (const cell of cells) {
                if (cell.document.languageId === constants_1.supportLanguages.MARKDOWN) {
                    yield this.handleMarkdownCellExecution(notebookId, cell, controller);
                }
                else if (cell.document.languageId === constants_1.supportLanguages.JAVA) {
                    yield this.handleCodeCellExecution(notebookId, cell, controller);
                }
                else {
                    yield this.handleUnkownLanguageTypeExecution(notebookId, cell, controller);
                }
            }
        });
    }
    resetKernelCounter(notebookUri) {
        IJNBKernel.executionCounter.delete(notebookUri.toString());
    }
}
exports.IJNBKernel = IJNBKernel;
IJNBKernel.executionCounter = new Map();
exports.notebookKernel = new IJNBKernel();
//# sourceMappingURL=kernel.js.map