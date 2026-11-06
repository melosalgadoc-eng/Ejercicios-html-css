"use strict";
/*
  Copyright (c) 2025-2026, Oracle and/or its affiliates.

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
exports.BaseCacheValue = void 0;
class BaseCacheValue {
    constructor(type, payload, lastUsed) {
        this.type = type;
        this.payload = payload;
        this.lastUsed = lastUsed !== null && lastUsed !== void 0 ? lastUsed : Date.now();
    }
}
exports.BaseCacheValue = BaseCacheValue;
//# sourceMappingURL=BaseCacheValue.js.map