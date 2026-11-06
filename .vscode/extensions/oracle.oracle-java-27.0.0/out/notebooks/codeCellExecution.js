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
exports.CodeCellExecution = void 0;
const vscode_1 = require("vscode");
const logger_1 = require("../logger");
const utils_1 = require("./utils");
const commands_1 = require("../commands/commands");
const constants_1 = require("./constants");
const mimeTypeHandler_1 = require("./mimeTypeHandler");
class CodeCellExecution {
    constructor(controllerId, notebookId, cell) {
        this.controllerId = controllerId;
        this.notebookId = notebookId;
        this.cell = cell;
        this.isExecutionStarted = false;
        this.mimeMap = new Map();
        this.output = new vscode_1.NotebookCellOutput([]);
        this.isError = false;
        this.queued = (controller) => __awaiter(this, void 0, void 0, function* () {
            if (!controller) {
                logger_1.LOGGER.warn(`Received undefined controller ${this.getCellId()}`);
                return;
            }
            logger_1.LOGGER.debug(`${this.getCellId()} queued for execution`);
            this.controller = controller;
        });
        this.executing = (out, err, diagnostics, errorDiagnostics, metadata, executionOrder) => __awaiter(this, void 0, void 0, function* () {
            if (!this.isExecutionStarted) {
                this.handleExecutionStart(executionOrder);
            }
            if (!this.execution) {
                return;
            }
            if (out) {
                const { data, mimeType } = out;
                const newData = new TextDecoder().decode(Uint8Array.from(data));
                this.handleOutput(newData, mimeType);
            }
            if (err) {
                this.isError = true;
                const { data } = err;
                const newData = new TextDecoder().decode(Uint8Array.from(data));
                this.handleOutput(newData, constants_1.mimeTypes.ERROR, true);
            }
            if (diagnostics) {
                diagnostics.forEach(diag => {
                    this.handleOutput(diag + "\n", constants_1.mimeTypes.TEXT);
                });
            }
            if (errorDiagnostics) {
                this.isError = true;
                errorDiagnostics.forEach(diag => {
                    this.handleOutput(diag + "\n", constants_1.mimeTypes.ERROR, true);
                });
            }
        });
        this.handleOutput = (data_1, mimeType_1, ...args_1) => __awaiter(this, [data_1, mimeType_1, ...args_1], void 0, function* (data, mimeType, isError = false) {
            var _a;
            const oldData = (_a = this.mimeMap.get(mimeType)) !== null && _a !== void 0 ? _a : "";
            const updatedData = oldData + data;
            this.mimeMap.set(mimeType, updatedData);
            if (isError) {
                yield this.execution.replaceOutputItems((0, utils_1.createErrorOutputItem)(updatedData), this.output);
            }
            else {
                yield this.execution.replaceOutputItems(new mimeTypeHandler_1.MimeTypeHandler(mimeType).makeOutputItem(updatedData), this.output);
            }
        });
        this.executionCompleted = (status) => {
            const finalExecStatus = status && !this.isError;
            if (this.isExecutionStarted) {
                status && !this.isError ?
                    logger_1.LOGGER.debug(`${this.getCellId()} successfully executed`)
                    :
                        logger_1.LOGGER.error(`${this.getCellId()} failed while executing`);
                this.execution.end(finalExecStatus, Date.now());
            }
        };
        this.executionInterrupted = () => {
            if (this.isExecutionStarted) {
                logger_1.LOGGER.log(`${this.getCellId()} interrupted while executing`);
                this.execution.end(false, Date.now());
            }
        };
        this.handleExecutionStart = (executionOrder) => __awaiter(this, void 0, void 0, function* () {
            if (this.controller) {
                this.execution = this.controller.createNotebookCellExecution(this.cell);
                this.isExecutionStarted = true;
                this.execution.start(Date.now());
                this.execution.executionOrder = executionOrder;
                this.execution.clearOutput();
                yield this.execution.replaceOutput(this.output);
                this.execution.token.onCancellationRequested(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield vscode_1.commands.executeCommand(commands_1.nbCommands.interruptNotebookCellExecution, this.notebookId);
                    }
                    catch (error) {
                        logger_1.LOGGER.error("Some Error occurred while interrupting code cell: " + error);
                        vscode_1.window.showErrorMessage("Cannot interrupt code cell");
                    }
                }));
                return;
            }
            logger_1.LOGGER.warn(`Controller for cell is not created yet ${this.getCellId()}`);
        });
        this.getCellId = () => this.cell.document.uri.toString();
        this.getControllerId = () => this.controllerId;
        this.getNotebookId = () => this.notebookId;
    }
}
exports.CodeCellExecution = CodeCellExecution;
//# sourceMappingURL=codeCellExecution.js.map