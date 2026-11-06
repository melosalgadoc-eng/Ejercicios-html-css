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
exports.PostTelemetry = void 0;
const logger_1 = require("../../logger");
const config_1 = require("../config");
;
;
class PostTelemetry {
    constructor() {
        this.TELEMETRY_API = config_1.TelemetryConfiguration.getInstance().getApiConfig();
        this.post = (events) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.TELEMETRY_API.baseUrl == null) {
                    return {
                        success: [],
                        failures: []
                    };
                }
                logger_1.LOGGER.debug("Posting telemetry...");
                const results = yield Promise.allSettled(events.map(event => this.postEvent(event)));
                return this.parseTelemetryResponse(events, results);
            }
            catch (err) {
                logger_1.LOGGER.debug(`Error occurred while posting telemetry : ${err === null || err === void 0 ? void 0 : err.message}`);
                throw err;
            }
        });
        this.addBaseEndpoint = (endpoint) => {
            return `${this.TELEMETRY_API.baseUrl}${this.TELEMETRY_API.baseEndpoint}${this.TELEMETRY_API.version}${endpoint}`;
        };
        this.postEvent = (event) => {
            const { ENDPOINT, getPayload: payload } = event;
            const serverEndpoint = this.addBaseEndpoint(ENDPOINT);
            return fetch(serverEndpoint, {
                method: "POST",
                body: JSON.stringify(payload),
                redirect: "follow",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });
        };
        this.parseTelemetryResponse = (events, eventResponses) => {
            let success = [], failures = [];
            eventResponses.forEach((eventResponse, index) => {
                const event = events[index];
                let list = success;
                let statusCode = 0;
                if (eventResponse.status === "rejected") {
                    list = failures;
                    statusCode = -1;
                }
                else {
                    statusCode = eventResponse.value.status;
                    if (statusCode <= 0 || statusCode >= 400) {
                        list = failures;
                    }
                }
                list.push({
                    event,
                    statusCode
                });
            });
            return {
                success,
                failures
            };
        };
    }
}
exports.PostTelemetry = PostTelemetry;
//# sourceMappingURL=postTelemetry.js.map