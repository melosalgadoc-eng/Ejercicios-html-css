"use strict";
/*
  Copyright (c) 2026, Oracle and/or its affiliates.

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSettingsTrustCacheValue = void 0;
const BaseCacheValue_1 = require("./BaseCacheValue");
class WorkspaceSettingsTrustCacheValue extends BaseCacheValue_1.BaseCacheValue {
    constructor(payload, lastUsed) {
        super(WorkspaceSettingsTrustCacheValue.type, payload, lastUsed);
    }
    static fromObject(obj) {
        if (obj.type !== WorkspaceSettingsTrustCacheValue.type) {
            throw new Error(`Invalid object type for WorkspaceSettingsTrustCacheEntry: received ${obj.type}`);
        }
        return new WorkspaceSettingsTrustCacheValue(obj.payload, obj.lastUsed);
    }
}
exports.WorkspaceSettingsTrustCacheValue = WorkspaceSettingsTrustCacheValue;
WorkspaceSettingsTrustCacheValue.type = "workspaceSettingsTrustDecision";
//# sourceMappingURL=workspaceSettingsTrustCacheValue.js.map