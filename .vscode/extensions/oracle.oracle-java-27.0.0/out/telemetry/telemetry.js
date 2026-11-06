"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telemetry = void 0;
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
const telemetryManager_1 = require("./telemetryManager");
const logger_1 = require("../logger");
const config_1 = require("./config");
var Telemetry;
(function (Telemetry) {
    let telemetryManager;
    Telemetry.getIsTelemetryFeatureAvailable = () => {
        var _a;
        const TELEMETRY_API = (_a = config_1.TelemetryConfiguration.getInstance()) === null || _a === void 0 ? void 0 : _a.getApiConfig();
        return (TELEMETRY_API === null || TELEMETRY_API === void 0 ? void 0 : TELEMETRY_API.baseUrl) != null && (TELEMETRY_API === null || TELEMETRY_API === void 0 ? void 0 : TELEMETRY_API.baseUrl.trim().length) > 0 && ((TELEMETRY_API === null || TELEMETRY_API === void 0 ? void 0 : TELEMETRY_API.baseUrl.trim().startsWith("https://")) || process.env['oracle_oracleJava_allow_httpTelemetryServer'] === "true");
    };
    Telemetry.initializeTelemetry = (contextInfo) => {
        if (!!telemetryManager) {
            logger_1.LOGGER.warn("Telemetry is already initialized");
            return telemetryManager;
        }
        telemetryManager = new telemetryManager_1.TelemetryManager(contextInfo);
        if (Telemetry.getIsTelemetryFeatureAvailable()) {
            telemetryManager.initializeReporter();
        }
        return telemetryManager;
    };
    const enqueueEvent = (cbFunction) => {
        if (telemetryManager.isTelemetryEnabled() && Telemetry.getIsTelemetryFeatureAvailable()) {
            const reporter = telemetryManager.getReporter();
            if (reporter) {
                cbFunction(reporter);
            }
        }
    };
    Telemetry.sendTelemetry = (event) => {
        enqueueEvent((reporter) => reporter.addEventToQueue(event));
    };
    Telemetry.enqueueCloseEvent = () => {
        enqueueEvent((reporter) => reporter.closeEvent());
    };
})(Telemetry || (exports.Telemetry = Telemetry = {}));
//# sourceMappingURL=telemetry.js.map