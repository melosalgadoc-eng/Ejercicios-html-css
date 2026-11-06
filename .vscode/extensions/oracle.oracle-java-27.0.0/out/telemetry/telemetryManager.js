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
exports.TelemetryManager = void 0;
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
const vscode_1 = require("vscode");
const telemetryPrefs_1 = require("./impl/telemetryPrefs");
const telemetryEventQueue_1 = require("./impl/telemetryEventQueue");
const telemetryReporterImpl_1 = require("./impl/telemetryReporterImpl");
const logger_1 = require("../logger");
const localiser_1 = require("../localiser");
const telemetryRetry_1 = require("./impl/telemetryRetry");
class TelemetryManager {
    constructor(extensionContextInfo) {
        this.telemetryRetryManager = new telemetryRetry_1.TelemetryRetry();
        this.isTelemetryEnabled = () => {
            return this.settings.getIsTelemetryEnabled();
        };
        this.initializeReporter = () => {
            const queue = new telemetryEventQueue_1.TelemetryEventQueue();
            this.reporter = new telemetryReporterImpl_1.TelemetryReporterImpl(queue, this.telemetryRetryManager);
            this.isTelemetryEnabled() ? this.onTelemetryEnable() : this.openTelemetryDialog();
        };
        this.getReporter = () => {
            return this.reporter || null;
        };
        this.openTelemetryDialog = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if ((_a = this.settings) === null || _a === void 0 ? void 0 : _a.isConsentPopupToBeTriggered()) {
                logger_1.LOGGER.log('Telemetry not enabled yet');
                const yesLabel = localiser_1.l10n.value("jdk.downloader.message.confirmation.yes");
                const noLabel = localiser_1.l10n.value("jdk.downloader.message.confirmation.no");
                const telemetryLabel = localiser_1.l10n.value("jdk.telemetry.consent");
                const enable = yield vscode_1.window.showInformationMessage(telemetryLabel, yesLabel, noLabel);
                if (enable == undefined) {
                    return;
                }
                this.settings.updateTelemetrySetting(enable === yesLabel);
            }
        });
        this.onTelemetryEnable = () => {
            var _a;
            logger_1.LOGGER.log("Telemetry is now enabled");
            (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.startEvent();
        };
        this.onTelemetryDisable = () => {
            var _a;
            logger_1.LOGGER.log("Telemetry is now disabled");
            (_a = this.reporter) === null || _a === void 0 ? void 0 : _a.closeEvent();
        };
        this.extensionContextInfo = extensionContextInfo;
        this.settings = new telemetryPrefs_1.TelemetrySettings(extensionContextInfo, this.onTelemetryEnable, this.onTelemetryDisable, this.openTelemetryDialog);
    }
}
exports.TelemetryManager = TelemetryManager;
;
//# sourceMappingURL=telemetryManager.js.map