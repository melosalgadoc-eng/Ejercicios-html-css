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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionStartEvent = void 0;
/*
  Copyright (c) 2024-2026, Oracle and/or its affiliates.

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
const globalState_1 = require("../../globalState");
const logger_1 = require("../../logger");
const cache_1 = require("../../cache");
const enviromentDetails_1 = require("../impl/enviromentDetails");
const utils_1 = require("../utils");
const baseEvent_1 = require("./baseEvent");
class ExtensionStartEvent extends baseEvent_1.BaseEvent {
    constructor(payload) {
        const updatedPayload = baseEvent_1.BaseEvent.transformEvent(_a.propertiesToTransform, payload);
        super(_a.NAME, _a.ENDPOINT, updatedPayload);
        this.onSuccessPostEventCallback = () => __awaiter(this, void 0, void 0, function* () {
            logger_1.LOGGER.debug(`Start event sent successfully`);
            this.addEventToCache();
        });
    }
}
exports.ExtensionStartEvent = ExtensionStartEvent;
_a = ExtensionStartEvent;
ExtensionStartEvent.NAME = "startup";
ExtensionStartEvent.ENDPOINT = "/start";
ExtensionStartEvent.propertiesToTransform = ['osVersion'];
ExtensionStartEvent.builder = () => {
    const startEventData = (0, enviromentDetails_1.getEnvironmentInfo)(globalState_1.globalState.getExtensionContextInfo());
    const cachedValue = cache_1.cacheServiceIndex.simpleCache.get(_a.NAME);
    const envString = JSON.stringify(startEventData);
    const newValue = (0, utils_1.getHashCode)(envString);
    if (cachedValue != newValue) {
        const startEvent = new _a(startEventData);
        return startEvent;
    }
    logger_1.LOGGER.debug(`No change in start event`);
    return null;
};
//# sourceMappingURL=start.js.map