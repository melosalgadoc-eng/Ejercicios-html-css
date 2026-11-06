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
exports.replaceAllOccurrences = exports.transformValue = exports.isPrimitiveTransformationNotRequired = exports.getValuesToBeTransformed = exports.getHashCode = exports.mkdir = exports.readFile = exports.writeFile = exports.exists = exports.getOriginalDateFromSeconds = exports.getCurrentUTCDateInSeconds = void 0;
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
const crypto = require("crypto");
const vscode_1 = require("vscode");
const os = require("os");
const utils_1 = require("../utils");
const getCurrentUTCDateInSeconds = () => {
    const date = Date.now();
    return Math.floor(date / 1000);
};
exports.getCurrentUTCDateInSeconds = getCurrentUTCDateInSeconds;
const getOriginalDateFromSeconds = (seconds) => {
    return new Date(seconds * 1000);
};
exports.getOriginalDateFromSeconds = getOriginalDateFromSeconds;
const exists = (pathOrUri) => __awaiter(void 0, void 0, void 0, function* () {
    const uri = getUri(pathOrUri);
    try {
        yield vscode_1.workspace.fs.stat(uri);
        return true;
    }
    catch (e) {
        return false;
    }
});
exports.exists = exists;
const writeFile = (pathOrUri, content) => __awaiter(void 0, void 0, void 0, function* () {
    const uri = getUri(pathOrUri);
    const parent = vscode_1.Uri.joinPath(uri, "..");
    if (!(yield (0, exports.exists)(parent))) {
        yield (0, exports.mkdir)(parent);
    }
    const res = new TextEncoder().encode(content);
    return vscode_1.workspace.fs.writeFile(uri, res);
});
exports.writeFile = writeFile;
const readFile = (pathOrUri) => __awaiter(void 0, void 0, void 0, function* () {
    const uri = getUri(pathOrUri);
    if (!(yield (0, exports.exists)(uri))) {
        return undefined;
    }
    const read = yield vscode_1.workspace.fs.readFile(uri);
    return new TextDecoder().decode(read);
});
exports.readFile = readFile;
const mkdir = (pathOrUri) => __awaiter(void 0, void 0, void 0, function* () {
    const uri = getUri(pathOrUri);
    yield vscode_1.workspace.fs.createDirectory(uri);
});
exports.mkdir = mkdir;
const getHashCode = (value, algorithm = 'sha256') => {
    const hash = crypto.createHash(algorithm).update(value).digest('hex');
    return hash;
};
exports.getHashCode = getHashCode;
const getUri = (pathOrUri) => {
    if (pathOrUri instanceof vscode_1.Uri) {
        return pathOrUri;
    }
    return utils_1.FileUtils.toUri(pathOrUri);
};
const getValuesToBeTransformed = () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const MIN_BLOCKED_VAL_LENGTH = 3;
    const IGNORED_VALUES = ['java', 'vscode', 'user', 'oracle'];
    const blockedValues = [
        (_a = process.env) === null || _a === void 0 ? void 0 : _a.SUDO_USER,
        (_b = process.env) === null || _b === void 0 ? void 0 : _b.C9_USER,
        (_c = process.env) === null || _c === void 0 ? void 0 : _c.LOGNAME,
        (_d = process.env) === null || _d === void 0 ? void 0 : _d.USER,
        (_e = process.env) === null || _e === void 0 ? void 0 : _e.LNAME,
        (_f = process.env) === null || _f === void 0 ? void 0 : _f.USERNAME,
        (_g = process.env) === null || _g === void 0 ? void 0 : _g.HOSTNAME,
        (_h = process.env) === null || _h === void 0 ? void 0 : _h.COMPUTERNAME,
        (_j = process.env) === null || _j === void 0 ? void 0 : _j.NAME,
        os.userInfo().username
    ].map(el => el === null || el === void 0 ? void 0 : el.trim());
    return Array.from(new Set(blockedValues.filter((el) => el !== undefined &&
        el.length >= MIN_BLOCKED_VAL_LENGTH &&
        !IGNORED_VALUES.includes(el))));
};
exports.getValuesToBeTransformed = getValuesToBeTransformed;
const isPrimitiveTransformationNotRequired = (value) => (value === null ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint');
exports.isPrimitiveTransformationNotRequired = isPrimitiveTransformationNotRequired;
const transformValue = (key, blockedValues, propertiesToTransform, replacedValue, value) => {
    if ((0, exports.isPrimitiveTransformationNotRequired)(value)) {
        return value;
    }
    if ((0, utils_1.isString)(value)) {
        if (!value.trim().length)
            return value;
        let updatedValue = value;
        if (key == null || !propertiesToTransform.includes(key))
            return value;
        blockedValues.forEach(valueToBeReplaced => updatedValue = (0, exports.replaceAllOccurrences)(updatedValue, valueToBeReplaced, replacedValue));
        return updatedValue;
    }
    if (Array.isArray(value)) {
        return value.map(el => (0, exports.transformValue)(key, blockedValues, propertiesToTransform, replacedValue, el));
    }
    if ((0, utils_1.isObject)(value)) {
        const result = {};
        for (const [k, val] of Object.entries(value)) {
            result[k] = (0, exports.transformValue)(k, blockedValues, propertiesToTransform, replacedValue, val);
        }
        return result;
    }
    return value;
};
exports.transformValue = transformValue;
const replaceAllOccurrences = (str, valueString, replaceString) => {
    if (!valueString.trim().length)
        return str;
    return str.split(valueString).join(replaceString);
};
exports.replaceAllOccurrences = replaceAllOccurrences;
//# sourceMappingURL=utils.js.map