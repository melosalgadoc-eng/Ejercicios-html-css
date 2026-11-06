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
exports.notebookSerializer = void 0;
const vscode = require("vscode");
const utils_1 = require("./utils");
const notebook_1 = require("./notebook");
const logger_1 = require("../logger");
const localiser_1 = require("../localiser");
const utils_2 = require("../utils");
class IJNBNotebookSerializer {
    constructor() {
        this.decoder = new TextDecoder();
    }
    deserializeNotebook(content, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const raw = this.decoder.decode(content).trim();
            if (!raw) {
                return (0, utils_1.errorNotebook)(localiser_1.l10n.value("jdk.notebook.parsing.empty.file.error_msg.title"), localiser_1.l10n.value("jdk.notebook.parsing.empty.file.error_msg.desc"));
            }
            let parsed;
            try {
                parsed = JSON.parse(raw);
                notebook_1.Notebook.assertValidNotebookJson(parsed);
            }
            catch (err) {
                logger_1.LOGGER.error('Failed to parse notebook content: ' + err);
                vscode.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.parsing.error_msg.title"));
                return (0, utils_1.errorNotebook)(localiser_1.l10n.value("jdk.notebook.parsing.error_msg.title"), localiser_1.l10n.value("jdk.notebook.parsing.error_msg.desc", { message: err }));
            }
            if (!parsed || !Array.isArray(parsed.cells)) {
                return (0, utils_1.errorNotebook)(localiser_1.l10n.value("jdk.notebook.parsing.invalid.structure.error_msg.title"), localiser_1.l10n.value("jdk.notebook.parsing.invalid.structure.error_msg.desc"));
            }
            let cells;
            try {
                cells = parsed.cells.map((cell) => (0, utils_1.parseCell)(cell));
            }
            catch (cellError) {
                return (0, utils_1.errorNotebook)(localiser_1.l10n.value("jdk.notebook.cell.parsing.error_msg.title"), cellError.message);
            }
            return new vscode.NotebookData(cells);
        });
    }
    serializeNotebook(data, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notebook = notebook_1.Notebook.fromNotebookData(data, 'java');
                notebook.assertValidNotebook();
                return notebook.toUint8Array();
            }
            catch (err) {
                logger_1.LOGGER.error('Unhandled error in serializeNotebook: ' + err);
                const errorMessage = (0, utils_2.isError)(err) ? err.message : err;
                vscode.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.serializer.error_msg", { errorMessage }));
                throw err;
            }
        });
    }
}
exports.notebookSerializer = new IJNBNotebookSerializer();
//# sourceMappingURL=serializer.js.map