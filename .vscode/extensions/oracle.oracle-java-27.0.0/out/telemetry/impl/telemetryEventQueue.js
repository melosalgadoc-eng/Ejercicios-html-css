"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryEventQueue = void 0;
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
const logger_1 = require("../../logger");
class TelemetryEventQueue {
    constructor() {
        this.events = [];
        this.enqueue = (e) => {
            this.events.push(e);
        };
        this.dequeue = () => this.events.shift();
        this.concatQueue = (queue, mergeAtStarting = false) => {
            this.events = mergeAtStarting ? [...queue, ...this.events] : [...this.events, ...queue];
        };
        this.size = () => this.events.length;
        this.flush = () => {
            const queue = [...this.events];
            this.events = [];
            return queue;
        };
        this.adjustQueueSize = (maxNumOfEventsToRetain) => {
            const excess = this.size() - maxNumOfEventsToRetain;
            if (excess > 0) {
                logger_1.LOGGER.debug('Decreasing size of the queue as max capacity reached');
                const seen = new Set();
                const deduplicated = [];
                for (let i = 0; i < excess; i++) {
                    const event = this.events[i];
                    if (!seen.has(event.NAME)) {
                        deduplicated.push(event);
                        seen.add(event.NAME);
                    }
                }
                this.events = [...deduplicated, ...this.events.slice(excess)];
            }
        };
    }
}
exports.TelemetryEventQueue = TelemetryEventQueue;
//# sourceMappingURL=telemetryEventQueue.js.map