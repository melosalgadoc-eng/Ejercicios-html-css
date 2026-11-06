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
exports.WorkspaceSettingsTrustCacheService = void 0;
const logger_1 = require("../logger");
const globalState_1 = require("../globalState");
const workspaceSettingsTrustCacheValue_1 = require("./workspaceSettingsTrustCacheValue");
class WorkspaceSettingsTrustCacheService {
    constructor() {
        this.get = (key) => {
            try {
                const updatedKey = this.getUpdatedKey(key);
                const vscGlobalState = globalState_1.globalState.getExtensionContextInfo().getVscGlobalState();
                const value = vscGlobalState.get(updatedKey);
                if (value) {
                    this.put(updatedKey, workspaceSettingsTrustCacheValue_1.WorkspaceSettingsTrustCacheValue.fromObject(Object.assign(Object.assign({}, value), { lastUsed: Date.now() })));
                }
                return value === null || value === void 0 ? void 0 : value.payload;
            }
            catch (err) {
                logger_1.LOGGER.error(`Error while retrieving ${key} from cache: ${err.message}`);
                return undefined;
            }
        };
        this.put = (key, value) => __awaiter(this, void 0, void 0, function* () {
            try {
                const updatedKey = this.getUpdatedKey(key);
                const vscGlobalState = globalState_1.globalState.getExtensionContextInfo().getVscGlobalState();
                yield vscGlobalState.update(updatedKey, value);
                logger_1.LOGGER.debug(`Updating key: ${key} to ${value}`);
                return true;
            }
            catch (err) {
                logger_1.LOGGER.error(`Error while storing ${key} in cache: ${err.message}`);
                return false;
            }
        });
        // for unit tests needs to be public
        this.getUpdatedKey = (key) => `${workspaceSettingsTrustCacheValue_1.WorkspaceSettingsTrustCacheValue.type}.${key}`;
    }
}
exports.WorkspaceSettingsTrustCacheService = WorkspaceSettingsTrustCacheService;
//# sourceMappingURL=workspaceSettingsTrustCacheService.js.map