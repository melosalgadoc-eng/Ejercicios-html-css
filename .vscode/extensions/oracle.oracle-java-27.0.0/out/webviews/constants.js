"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jdkDownloaderConstants = void 0;
var jdkDownloaderConstants;
(function (jdkDownloaderConstants) {
    jdkDownloaderConstants.ORACLE_JDK_RELEASES_BASE_URL = `https://java.oraclecloud.com/currentJavaReleases`;
    jdkDownloaderConstants.ORACLE_JDK_BASE_DOWNLOAD_URL = `https://download.oracle.com/java`;
    jdkDownloaderConstants.ORACLE_JDK_FALLBACK_VERSIONS = [
        { version: '26', isLts: false },
        { version: '25', isLts: true },
        { version: '21', isLts: true }
    ];
    jdkDownloaderConstants.OPEN_JDK_VERSION_DOWNLOAD_LINKS = {
        "27": "https://download.java.net/java/GA/jdk27/55ce5470a6294008af0057ff4626d0e5/35/GPL/openjdk-27"
    };
})(jdkDownloaderConstants || (exports.jdkDownloaderConstants = jdkDownloaderConstants = {}));
//# sourceMappingURL=constants.js.map