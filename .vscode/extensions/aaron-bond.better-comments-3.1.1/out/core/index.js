"use strict";
// The core's public API: everything outside src/core imports from here, and only from here.
//
// src/core holds pure functions on plain values: no vscode, no I/O, and nothing kept between calls.
// Anything that owns state or talks to VS Code lives in src/ as a class (Parser, Configuration) and calls in.
// test/unit/boundary.test.ts enforces both rules.
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareTag = exports.readSettings = exports.initialLanguageState = exports.beginLanguageSwitch = exports.applyLanguage = exports.parseLanguageConfig = exports.findTags = exports.readLanguageContributions = void 0;
var contributions_1 = require("./contributions");
Object.defineProperty(exports, "readLanguageContributions", { enumerable: true, get: function () { return contributions_1.readLanguageContributions; } });
var finder_1 = require("./finder");
Object.defineProperty(exports, "findTags", { enumerable: true, get: function () { return finder_1.findTags; } });
var languageConfig_1 = require("./languageConfig");
Object.defineProperty(exports, "parseLanguageConfig", { enumerable: true, get: function () { return languageConfig_1.parseLanguageConfig; } });
var languageState_1 = require("./languageState");
Object.defineProperty(exports, "applyLanguage", { enumerable: true, get: function () { return languageState_1.applyLanguage; } });
Object.defineProperty(exports, "beginLanguageSwitch", { enumerable: true, get: function () { return languageState_1.beginLanguageSwitch; } });
Object.defineProperty(exports, "initialLanguageState", { enumerable: true, get: function () { return languageState_1.initialLanguageState; } });
var settings_1 = require("./settings");
Object.defineProperty(exports, "readSettings", { enumerable: true, get: function () { return settings_1.readSettings; } });
var tags_1 = require("./tags");
Object.defineProperty(exports, "prepareTag", { enumerable: true, get: function () { return tags_1.prepareTag; } });
//# sourceMappingURL=index.js.map