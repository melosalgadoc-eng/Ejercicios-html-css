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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorOutputItem = exports.createErrorOutput = void 0;
exports.base64ToUint8Array = base64ToUint8Array;
exports.uint8ArrayToBase64 = uint8ArrayToBase64;
exports.parseCell = parseCell;
exports.parseOutput = parseOutput;
exports.serializeCell = serializeCell;
exports.errorNotebook = errorNotebook;
const buffer_1 = require("buffer");
const vscode = require("vscode");
const crypto_1 = require("crypto");
const utils_1 = require("../utils");
const constants_1 = require("./constants");
const mimeTypeHandler_1 = require("./mimeTypeHandler");
const executionSummary_1 = require("./executionSummary");
const logger_1 = require("../logger");
const localiser_1 = require("../localiser");
function base64ToUint8Array(base64) {
    if (typeof buffer_1.Buffer !== 'undefined' && typeof buffer_1.Buffer.from === 'function') {
        return buffer_1.Buffer.from(base64, 'base64');
    }
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
function uint8ArrayToBase64(data) {
    if (typeof buffer_1.Buffer !== 'undefined' && typeof buffer_1.Buffer.from === 'function') {
        return buffer_1.Buffer.from(data).toString('base64');
    }
    let binary = '';
    data.forEach((byte) => (binary += String.fromCharCode(byte)));
    return btoa(binary);
}
const createErrorOutput = (err) => {
    return new vscode.NotebookCellOutput([(0, exports.createErrorOutputItem)(err)]);
};
exports.createErrorOutput = createErrorOutput;
const createErrorOutputItem = (err) => {
    return vscode.NotebookCellOutputItem.text((0, utils_1.isString)(err) ? err : err.message);
};
exports.createErrorOutputItem = createErrorOutputItem;
function parseCell(cell) {
    var _a, _b;
    if (cell.cell_type !== 'code' && cell.cell_type !== 'markdown')
        throw new Error(localiser_1.l10n.value("jdk.notebook.cell.type.error_msg", { cellType: cell.cell_type }));
    if (cell.source === undefined || cell.source === null)
        throw new Error(localiser_1.l10n.value("jdk.notebook.cell.missing.error_msg", { fieldName: "cell.source" }));
    const kind = cell.cell_type === 'code' ? vscode.NotebookCellKind.Code : vscode.NotebookCellKind.Markup;
    const language = kind === vscode.NotebookCellKind.Code ? 'java' : 'markdown';
    const value = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source);
    const cellData = new vscode.NotebookCellData(kind, value, language);
    cellData.metadata = Object.assign({ id: cell.id }, cell.metadata);
    if (cell.cell_type === 'code') {
        const execSummary = executionSummary_1.ExecutionSummary.fromMetadata(cell.metadata.executionSummary, (_a = cell.execution_count) !== null && _a !== void 0 ? _a : null);
        if (execSummary.executionOrder) {
            cellData.executionSummary = {
                executionOrder: (_b = execSummary.executionOrder) !== null && _b !== void 0 ? _b : undefined,
                success: execSummary.success,
            };
        }
        if (Array.isArray(cell.outputs)) {
            const outputs = cell.outputs.flatMap((out) => {
                const parsed = parseOutput(out);
                if (!parsed) {
                    throw new Error(`Unrecognized output format: ${JSON.stringify(out)}`);
                }
                return parsed;
            });
            if (outputs.length) {
                cellData.outputs = outputs;
            }
        }
    }
    if (cell.id)
        logger_1.LOGGER.debug(`${cell.id.slice(0, 5)} Successfully parsed`);
    return cellData;
}
function parseOutput(raw) {
    var _a, _b, _c;
    const outputs = [];
    switch (raw.output_type) {
        case 'stream':
            outputs.push(new vscode.NotebookCellOutput([
                new mimeTypeHandler_1.MimeTypeHandler(constants_1.mimeTypes.TEXT).makeOutputItem(Array.isArray(raw.text) ? raw.text.join('') : raw.text),
            ]));
            break;
        case 'error':
            outputs.push(new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error({
                    name: (_a = raw.ename) !== null && _a !== void 0 ? _a : 'Error',
                    message: (_b = raw.evalue) !== null && _b !== void 0 ? _b : '',
                    stack: Array.isArray(raw.traceback) ? raw.traceback.join('\n') : undefined,
                }),
            ]));
            break;
        case 'display_data':
        case 'execute_result':
            const bundle = (_c = raw.data) !== null && _c !== void 0 ? _c : {};
            const items = mimeTypeHandler_1.MimeTypeHandler.itemsFromBundle(bundle);
            if (items.length) {
                outputs.push(new vscode.NotebookCellOutput(items, raw.metadata));
            }
            break;
    }
    return outputs;
}
function serializeCell(cell) {
    var _a, _b;
    const baseMeta = cell.metadata || {};
    const id = baseMeta.id || (0, crypto_1.randomUUID)();
    if (cell.kind === vscode.NotebookCellKind.Code) {
        const exec = (_a = cell.executionSummary) !== null && _a !== void 0 ? _a : {};
        const executionCount = (_b = exec.executionOrder) !== null && _b !== void 0 ? _b : null;
        const success = exec.success;
        const execSummary = new executionSummary_1.ExecutionSummary(executionCount, success);
        const metadata = executionCount ? Object.assign(Object.assign({}, baseMeta), { executionSummary: execSummary.toJSON() }) : {};
        const outputs = (cell.outputs || []).map((output) => {
            var _a;
            const data = {};
            const outMetadata = (_a = output.metadata) !== null && _a !== void 0 ? _a : {};
            for (const item of output.items) {
                if (item.mime === constants_1.mimeTypes.TEXT) {
                    data[constants_1.mimeTypes.TEXT] = buffer_1.Buffer.from(item.data).toString();
                }
                else {
                    data[item.mime] = uint8ArrayToBase64(item.data);
                }
            }
            const execOut = {
                output_type: 'execute_result',
                data,
                metadata: outMetadata,
                execution_count: executionCount,
            };
            return execOut;
        });
        const codeCell = {
            id,
            cell_type: 'code',
            source: cell.value,
            metadata: Object.assign({ language: cell.languageId }, metadata),
            execution_count: executionCount,
            outputs,
        };
        if (codeCell.id)
            logger_1.LOGGER.debug(`${codeCell.id.slice(0, 5)} Successfully serialized code cell`);
        return codeCell;
    }
    const mdCell = {
        id,
        cell_type: 'markdown',
        source: cell.value,
        metadata: Object.assign({ language: cell.languageId, id }, cell.metadata),
    };
    return mdCell;
}
function errorNotebook(title, message, consoleMessage = '') {
    logger_1.LOGGER.error(title + ': ' + message + ': ' + consoleMessage);
    return new vscode.NotebookData([
        new vscode.NotebookCellData(vscode.NotebookCellKind.Markup, `# ${title}\n\n${message}`, 'markdown'),
    ]);
}
//# sourceMappingURL=utils.js.map