"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentInfo = exports.LOCALE = exports.TIMEZONE = exports.PLATFORM_VERSION = exports.ARCH_TYPE = exports.PLATFORM = void 0;
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
const os = require("os");
const vscode_1 = require("vscode");
const getPlatform = () => {
    const platform = os.platform();
    if (platform.startsWith('darwin')) {
        return 'Mac';
    }
    if (platform.startsWith('win')) {
        return 'Windows';
    }
    return platform.charAt(0).toUpperCase() + platform.slice(1);
};
const getArchType = () => {
    return os.arch();
};
const getPlatformVersion = () => {
    return os.release();
};
const getTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
const getLocale = () => {
    return Intl.DateTimeFormat().resolvedOptions().locale;
};
exports.PLATFORM = getPlatform();
exports.ARCH_TYPE = getArchType();
exports.PLATFORM_VERSION = getPlatformVersion();
exports.TIMEZONE = getTimeZone();
exports.LOCALE = getLocale();
const getEnvironmentInfo = (contextInfo) => {
    return {
        extension: {
            id: contextInfo.getExtensionId(),
            name: contextInfo.getPackageJson().name,
            version: contextInfo.getPackageJson().version
        },
        vsCode: {
            version: vscode_1.version,
            hostType: vscode_1.env.appHost,
            locale: vscode_1.env.language,
        },
        platform: {
            os: exports.PLATFORM,
            arch: exports.ARCH_TYPE,
            osVersion: exports.PLATFORM_VERSION,
        },
        location: {
            timeZone: exports.TIMEZONE,
            locale: exports.LOCALE,
        }
    };
};
exports.getEnvironmentInfo = getEnvironmentInfo;
//# sourceMappingURL=enviromentDetails.js.map