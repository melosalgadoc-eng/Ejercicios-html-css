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
exports.BaseEvent = void 0;
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
const logger_1 = require("../../logger");
const AnonymousIdManager_1 = require("../impl/AnonymousIdManager");
const cache_1 = require("../../cache");
const utils_1 = require("../utils");
class BaseEvent {
    constructor(NAME, ENDPOINT, data) {
        this.NAME = NAME;
        this.ENDPOINT = ENDPOINT;
        this.onSuccessPostEventCallback = () => __awaiter(this, void 0, void 0, function* () {
            logger_1.LOGGER.debug(`${this.NAME} sent successfully`);
        });
        this.onFailPostEventCallback = () => __awaiter(this, void 0, void 0, function* () {
            logger_1.LOGGER.debug(`${this.NAME} send failed`);
        });
        this.addEventToCache = () => {
            const dataString = JSON.stringify(this.getData);
            const calculatedHashVal = (0, utils_1.getHashCode)(dataString);
            cache_1.cacheServiceIndex.simpleCache.put(this.NAME, calculatedHashVal).then((isAdded) => {
                logger_1.LOGGER.debug(`${this.NAME} added in cache ${isAdded ? "Successfully" : "Unsucessfully"}`);
            });
        };
        this._data = data;
        this._payload = Object.assign({ vsCodeId: AnonymousIdManager_1.AnonymousIdManager.machineId, vscSessionId: AnonymousIdManager_1.AnonymousIdManager.sessionId }, data);
    }
    get getPayload() {
        return this._payload;
    }
    get getData() {
        return this._data;
    }
}
exports.BaseEvent = BaseEvent;
_a = BaseEvent;
BaseEvent.blockedValues = (0, utils_1.getValuesToBeTransformed)();
BaseEvent.transformEvent = (propertiesToTransform, payload) => {
    const replacedValue = "_REM_";
    return (0, utils_1.transformValue)(null, _a.blockedValues, propertiesToTransform, replacedValue, payload);
};
//# sourceMappingURL=baseEvent.js.map