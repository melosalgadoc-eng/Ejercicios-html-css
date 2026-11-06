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
exports.ExecutionSummary = void 0;
class ExecutionSummary {
    constructor(executionOrder = null, success = false) {
        this.executionOrder = executionOrder;
        this.success = success;
    }
    static fromMetadata(meta, fallbackExecCount) {
        var _a;
        const order = (meta === null || meta === void 0 ? void 0 : meta.executionOrder) != null
            ? meta.executionOrder
            : fallbackExecCount !== null && fallbackExecCount !== void 0 ? fallbackExecCount : null;
        const success = (_a = meta === null || meta === void 0 ? void 0 : meta.success) !== null && _a !== void 0 ? _a : false;
        return new ExecutionSummary(order, success);
    }
    toJSON() {
        return {
            executionOrder: this.executionOrder,
            success: this.success,
        };
    }
}
exports.ExecutionSummary = ExecutionSummary;
//# sourceMappingURL=executionSummary.js.map