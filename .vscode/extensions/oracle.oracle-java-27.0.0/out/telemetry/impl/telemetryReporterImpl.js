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
exports.TelemetryReporterImpl = void 0;
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
const logger_1 = require("../../logger");
const utils_2 = require("../../utils");
const close_1 = require("../events/close");
const start_1 = require("../events/start");
const jdkFeature_1 = require("../events/jdkFeature");
const postTelemetry_1 = require("./postTelemetry");
class TelemetryReporterImpl {
    constructor(queue, retryManager) {
        this.queue = queue;
        this.retryManager = retryManager;
        this.activationTime = (0, utils_1.getCurrentUTCDateInSeconds)();
        this.postTelemetry = new postTelemetry_1.PostTelemetry();
        this.onCloseEventState = { status: false, numOfRetries: 0 };
        this.MAX_RETRY_ON_CLOSE = 5;
        this.startEvent = () => {
            this.setOnCloseEventState();
            this.retryManager.startTimer();
            const extensionStartEvent = start_1.ExtensionStartEvent.builder();
            if (extensionStartEvent != null) {
                this.addEventToQueue(extensionStartEvent);
                logger_1.LOGGER.debug(`Start event enqueued: ${extensionStartEvent.getPayload}`);
            }
        };
        this.closeEvent = () => {
            const extensionCloseEvent = close_1.ExtensionCloseEvent.builder(this.activationTime);
            this.addEventToQueue(extensionCloseEvent);
            logger_1.LOGGER.debug(`Close event enqueued: ${extensionCloseEvent.getPayload}`);
            this.sendEvents();
        };
        this.addEventToQueue = (event) => {
            this.setOnCloseEventState(event);
            this.queue.enqueue(event);
            if (this.retryManager.isQueueOverflow(this.queue.size())) {
                logger_1.LOGGER.debug(`Send triggered to queue size overflow`);
                const numOfEventsToBeRetained = this.retryManager.getNumberOfEventsToBeRetained();
                this.sendEvents();
                if (numOfEventsToBeRetained !== -1) {
                    this.queue.adjustQueueSize(numOfEventsToBeRetained);
                }
            }
        };
        this.setOnCloseEventState = (event) => {
            if ((event === null || event === void 0 ? void 0 : event.NAME) === close_1.ExtensionCloseEvent.NAME) {
                this.onCloseEventState = {
                    status: true,
                    numOfRetries: 0
                };
            }
            else {
                this.onCloseEventState = {
                    status: false,
                    numOfRetries: 0
                };
            }
        };
        this.increaseRetryCountOrDisableRetry = () => {
            if (!this.onCloseEventState.status)
                return;
            const queueEmpty = this.queue.size() === 0;
            const retriesExceeded = this.onCloseEventState.numOfRetries >= this.MAX_RETRY_ON_CLOSE;
            if (queueEmpty || retriesExceeded) {
                logger_1.LOGGER.debug(`Telemetry disabled state: ${queueEmpty ? 'Queue is empty' : 'Max retries reached'}, clearing timer`);
                this.retryManager.clearTimer();
                this.queue.flush();
                this.setOnCloseEventState();
            }
            else {
                logger_1.LOGGER.debug("Telemetry disabled state: Increasing retry count");
                this.onCloseEventState.numOfRetries++;
            }
        };
        this.sendEvents = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.queue.size()) {
                    logger_1.LOGGER.debug(`Queue is empty nothing to send`);
                    return;
                }
                const eventsCollected = this.queue.flush();
                logger_1.LOGGER.debug(`Number of events to send: ${eventsCollected.length}`);
                this.retryManager.clearTimer();
                const transformedEvents = this.transformEvents(eventsCollected);
                const response = yield this.postTelemetry.post(transformedEvents);
                logger_1.LOGGER.debug(`Number of events successfully sent: ${response.success.length}`);
                logger_1.LOGGER.debug(`Number of events failed to send: ${response.failures.length}`);
                const isAllEventsSuccess = this.handlePostTelemetryResponse(response);
                this.retryManager.startTimer(isAllEventsSuccess);
                this.increaseRetryCountOrDisableRetry();
            }
            catch (err) {
                logger_1.LOGGER.debug(`Error while sending telemetry: ${(0, utils_2.isError)(err) ? err.message : err}`);
            }
        });
        this.transformEvents = (events) => {
            const jdkFeatureEvents = events.filter(event => event.NAME === jdkFeature_1.JdkFeatureEvent.NAME);
            const concatedEvents = jdkFeature_1.JdkFeatureEvent.concatEvents(jdkFeatureEvents);
            const removedJdkFeatureEvents = events.filter(event => event.NAME !== jdkFeature_1.JdkFeatureEvent.NAME);
            return [...removedJdkFeatureEvents, ...concatedEvents];
        };
        this.handlePostTelemetryResponse = (response) => {
            const eventsToBeEnqueued = this.retryManager.eventsToBeEnqueuedAgain(response);
            this.queue.concatQueue(eventsToBeEnqueued);
            logger_1.LOGGER.debug(`Number of failed events enqueuing again: ${eventsToBeEnqueued.length}`);
            return eventsToBeEnqueued.length === 0;
        };
        this.retryManager.registerCallbackHandler(this.sendEvents);
    }
}
exports.TelemetryReporterImpl = TelemetryReporterImpl;
//# sourceMappingURL=telemetryReporterImpl.js.map