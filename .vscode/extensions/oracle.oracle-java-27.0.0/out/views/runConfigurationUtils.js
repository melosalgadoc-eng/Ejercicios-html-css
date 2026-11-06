"use strict";
/*
  Copyright (c) 2026, Oracle and/or its affiliates.

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
exports.applyRunConfigurationOverrides = void 0;
const utils_1 = require("../utils");
const runConfiguration_1 = require("./runConfiguration");
const applyRunConfigurationOverrides = (config, overrides = (0, runConfiguration_1.getRunConfigurationValues)()) => {
    const updatedConfig = Object.assign({}, config);
    const args = getNonEmptyValue(overrides.args);
    if (args) {
        updatedConfig.args = appendStringValue(getStringValue(updatedConfig.args), args);
    }
    const vmArgs = getNonEmptyValue(overrides.vmArgs);
    if (vmArgs) {
        updatedConfig.vmArgs = appendVmArguments(getVmArgsValue(updatedConfig.vmArgs), vmArgs);
    }
    const env = getNonEmptyValue(overrides.env);
    if (env) {
        updatedConfig.env = mergeEnvironmentVariables(updatedConfig.env, env);
    }
    const cwd = getNonEmptyValue(overrides.cwd);
    if (cwd) {
        updatedConfig.cwd = cwd;
    }
    return updatedConfig;
};
exports.applyRunConfigurationOverrides = applyRunConfigurationOverrides;
const appendStringValue = (currentValue, appendedValue) => currentValue ? `${currentValue} ${appendedValue}` : appendedValue;
const appendVmArguments = (currentValue, appendedValue) => {
    if (!currentValue) {
        return appendedValue;
    }
    if (Array.isArray(currentValue)) {
        return [...currentValue, ...(0, utils_1.parseArguments)(appendedValue)];
    }
    return `${currentValue} ${appendedValue}`;
};
const mergeEnvironmentVariables = (currentEnv, rawEnv) => {
    const targetEnv = isStringMap(currentEnv) ? Object.assign({}, currentEnv) : {};
    return Object.assign(Object.assign({}, targetEnv), parseEnvironmentVariables(rawEnv));
};
const parseEnvironmentVariables = (rawEnv) => {
    return rawEnv
        .split(',')
        .map(entry => entry.trim())
        .reduce((parsedEnv, entry) => {
        const separatorIndex = entry.indexOf('=');
        if (separatorIndex <= 0) {
            return parsedEnv;
        }
        const key = entry.substring(0, separatorIndex).trim();
        const value = entry.substring(separatorIndex + 1).trim();
        if (!key) {
            return parsedEnv;
        }
        parsedEnv[key] = value;
        return parsedEnv;
    }, {});
};
const getNonEmptyValue = (value) => {
    const trimmedValue = value === null || value === void 0 ? void 0 : value.trim();
    return trimmedValue ? trimmedValue : undefined;
};
const getStringValue = (value) => (0, utils_1.isString)(value) ? value : undefined;
const getVmArgsValue = (value) => {
    if ((0, utils_1.isString)(value) || Array.isArray(value)) {
        return value;
    }
    return undefined;
};
const isStringMap = (value) => !!value && (0, utils_1.isObject)(value) && !Array.isArray(value);
//# sourceMappingURL=runConfigurationUtils.js.map