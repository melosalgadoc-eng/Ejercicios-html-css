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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notebook = exports.NotebookVersionInfo = void 0;
const utils_1 = require("./utils");
const ajv_1 = require("ajv");
const schema = require("./nbformat.v4.d7.schema.json");
const logger_1 = require("../logger");
const localiser_1 = require("../localiser");
class NotebookVersionInfo {
}
exports.NotebookVersionInfo = NotebookVersionInfo;
NotebookVersionInfo.NBFORMAT = 4;
NotebookVersionInfo.NBFORMAT_MINOR = 5;
class Notebook {
    constructor(cells, language = 'java') {
        this.nbformat = NotebookVersionInfo.NBFORMAT;
        this.nbformat_minor = NotebookVersionInfo.NBFORMAT_MINOR;
        this.metadata = { language_info: { name: language } };
        this.cells = cells;
    }
    static fromNotebookData(data, language = 'java') {
        const cells = data.cells.map((cell) => {
            try {
                return (0, utils_1.serializeCell)(cell);
            }
            catch (cellError) {
                logger_1.LOGGER.error('Error serializing cell: ' + cell + cellError);
                throw new Error(localiser_1.l10n.value("jdk.notebook.cell.serializer.error_msg"));
            }
        });
        return new _a(cells, language);
    }
    toJSON() {
        return {
            nbformat: this.nbformat,
            nbformat_minor: this.nbformat_minor,
            metadata: this.metadata,
            cells: this.cells,
        };
    }
    toUint8Array() {
        const json = JSON.stringify(this.toJSON(), null, 2);
        return new TextEncoder().encode(json);
    }
    assertValidNotebook() {
        _a.assertValidNotebookJson(this.toJSON());
    }
    static assertValidNotebookJson(notebook) {
        if (!_a.validateFn(notebook)) {
            const errors = (_a.validateFn.errors || [])
                .map(e => `${e.schemaPath || '/'} ${e.message}`)
                .join('\n');
            logger_1.LOGGER.error(`Notebook JSON validation failed:\n${errors}`);
            throw new Error(localiser_1.l10n.value("jdk.notebook.validation.failed.error_msg"));
        }
        if (!_a.isSupportedNotebookVersion(notebook)) {
            logger_1.LOGGER.error(`Notebook version validation failed: unsupported notebook version ${notebook.nbformat}.${notebook.nbformat_minor}.`);
            throw new Error(localiser_1.l10n.value("jdk.notebook.validation.notebook_version.failed.error_msg", { majorVersion: NotebookVersionInfo.NBFORMAT, minorVersion: NotebookVersionInfo.NBFORMAT_MINOR }));
        }
        logger_1.LOGGER.debug("Notebook successfully validated.");
    }
    static isSupportedNotebookVersion(notebook) {
        return notebook.nbformat > NotebookVersionInfo.NBFORMAT ||
            (notebook.nbformat === NotebookVersionInfo.NBFORMAT &&
                notebook.nbformat_minor >= NotebookVersionInfo.NBFORMAT_MINOR);
    }
}
exports.Notebook = Notebook;
_a = Notebook;
Notebook.ajv = new ajv_1.default({
    allErrors: true,
    strict: false
});
Notebook.validateFn = _a.ajv.compile(schema);
//# sourceMappingURL=notebook.js.map