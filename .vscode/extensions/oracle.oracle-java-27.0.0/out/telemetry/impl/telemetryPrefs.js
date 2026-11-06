"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetrySettings = void 0;
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
const vscode_1 = require("vscode");
const handlers_1 = require("../../configurations/handlers");
const configuration_1 = require("../../configurations/configuration");
const utils_1 = require("../../utils");
const constants_1 = require("../constants");
const config_1 = require("../config");
const logger_1 = require("../../logger");
const cache_1 = require("../../cache");
class TelemetrySettings {
    constructor(extensionContext, onTelemetryEnableCallback, onTelemetryDisableCallback, triggerPopup) {
        this.onTelemetryEnableCallback = onTelemetryEnableCallback;
        this.onTelemetryDisableCallback = onTelemetryDisableCallback;
        this.triggerPopup = triggerPopup;
        this.checkTelemetryStatus = () => this.extensionPrefs.getIsTelemetryEnabled() && this.vscodePrefs.getIsTelemetryEnabled();
        this.onChangeTelemetrySettingCallback = () => {
            const newTelemetryStatus = this.checkTelemetryStatus();
            if (newTelemetryStatus !== this.isTelemetryEnabled) {
                this.isTelemetryEnabled = newTelemetryStatus;
                this.updateGlobalStates();
                if (newTelemetryStatus) {
                    this.onTelemetryEnableCallback();
                }
                else {
                    this.onTelemetryDisableCallback();
                }
            }
            else if (this.vscodePrefs.getIsTelemetryEnabled()
                && !this.extensionPrefs.isTelemetrySettingSet()
                && !cache_1.cacheServiceIndex.simpleCache.get(constants_1.TELEMETRY_CONSENT_RESPONSE_TIME_KEY)) {
                this.triggerPopup();
            }
        };
        this.getIsTelemetryEnabled = () => this.isTelemetryEnabled;
        this.isConsentPopupToBeTriggered = () => {
            const isExtensionSettingSet = this.extensionPrefs.isTelemetrySettingSet();
            const isVscodeSettingEnabled = this.vscodePrefs.getIsTelemetryEnabled();
            return !isExtensionSettingSet && isVscodeSettingEnabled;
        };
        this.updateTelemetrySetting = (value) => {
            this.extensionPrefs.updateTelemetryConfig(value);
        };
        this.extensionPrefs = new ExtensionTelemetryPreference();
        this.vscodePrefs = new VscodeTelemetryPreference();
        extensionContext.pushSubscription(this.extensionPrefs.onChangeTelemetrySetting(this.onChangeTelemetrySettingCallback));
        extensionContext.pushSubscription(this.vscodePrefs.onChangeTelemetrySetting(this.onChangeTelemetrySettingCallback));
        this.isTelemetryEnabled = this.checkTelemetryStatus();
        this.syncTelemetrySettingGlobalState();
    }
    syncTelemetrySettingGlobalState() {
        const cachedSettingValue = cache_1.cacheServiceIndex.simpleCache.get(constants_1.TELEMETRY_SETTING_VALUE_KEY);
        const cachedConsentSchemaVersion = cache_1.cacheServiceIndex.simpleCache.get(constants_1.TELEMETRY_CONSENT_VERSION_SCHEMA_KEY);
        if (this.isTelemetryEnabled.toString() !== cachedSettingValue) {
            this.updateGlobalStates();
        }
        this.checkConsentVersionSchemaGlobalState(cachedConsentSchemaVersion);
    }
    updateGlobalStates() {
        var _a;
        cache_1.cacheServiceIndex.simpleCache.put(constants_1.TELEMETRY_CONSENT_RESPONSE_TIME_KEY, Date.now().toString());
        cache_1.cacheServiceIndex.simpleCache.put(constants_1.TELEMETRY_CONSENT_VERSION_SCHEMA_KEY, (_a = config_1.TelemetryConfiguration.getInstance().getTelemetryConfigMetadata()) === null || _a === void 0 ? void 0 : _a.consentSchemaVersion);
        cache_1.cacheServiceIndex.simpleCache.put(constants_1.TELEMETRY_SETTING_VALUE_KEY, this.isTelemetryEnabled.toString());
    }
    checkConsentVersionSchemaGlobalState(consentSchemaVersion) {
        var _a;
        if (this.extensionPrefs.isTelemetrySettingSet()) {
            const currentExtConsentSchemaVersion = (_a = config_1.TelemetryConfiguration.getInstance().getTelemetryConfigMetadata()) === null || _a === void 0 ? void 0 : _a.consentSchemaVersion;
            if (consentSchemaVersion !== currentExtConsentSchemaVersion) {
                logger_1.LOGGER.debug("Removing telemetry config from user settings due to consent schema version change");
                this.isTelemetryEnabled = false;
                this.updateTelemetrySetting(undefined);
            }
        }
    }
}
exports.TelemetrySettings = TelemetrySettings;
class ExtensionTelemetryPreference {
    constructor() {
        this.CONFIG = (0, utils_1.appendPrefixToCommand)(configuration_1.configKeys.telemetryEnabled);
        this.getIsTelemetryEnabled = () => this.isTelemetryEnabled === undefined ? false : this.isTelemetryEnabled;
        this.onChangeTelemetrySetting = (callback) => vscode_1.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration(this.CONFIG)) {
                this.isTelemetryEnabled = (0, handlers_1.getConfigurationValue)(configuration_1.configKeys.telemetryEnabled, false);
                callback();
            }
        });
        this.updateTelemetryConfig = (value) => {
            this.isTelemetryEnabled = value;
            (0, handlers_1.updateConfigurationValue)(configuration_1.configKeys.telemetryEnabled, value, true);
        };
        this.isTelemetrySettingSet = () => {
            if (this.isTelemetryEnabled === undefined)
                return false;
            const config = (0, handlers_1.inspectConfiguration)(this.CONFIG);
            return ((config === null || config === void 0 ? void 0 : config.globalValue) !== undefined ||
                (config === null || config === void 0 ? void 0 : config.globalLanguageValue) !== undefined);
        };
        this.isTelemetryEnabled = (0, handlers_1.getConfigurationValue)(configuration_1.configKeys.telemetryEnabled, false);
    }
}
class VscodeTelemetryPreference {
    constructor() {
        this.getIsTelemetryEnabled = () => this.isTelemetryEnabled;
        this.onChangeTelemetrySetting = (callback) => vscode_1.env.onDidChangeTelemetryEnabled((newSetting) => {
            this.isTelemetryEnabled = newSetting;
            callback();
        });
        this.isTelemetryEnabled = vscode_1.env.isTelemetryEnabled;
    }
}
// Test cases:
// 1. User accepts consent and VSCode telemetry is set to 'all'. Output: enabled telemetry
// 2. User accepts consent and VSCode telemetry is not set to 'all'. Output: disabled telemetry
// 3. User rejects consent and VSCode telemetry is set to 'all'. Output: disabled telemetry
// 4. User rejects consent and VSCode telemetry is not set to 'all'. Output: disabled telemetry
// 5. User changes from accept to reject consent and VSCode telemetry is set to 'all'. Output: disabled telemetry
// 6. User changes from accept to reject consent and VSCode telemetry is not set to 'all'. Output: disabled telemetry
// 7. User changes from reject to accept consent and VSCode telemetry is set to 'all'. Output: enabled telemetry
// 8. User changes from reject to accept consent and VSCode telemetry is not set to 'all'. Output: disabled telemetry
// 9. User accepts consent and VSCode telemetry is changed from 'all' to 'error'. Output: disabled telemetry
// 10. User accepts consent and VSCode telemetry is changed from 'error' to 'all'. Output: enabled telemetry
// 11. When consent schema version updated, pop up should trigger again.
// 12. When consent schema version updated, pop up should trigger again, if closed without selecting any value and again reloading the screen, it should pop-up again.: Disabled telemetry in settings
// 13. When consent schema version updated, pop up should trigger again, if selected yes and again reloading the screen, it shouldn't pop-up again. Output: Enabled telemetry in settings
// 14. When consent schema version updated, pop up should trigger again, if selected no and again reloading the screen, it shouldn't pop-up again. Output: Disabled telemetry in settings
// 15. When VSCode setting is changed from reject to accept, our pop-up should come.
//# sourceMappingURL=telemetryPrefs.js.map