"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryRetry = void 0;
const logger_1 = require("../../logger");
const config_1 = require("../config");
class TelemetryRetry {
    constructor() {
        var _a, _b;
        this.TELEMETRY_RETRY_CONFIG = config_1.TelemetryConfiguration.getInstance().getRetryConfig();
        this.timePeriod = (_a = this.TELEMETRY_RETRY_CONFIG) === null || _a === void 0 ? void 0 : _a.baseTimer;
        this.numOfAttemptsWhenTimerHits = 1;
        this.queueCapacity = (_b = this.TELEMETRY_RETRY_CONFIG) === null || _b === void 0 ? void 0 : _b.baseCapacity;
        this.numOfAttemptsWhenQueueIsFull = 1;
        this.triggeredDueToQueueOverflow = false;
        this.registerCallbackHandler = (callbackHandler) => {
            this.callbackHandler = callbackHandler;
        };
        this.startTimer = (resetParameters = true) => {
            if (!this.callbackHandler) {
                logger_1.LOGGER.debug("Callback handler is not set for telemetry retry mechanism");
                return;
            }
            if (this.timeout) {
                logger_1.LOGGER.debug("Overriding current timeout");
            }
            if (resetParameters) {
                this.resetTimerParameters();
                this.resetQueueCapacity();
            }
            this.timeout = setInterval(this.callbackHandler, this.timePeriod);
        };
        this.resetTimerParameters = () => {
            logger_1.LOGGER.debug("Resetting time period to default");
            this.numOfAttemptsWhenTimerHits = 1;
            this.timePeriod = this.TELEMETRY_RETRY_CONFIG.baseTimer;
            this.clearTimer();
        };
        this.increaseTimePeriod = () => {
            if (this.numOfAttemptsWhenTimerHits < this.TELEMETRY_RETRY_CONFIG.maxRetries) {
                this.timePeriod = this.calculateDelay();
                this.numOfAttemptsWhenTimerHits++;
                return;
            }
            logger_1.LOGGER.debug("Keeping timer same as max capactiy reached");
        };
        this.clearTimer = () => {
            if (this.timeout) {
                clearInterval(this.timeout);
                this.timeout = null;
            }
        };
        this.calculateDelay = () => {
            const baseDelay = this.TELEMETRY_RETRY_CONFIG.baseTimer *
                Math.pow(this.TELEMETRY_RETRY_CONFIG.backoffFactor, this.numOfAttemptsWhenTimerHits);
            const cappedDelay = Math.min(baseDelay, this.TELEMETRY_RETRY_CONFIG.maxDelayMs);
            const jitterMultiplier = 1 + (Math.random() * 2 - 1) * this.TELEMETRY_RETRY_CONFIG.jitterFactor;
            return Math.floor(cappedDelay * jitterMultiplier);
        };
        this.increaseQueueCapacity = () => {
            if (this.numOfAttemptsWhenQueueIsFull < this.TELEMETRY_RETRY_CONFIG.maxRetries) {
                this.queueCapacity = this.TELEMETRY_RETRY_CONFIG.baseCapacity *
                    Math.pow(this.TELEMETRY_RETRY_CONFIG.backoffFactor, this.numOfAttemptsWhenQueueIsFull);
            }
            logger_1.LOGGER.debug("Keeping queue capacity same as max capacity reached");
        };
        this.getNumberOfEventsToBeRetained = () => this.numOfAttemptsWhenQueueIsFull >= this.TELEMETRY_RETRY_CONFIG.maxRetries ?
            this.queueCapacity / 2 : -1;
        this.resetQueueCapacity = () => {
            logger_1.LOGGER.debug("Resetting queue capacity to default");
            this.queueCapacity = this.TELEMETRY_RETRY_CONFIG.baseCapacity;
            this.numOfAttemptsWhenQueueIsFull = 1;
            this.triggeredDueToQueueOverflow = false;
        };
        this.isQueueOverflow = (queueSize) => {
            if (queueSize >= this.queueCapacity) {
                this.triggeredDueToQueueOverflow = true;
                return true;
            }
            return false;
        };
        this.isEventRetryable = (statusCode) => {
            return statusCode <= 0 || statusCode > 500 || statusCode == 429;
        };
        this.eventsToBeEnqueuedAgain = (eventResponses) => {
            eventResponses.success.forEach(res => {
                res.event.onSuccessPostEventCallback();
            });
            if (eventResponses.failures.length) {
                const eventsToBeEnqueuedAgain = [];
                eventResponses.failures.forEach((eventRes) => {
                    if (this.isEventRetryable(eventRes.statusCode))
                        eventsToBeEnqueuedAgain.push(eventRes.event);
                });
                if (eventsToBeEnqueuedAgain.length) {
                    this.triggeredDueToQueueOverflow ?
                        this.increaseQueueCapacity() :
                        this.increaseTimePeriod();
                    logger_1.LOGGER.debug(`Queue max capacity size: ${this.queueCapacity}`);
                    logger_1.LOGGER.debug(`Timer period: ${this.timePeriod}`);
                }
                else {
                    eventResponses.failures.forEach(res => {
                        res.event.onFailPostEventCallback();
                    });
                }
                return eventsToBeEnqueuedAgain;
            }
            return [];
        };
    }
}
exports.TelemetryRetry = TelemetryRetry;
//# sourceMappingURL=telemetryRetry.js.map