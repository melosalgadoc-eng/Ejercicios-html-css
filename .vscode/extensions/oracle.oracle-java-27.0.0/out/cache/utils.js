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
exports.removeEntriesOnOverflow = void 0;
const logger_1 = require("../logger");
const removeEntriesOnOverflow = (globalCache, type, comparator) => __awaiter(void 0, void 0, void 0, function* () {
    const allKeys = globalCache.keys();
    const entries = [];
    for (const key of allKeys) {
        const value = globalCache.get(key);
        if ((value === null || value === void 0 ? void 0 : value.type) === type) {
            entries.push(Object.assign({ key }, value));
        }
    }
    const half = Math.floor(entries.length / 2);
    entries.sort(comparator);
    const toEvict = entries.slice(0, half);
    logger_1.LOGGER.debug(toEvict.toString());
    const toEvictPromises = [];
    for (const entry of toEvict) {
        toEvictPromises.push(Promise.resolve(globalCache.update(entry.key, undefined)));
    }
    yield Promise.allSettled(toEvictPromises);
    logger_1.LOGGER.debug(`Evicted ${toEvict.length} least-used cache keys due to overflow.`);
});
exports.removeEntriesOnOverflow = removeEntriesOnOverflow;
//# sourceMappingURL=utils.js.map