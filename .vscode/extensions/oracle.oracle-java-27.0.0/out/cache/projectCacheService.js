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
exports.ProjectCacheService = void 0;
const logger_1 = require("../logger");
const globalState_1 = require("../globalState");
const utils_1 = require("../utils");
const utils_2 = require("./utils");
const projectCacheValue_1 = require("./projectCacheValue");
class ProjectCacheService {
    constructor() {
        this.MAX_KEYS_SIZE = 5000;
        this.removingKeys = false;
        this.get = (key) => {
            try {
                const updatedKey = this.getUpdatedKey(key);
                const vscGlobalState = globalState_1.globalState.getExtensionContextInfo().getVscGlobalState();
                const value = vscGlobalState.get(updatedKey);
                if (value) {
                    this.put(updatedKey, projectCacheValue_1.ProjectCacheValue.fromObject(Object.assign(Object.assign({}, value), { lastUsed: Date.now() })));
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
                if (vscGlobalState.keys().length > this.MAX_KEYS_SIZE) {
                    this.removeOnOverflow();
                }
                logger_1.LOGGER.debug(`Updating key: ${key} to ${value}`);
                return true;
            }
            catch (err) {
                logger_1.LOGGER.error(`Error while storing ${key} in cache: ${err.message}`);
                return false;
            }
        });
        this.removeOnOverflow = () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.removingKeys) {
                    logger_1.LOGGER.log("Ignoring removing keys request, since it is already in progress");
                    return;
                }
                this.removingKeys = true;
                const vscGlobalState = globalState_1.globalState.getExtensionContextInfo().getVscGlobalState();
                const comparator = (a, b) => (a.lastUsed - b.lastUsed);
                yield (0, utils_2.removeEntriesOnOverflow)(vscGlobalState, projectCacheValue_1.ProjectCacheValue.type, comparator);
            }
            catch (error) {
                logger_1.LOGGER.error("Some error occurred while removing keys " + ((0, utils_1.isError)(error) ? error.message : error));
            }
            finally {
                this.removingKeys = false;
            }
        });
        // for unit tests needs to be public
        this.getUpdatedKey = (key) => `${projectCacheValue_1.ProjectCacheValue.type}.${key}`;
    }
}
exports.ProjectCacheService = ProjectCacheService;
//# sourceMappingURL=projectCacheService.js.map