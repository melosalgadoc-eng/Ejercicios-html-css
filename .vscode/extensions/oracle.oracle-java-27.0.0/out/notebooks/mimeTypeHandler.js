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
exports.MimeTypeHandler = void 0;
const buffer_1 = require("buffer");
const vscode = require("vscode");
const constants_1 = require("./constants");
const localiser_1 = require("../localiser");
class MimeTypeHandler {
    constructor(value) {
        this.value = value;
    }
    get isText() {
        return this.value === constants_1.mimeTypes.TEXT;
    }
    get isImage() {
        return this.value.startsWith('image/');
    }
    static toBytes(data) {
        if (typeof data === 'string') {
            return buffer_1.Buffer.from(data, 'base64');
        }
        return data;
    }
    static toString(data) {
        if (typeof data === 'string') {
            return data;
        }
        return new TextDecoder().decode(data);
    }
    makeOutputItem(data) {
        if (this.isImage) {
            const bytes = MimeTypeHandler.toBytes(data);
            return new vscode.NotebookCellOutputItem(bytes, this.value);
        }
        const text = MimeTypeHandler.toString(data);
        return vscode.NotebookCellOutputItem.text(text, this.value);
    }
    static itemsFromBundle(bundle) {
        return Object.entries(bundle).flatMap(([mime, data]) => {
            const mt = new MimeTypeHandler(mime);
            if (mt.isText || mt.isImage) {
                const payload = Array.isArray(data) ? data.join('') : data;
                return [mt.makeOutputItem(payload)];
            }
            return vscode.NotebookCellOutputItem.text(localiser_1.l10n.value("jdk.notebook.mime_type.not.found.cell.output", { mimeType: mime, contentLength: data.length }));
        });
    }
}
exports.MimeTypeHandler = MimeTypeHandler;
//# sourceMappingURL=mimeTypeHandler.js.map