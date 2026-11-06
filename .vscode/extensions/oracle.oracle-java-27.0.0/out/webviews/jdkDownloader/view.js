"use strict";
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
exports.JdkDownloaderView = void 0;
const constants_1 = require("../constants");
const vscode_1 = require("vscode");
const os = require("os");
const action_1 = require("./action");
const styles_1 = require("./styles");
const localiser_1 = require("../../localiser");
const logger_1 = require("../../logger");
const utils_1 = require("../../utils");
class JdkDownloaderView {
    constructor() {
        this.jdkDownloaderTitle = localiser_1.l10n.value("jdk.downloader.heading");
        this.oracleJdkVersions = [];
        this.openJdkVersions = [];
        this.createView = () => __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.LOGGER.log("Creating JDK downloader webview");
                this.jdkDownloaderWebView = vscode_1.window.createWebviewPanel('jdkDownloader', this.jdkDownloaderTitle, vscode_1.ViewColumn.One, {
                    enableScripts: true,
                    enableCommandUris: true
                });
                this.openJdkVersions = Object.keys(constants_1.jdkDownloaderConstants.OPEN_JDK_VERSION_DOWNLOAD_LINKS)
                    .map((version) => ({ version, isLts: false }));
                this.oracleJdkVersions = yield this.getOracleJdkVersions();
                this.setDropdownOptions();
                this.jdkDownloaderWebView.webview.html = this.fetchJdkDownloadViewHtml();
                this.jdkDownloaderWebView.webview.onDidReceiveMessage(message => {
                    const jdkDownloader = new action_1.JdkDownloaderAction();
                    jdkDownloader.invokeListener(message);
                });
                logger_1.LOGGER.log("JDK downloader webview created successfully");
            }
            catch (err) {
                logger_1.LOGGER.error("Error creating JDK downloader webview:");
                logger_1.LOGGER.error((err === null || err === void 0 ? void 0 : err.message) || "No Error message received");
                vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.downloader.error_message.errorLoadingPage"));
            }
        });
        this.disposeView = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield ((_a = this.jdkDownloaderWebView) === null || _a === void 0 ? void 0 : _a.dispose());
        });
        this.setDropdownOptions = () => {
            const osTypeNode = os.type();
            switch (osTypeNode) {
                case "Linux":
                    this.osType = "linux";
                    break;
                case "Darwin":
                    this.osType = "macOS";
                    break;
                default:
                    this.osType = "windows";
                    break;
            }
            logger_1.LOGGER.log(`OS identified: ${this.osType}`);
            const machineArchNode = os.arch();
            if (machineArchNode === "arm64") {
                this.machineArch = "aarch64";
            }
            else {
                this.machineArch = "x64";
            }
            logger_1.LOGGER.log(`Machine architecture identified: ${this.machineArch}`);
        };
        this.fetchJdkDownloadViewHtml = () => {
            var _a;
            return `<!DOCTYPE html>
        <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <title>${this.jdkDownloaderTitle}</title>
            <style>
            ${styles_1.downloaderCss}
            </style>
        </head>
        <body>
            <main class="page">
                <h1>${this.jdkDownloaderTitle}</h1>
                <p class="sub">
                    ${localiser_1.l10n.value("jdk.downloader.html.summary")}
                </p>
                <br>
                <section class="panel" aria-label="Download panel">
                    <div class="lead">
                        ${localiser_1.l10n.value("jdk.downloader.html.details")}
                    </div>
                    <button id="latestDownloadButton" class="jdk-confirm-button" type="button" aria-label="Download Latest Oracle JDK">
                        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 20h14v-2H5v2zm7-18c-.6 0-1 .4-1 1v8.6l-2.3-2.3-1.4 1.4 4.7 4.7 4.7-4.7-1.4-1.4-2.3 2.3V3c0-.6-.4-1-1-1z"/>
                        </svg>
                        ${localiser_1.l10n.value("jdk.downloader.button.label.latestOracleJdk", { jdkVersion: (_a = this.oracleJdkVersions.at(0)) === null || _a === void 0 ? void 0 : _a.version })}
                    </button>

                    <!-- Other options: DETAILS accordion -->
                    <details class="other-options">
                        <summary class="other-options__summary">
                            <h3>${localiser_1.l10n.value("jdk.downloader.label.otherOptions")}</h3>
                        </summary>

                        <div class="other-options__body">
                            <div class="detected">
                                <span>${localiser_1.l10n.value("jdk.downloader.label.selectedOsArch")}: <span id="selectedOs">${this.getDefaultOsLabel()}</span> + <span id="selectedArch">${this.getDefaultMachineArchLabel()}</span></span>

                                <!-- Change: nested DETAILS -->
                                <details class="change">
                                <summary class="change__summary">(${localiser_1.l10n.value("jdk.downloader.label.changeOsArch")})</summary>

                                <div class="change__body">
                                    <div class="row">
                                    <div>
                                        <div class="jdk-version-label">${localiser_1.l10n.value("jdk.downloader.label.selectOs")}</div>
                                        <div class="jdk-version-dropdown">
                                        <select id="osTypeDropdown" class="select" aria-label="Select OS">
                                            ${this.getOsTypeHtml()}
                                        </select>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="jdk-version-label">${localiser_1.l10n.value("jdk.downloader.label.selectMachineArchitecture")}</div>
                                        <div class="jdk-version-dropdown">
                                        <select id="machineArchDropdown" class="select" aria-label="Select machine architecture">
                                            ${this.getMachineArchHtml()}
                                        </select>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                </details>
                            </div>

                            <fieldset aria-label="JDK type">
                                <div class="choices">
                                <label class="choice">
                                    <input id="oracleJdk" type="radio" name="jdkType" value="${JdkDownloaderView.JDK_TYPE.oracleJdk}" checked/>
                                    ${localiser_1.l10n.value("jdk.downloader.label.oracleJdk")}
                                </label>

                                <label class="choice">
                                    <input id="openJdk" type="radio" name="jdkType" value="${JdkDownloaderView.JDK_TYPE.openJdk}"/>
                                    ${localiser_1.l10n.value("jdk.downloader.label.openJdk")}
                                </label>
                                </div>
                                <p class="license openJdk-license">
                                    ${localiser_1.l10n.value("jdk.downloader.html.license.openJdk")}
                                </p>

                                <div class="bottom-row">
                                    <div class="oracleJdk-control" id="oracleJdkDiv">
                                        <div class="jdk-version-container">
                                            <label for="oracleJdkVersionDropdown" class="jdk-version-label">${localiser_1.l10n.value("jdk.downloader.label.selectOracleJdkVersion")}</label>
                                            <div class="jdk-version-dropdown">
                                            <select class="select" id="oracleJdkVersionDropdown" name="oracleJdkVersionDropdown"${this.oracleJdkVersions.length < 2 ? " disabled" : ""}>
                                                ${this.getJdkVersionsHtml(this.oracleJdkVersions)}
                                            </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="openJdk-control" id="openJdkDiv">
                                        <div class="jdk-version-container">
                                            <label for="openJdkVersionDropdown" class="jdk-version-label">${localiser_1.l10n.value("jdk.downloader.label.selectOpenJdkVersion")}</label>
                                            <div class="jdk-version-dropdown">
                                            <select class="select" id="openJdkVersionDropdown" name="openJdkVersionDropdown"${this.openJdkVersions.length < 2 ? " disabled" : ""}>
                                                ${this.getJdkVersionsHtml(this.openJdkVersions)}
                                            </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </fieldset>

                            <button id="otherOptionsDownloadButton" class="jdk-confirm-button" type="button" aria-label="Download selected JDK">
                                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M5 20h14v-2H5v2zm7-18c-.6 0-1 .4-1 1v8.6l-2.3-2.3-1.4 1.4 4.7 4.7 4.7-4.7-1.4-1.4-2.3 2.3V3c0-.6-.4-1-1-1z"/>
                                </svg>
                                ${localiser_1.l10n.value("jdk.downloader.button.label.selectedJdk")}
                            </button>
                        </div>
                    </details>
                </section>
                <div class="spacer" aria-hidden="true"></div>
                <p class="footer">
                    ${localiser_1.l10n.value("jdk.downloader.html.footnote")}
                </p>
            </main>
        </body>
        <script>
        ${this.getScriptJs()}
        </script>
      </html>
    `;
        };
        this.getOracleJdkVersions = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                logger_1.LOGGER.log("Fetching Oracle JDK versions...");
                const availableVersions = yield (0, utils_1.httpsGet)(`${constants_1.jdkDownloaderConstants.ORACLE_JDK_RELEASES_BASE_URL}?licenseType=NFTC&sortBy=jdkVersion&sortOrder=DESC`);
                if ((0, utils_1.isString)(availableVersions)) {
                    const availableVersionsObj = JSON.parse(availableVersions);
                    if (availableVersionsObj === null || availableVersionsObj === void 0 ? void 0 : availableVersionsObj.items) {
                        const jdkVersions = (_a = availableVersionsObj === null || availableVersionsObj === void 0 ? void 0 : availableVersionsObj.items) === null || _a === void 0 ? void 0 : _a.map((version) => version.jdkDetails).map((details) => ({ version: String(details.jdkVersion).replace(/[^a-zA-Z0-9_.+-]/g, ""), isLts: details.isLts }));
                        logger_1.LOGGER.log(`Fetched Oracle JDK versions: ${jdkVersions === null || jdkVersions === void 0 ? void 0 : jdkVersions.map((el) => '{"version"="' + el.version + '", lts:' + el.isLts + '}')})`);
                        return jdkVersions;
                    }
                }
                logger_1.LOGGER.warn(`Response of Oracle JDK versions is not as expected`);
            }
            catch (error) {
                const msg = `Some error occurred while fetching Oracle JDK versions: ${(0, utils_1.isError)(error) ? error.message : null}`;
                logger_1.LOGGER.warn(msg);
            }
            return constants_1.jdkDownloaderConstants.ORACLE_JDK_FALLBACK_VERSIONS;
        });
        this.getJdkVersionsHtml = (jdkVersions) => {
            let htmlStr = "";
            const ltsLabel = localiser_1.l10n.value("jdk.downloader.label.versionLtsSuffix");
            jdkVersions.forEach((el, index) => {
                const ltsSuffix = el.isLts ? ` (${ltsLabel})` : '';
                const version = el.version;
                const versionLabel = version + ltsSuffix;
                if (index === 0) {
                    htmlStr += `<option value="${version}" selected>JDK ${versionLabel}</option>\n`;
                }
                else {
                    htmlStr += `<option value="${version}">JDK ${versionLabel}</option>\n`;
                }
            });
            return htmlStr;
        };
        this.getDefaultOs = () => {
            return this.osType;
        };
        this.getDefaultMachineArch = () => {
            return this.osType === 'windows' ? 'x64' : this.machineArch;
        };
        this.getDefaultOsLabel = () => {
            return this.osType === 'windows' ? localiser_1.l10n.value("jdk.downloader.label.windows") :
                this.osType === 'macOS' ? localiser_1.l10n.value("jdk.downloader.label.mac") :
                    this.osType === 'linux' ? localiser_1.l10n.value("jdk.downloader.label.linux") :
                        this.osType;
        };
        this.getDefaultMachineArchLabel = () => {
            return this.osType === 'windows' ? "x64" :
                this.machineArch === 'aarch64' ? "arm64" :
                    this.machineArch === 'x64' ? "x64" :
                        this.machineArch;
        };
        this.getOsTypeHtml = () => {
            return `<option value="windows" ${this.osType === 'windows' ? 'selected' : null}>${localiser_1.l10n.value("jdk.downloader.label.windows")}</option>
                <option value="macOS" ${this.osType === 'macOS' ? 'selected' : null}>${localiser_1.l10n.value("jdk.downloader.label.mac")}</option>
                <option value="linux" ${this.osType === 'linux' ? 'selected' : null}>${localiser_1.l10n.value("jdk.downloader.label.linux")}</option>`;
        };
        this.getMachineArchHtml = () => {
            if (this.osType === 'windows') {
                return `<option value="x64" selected>x64</option>`;
            }
            else {
                return `<option value="aarch64" ${this.machineArch === 'aarch64' ? 'selected' : null}>arm64</option>
                    <option value="x64" ${this.machineArch === 'x64' ? 'selected' : null}>x64</option>`;
            }
        };
        this.getScriptJs = () => {
            var _a;
            return `const vscode = acquireVsCodeApi();
                document.getElementById("latestDownloadButton")?.addEventListener('click', event => {
                    triggerJDKDownload(event);
                });

                document.getElementById("otherOptionsDownloadButton")?.addEventListener('click', event => {
                    triggerJDKDownload(event);
                });

                document.getElementById("osTypeDropdown")?.addEventListener('change', (event) => {
                    syncSelectedOs(event.target);
                    updateMachineArchOptions(event.target);
                });

                document.getElementById("machineArchDropdown")?.addEventListener('change', (event) => {
                    syncSelectedArch(event.target);
                });

                function syncSelectedOs(osDropdown) {
                    const selectedOs = document.getElementById("selectedOs");
                    selectedOs.textContent = osDropdown.selectedOptions[0].textContent;
                }

                function syncSelectedArch(archDropdown) {
                    const selectedArch = document.getElementById("selectedArch");
                    selectedArch.textContent = archDropdown.selectedOptions[0].textContent;
                }

                const updateMachineArchOptions = (osDropdown) => {
                    const machineArchDropdown = document.getElementById("machineArchDropdown");

                    if (osDropdown.value === 'windows') {
                        machineArchDropdown.innerHTML = '<option value="x64" selected>x64</option>';
                    } else {
                        machineArchDropdown.innerHTML = \`
                            <option value="aarch64" \${machineArchDropdown.value === 'aarch64' ? 'selected' : null}>arm64</option>
                            <option value="x64" \${machineArchDropdown.value === 'x64' ? 'selected' : null}>x64</option>
                        \`;
                    }
                    syncSelectedArch(machineArchDropdown);
                };

                const triggerJDKDownload = (e) => {
                    const downloadLatest = e.target.id === 'latestDownloadButton';
                    const jdkTypeSelected = document.querySelector('input[name="jdkType"]:checked')?.value;
                    const jdkType = downloadLatest || !jdkTypeSelected ? "${JdkDownloaderView.JDK_TYPE.oracleJdk}" : jdkTypeSelected;
                    const os = downloadLatest ? "${this.getDefaultOs()}" : document.getElementById('osTypeDropdown').value;
                    const arch = downloadLatest ? "${this.getDefaultMachineArch()}" : document.getElementById('machineArchDropdown').value;
                    const version = downloadLatest ? "${(_a = this.oracleJdkVersions.at(0)) === null || _a === void 0 ? void 0 : _a.version}" : document.getElementById(jdkType + 'VersionDropdown').value;
                    vscode.postMessage({
                        command: "${JdkDownloaderView.DOWNLOAD_CMD}",
                        id: jdkType,
                        installType: "${action_1.JdkDownloaderAction.AUTO_INSTALLATION_TYPE}",
                        jdkVersion: version,
                        jdkOS: os,
                        jdkArch: arch
                    });
                }
                `;
        };
    }
}
exports.JdkDownloaderView = JdkDownloaderView;
JdkDownloaderView.DOWNLOAD_CMD = 'downloadJDK';
JdkDownloaderView.JDK_TYPE = {
    oracleJdk: "oracleJdk",
    openJdk: "openJdk"
};
JdkDownloaderView.getJdkLabel = (id) => {
    const key = "jdk.downloader.label." + id;
    const label = localiser_1.l10n.value(key);
    return label !== key ? label : id;
};
//# sourceMappingURL=view.js.map