"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryConfiguration = void 0;
const path = require("path");
const fs = require("fs");
const logger_1 = require("../logger");
class TelemetryConfiguration {
    constructor() {
        this.initialize();
    }
    static getInstance() {
        if (!TelemetryConfiguration.instance) {
            TelemetryConfiguration.instance = new TelemetryConfiguration();
        }
        return TelemetryConfiguration.instance;
    }
    initialize() {
        try {
            const config = JSON.parse(fs.readFileSync(TelemetryConfiguration.CONFIG_FILE_PATH).toString());
            this.retryConfig = Object.freeze({
                maxRetries: config.telemetryRetryConfig.maxRetries,
                baseCapacity: config.telemetryRetryConfig.baseCapacity,
                baseTimer: config.telemetryRetryConfig.baseTimer,
                maxDelayMs: config.telemetryRetryConfig.maxDelayMs,
                backoffFactor: config.telemetryRetryConfig.backoffFactor,
                jitterFactor: config.telemetryRetryConfig.jitterFactor
            });
            this.apiConfig = Object.freeze({
                baseUrl: config.telemetryApi.baseUrl,
                baseEndpoint: config.telemetryApi.baseEndpoint,
                version: config.telemetryApi.version
            });
            this.metadata = Object.freeze({
                consentSchemaVersion: config.metadata.consentSchemaVersion
            });
        }
        catch (error) {
            logger_1.LOGGER.error("Error occurred while setting up telemetry config");
            logger_1.LOGGER.error(error.message);
        }
    }
    getRetryConfig() {
        return this.retryConfig;
    }
    getApiConfig() {
        return this.apiConfig;
    }
    getTelemetryConfigMetadata() {
        return this.metadata;
    }
}
exports.TelemetryConfiguration = TelemetryConfiguration;
TelemetryConfiguration.CONFIG_FILE_PATH = path.resolve(__dirname, "..", "..", "telemetryConfig.json");
//# sourceMappingURL=config.js.map