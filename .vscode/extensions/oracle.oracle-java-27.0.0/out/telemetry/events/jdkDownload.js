"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JdkDownloadEvent = void 0;
/*
  Copyright (c) 2024-2025, Oracle and/or its affiliates.

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
const baseEvent_1 = require("./baseEvent");
class JdkDownloadEvent extends baseEvent_1.BaseEvent {
    constructor(payload) {
        super(JdkDownloadEvent.NAME, JdkDownloadEvent.ENDPOINT, payload);
    }
}
exports.JdkDownloadEvent = JdkDownloadEvent;
JdkDownloadEvent.NAME = "jdkDownload";
JdkDownloadEvent.ENDPOINT = "/jdkDownload";
//# sourceMappingURL=jdkDownload.js.map