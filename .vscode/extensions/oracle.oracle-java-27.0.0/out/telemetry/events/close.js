"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionCloseEvent = void 0;
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
const utils_1 = require("../utils");
const baseEvent_1 = require("./baseEvent");
class ExtensionCloseEvent extends baseEvent_1.BaseEvent {
    constructor(payload) {
        super(ExtensionCloseEvent.NAME, ExtensionCloseEvent.ENDPOINT, payload);
    }
}
exports.ExtensionCloseEvent = ExtensionCloseEvent;
ExtensionCloseEvent.NAME = "close";
ExtensionCloseEvent.ENDPOINT = "/close";
ExtensionCloseEvent.builder = (activationTime) => {
    const totalActiveSessionTimeInSeconds = (0, utils_1.getCurrentUTCDateInSeconds)() - activationTime;
    const closeEvent = new ExtensionCloseEvent({
        totalSessionTime: totalActiveSessionTimeInSeconds
    });
    return closeEvent;
};
//# sourceMappingURL=close.js.map