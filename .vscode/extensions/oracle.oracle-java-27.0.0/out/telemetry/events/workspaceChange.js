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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceChangeEvent = void 0;
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
const crypto_1 = require("crypto");
const logger_1 = require("../../logger");
const telemetry_1 = require("../telemetry");
const baseEvent_1 = require("./baseEvent");
const cache_1 = require("../../cache");
const projectCacheValue_1 = require("../../cache/projectCacheValue");
let workspaceChangeEventTimeout = null;
class WorkspaceChangeEvent extends baseEvent_1.BaseEvent {
    constructor(payload) {
        const updatedPayload = WorkspaceChangeEvent.transformPayload(payload);
        super(WorkspaceChangeEvent.NAME, WorkspaceChangeEvent.ENDPOINT, updatedPayload);
        this.onSuccessPostEventCallback = () => __awaiter(this, void 0, void 0, function* () {
            logger_1.LOGGER.debug(`WorkspaceChange event sent successfully`);
            if (workspaceChangeEventTimeout != null) {
                clearTimeout(workspaceChangeEventTimeout);
                workspaceChangeEventTimeout = null;
            }
            workspaceChangeEventTimeout = setTimeout(() => telemetry_1.Telemetry.sendTelemetry(this), 60 * 60 * 24 * 1000);
        });
    }
}
exports.WorkspaceChangeEvent = WorkspaceChangeEvent;
WorkspaceChangeEvent.NAME = "workspaceChange";
WorkspaceChangeEvent.ENDPOINT = "/workspaceChange";
WorkspaceChangeEvent.propertiesToTransform = ['javaVersion'];
WorkspaceChangeEvent.transformPayload = (payload) => {
    const transformedPayload = baseEvent_1.BaseEvent.transformEvent(WorkspaceChangeEvent.propertiesToTransform, payload);
    return WorkspaceChangeEvent.updateProjectId(transformedPayload);
};
WorkspaceChangeEvent.updateProjectId = (payload) => {
    const updatedProjectInfo = payload.projectInfo.map(project => {
        const existingId = cache_1.cacheServiceIndex.projectCache.get(project.id);
        const uniqueId = existingId !== null && existingId !== void 0 ? existingId : (0, crypto_1.randomUUID)();
        if (!existingId) {
            // Cannot be awaited because the caller is constructor and it cannot be a async call
            cache_1.cacheServiceIndex.projectCache.put(project.id, new projectCacheValue_1.ProjectCacheValue(uniqueId));
        }
        return Object.assign(Object.assign({}, project), { id: uniqueId });
    });
    return Object.assign(Object.assign({}, payload), { projectInfo: updatedProjectInfo });
};
//# sourceMappingURL=workspaceChange.js.map