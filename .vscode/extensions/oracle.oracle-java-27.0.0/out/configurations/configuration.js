"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configsThatNeedAdditionalResolver = exports.userConfigsListenedByServer = exports.userConfigsListened = exports.builtInConfigKeys = exports.configKeys = void 0;
/*
  Copyright (c) 2023-2026, Oracle and/or its affiliates.

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
exports.configKeys = {
    jdkHome: 'jdkhome',
    projectJdkHome: 'project.jdkhome',
    lspVmOptions: 'serverVmOptions',
    disableNbJavac: 'advanced.disable.nbjavac',
    disableProjSearchLimit: 'advanced.disable.projectSearchLimit',
    formatPrefs: 'format',
    hintPrefs: 'hints',
    importPrefs: 'java.imports',
    runConfigVmOptions: 'runConfig.vmOptions',
    runConfigArguments: 'runConfig.arguments',
    runConfigCwd: 'runConfig.cwd',
    runConfigEnv: 'runConfig.env',
    verbose: 'verbose',
    userdir: 'userdir',
    revealInActivteProj: "revealActiveInProjects",
    notebookClasspath: "notebook.classpath",
    notebookModulepath: "notebook.modulepath",
    notebookAddModules: "notebook.addmodules",
    notebookEnablePreview: "notebook.enablePreview",
    notebookImplicitImports: "notebook.implicitImports",
    notebookProjectMapping: "notebook.projects.mapping",
    notebookVmOptions: "notebook.vmOptions",
    telemetryEnabled: 'telemetry.enabled',
    mavenUserSettings: 'maven.userSettings'
};
exports.builtInConfigKeys = {
    vscodeTheme: 'workbench.colorTheme'
};
exports.userConfigsListened = [
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.jdkHome),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.userdir),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.lspVmOptions),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.disableNbJavac),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.disableProjSearchLimit),
    exports.builtInConfigKeys.vscodeTheme,
];
exports.userConfigsListenedByServer = [
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.hintPrefs),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.formatPrefs),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.importPrefs),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookClasspath),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookModulepath),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookAddModules),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookEnablePreview),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookImplicitImports),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookProjectMapping),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookVmOptions),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.projectJdkHome),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.runConfigVmOptions),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.runConfigCwd),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.mavenUserSettings)
];
exports.configsThatNeedAdditionalResolver = [
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.projectJdkHome),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.jdkHome),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookClasspath),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookModulepath),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookAddModules),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookEnablePreview),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookImplicitImports),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.notebookVmOptions),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.runConfigVmOptions),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.runConfigCwd),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.runConfigArguments),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.runConfigEnv),
    (0, utils_1.appendPrefixToCommand)(exports.configKeys.lspVmOptions)
];
//# sourceMappingURL=configuration.js.map