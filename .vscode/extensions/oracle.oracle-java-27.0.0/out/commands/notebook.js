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
exports.registerNotebookCommands = void 0;
const os = require("os");
const path = require("path");
const fs = require("fs");
const logger_1 = require("../logger");
const vscode_1 = require("vscode");
const utils_1 = require("../utils");
const commands_1 = require("./commands");
const globalState_1 = require("../globalState");
const utils_2 = require("./utils");
const localiser_1 = require("../localiser");
const constants_1 = require("../constants");
const notebook_1 = require("../notebooks/notebook");
const crypto_1 = require("crypto");
const handlers_1 = require("../configurations/handlers");
const configuration_1 = require("../configurations/configuration");
const kernel_1 = require("../notebooks/kernel");
const createNewNotebook = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let notebookDir = null;
        if (!ctx) {
            let defaultUri = null;
            const activeFilePath = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri;
            if (activeFilePath) {
                const parentDir = utils_1.FileUtils.toUri(path.dirname(activeFilePath.fsPath));
                if (vscode_1.workspace.getWorkspaceFolder(parentDir)) {
                    defaultUri = parentDir;
                }
            }
            if (defaultUri == null) {
                const workspaceFolders = vscode_1.workspace.workspaceFolders;
                defaultUri = (workspaceFolders === null || workspaceFolders === void 0 ? void 0 : workspaceFolders.length) === 1 ? workspaceFolders[0].uri : null;
                if (defaultUri == null) {
                    if (workspaceFolders && workspaceFolders.length > 1) {
                        const userPref = yield vscode_1.window.showWorkspaceFolderPick({
                            placeHolder: localiser_1.l10n.value("jdk.notebook.create.select.workspace.folder"),
                            ignoreFocusOut: true
                        });
                        if (userPref) {
                            defaultUri = userPref.uri;
                        }
                    }
                }
                if (defaultUri == null) {
                    defaultUri = utils_1.FileUtils.toUri(os.homedir());
                }
            }
            const nbFolderPath = yield vscode_1.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                defaultUri,
                openLabel: localiser_1.l10n.value("jdk.notebook.create.select.workspace.folder.label"),
                title: localiser_1.l10n.value("jdk.notebook.create.select.workspace.folder.title")
            });
            if (nbFolderPath) {
                notebookDir = nbFolderPath[0];
            }
        }
        else {
            notebookDir = (0, utils_2.getContextUriFromFile)(ctx) || null;
        }
        if (notebookDir == null) {
            vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.create.error_msg.path.not.selected"));
            return;
        }
        else if (!fs.existsSync(notebookDir.fsPath)) {
            vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.create.error_msg.dir.not.found"));
            return;
        }
        const notebookName = yield vscode_1.window.showInputBox({
            prompt: localiser_1.l10n.value("jdk.notebook.create.new.notebook.input.name"),
            value: `Untitled.${constants_1.extConstants.NOTEBOOK_FILE_EXTENSION}`
        });
        if (!(notebookName === null || notebookName === void 0 ? void 0 : notebookName.trim())) {
            vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.create.error_msg.invalid.notebook.name"));
            return;
        }
        const notebookNameWithExt = notebookName.endsWith(constants_1.extConstants.NOTEBOOK_FILE_EXTENSION) ?
            notebookName : `${notebookName}.${constants_1.extConstants.NOTEBOOK_FILE_EXTENSION}`;
        const finalNotebookPath = path.join(notebookDir.fsPath, notebookNameWithExt);
        logger_1.LOGGER.log(`Attempting to create notebook at: ${finalNotebookPath}`);
        if (fs.existsSync(finalNotebookPath)) {
            vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.create.error_msg.invalid.notebook.path"));
            return;
        }
        const newCell = {
            cell_type: 'code',
            execution_count: null,
            outputs: [],
            id: (0, crypto_1.randomUUID)(),
            metadata: {},
            source: ''
        };
        const emptyNotebook = new notebook_1.Notebook([newCell]).toJSON();
        yield fs.promises.writeFile(finalNotebookPath, JSON.stringify(emptyNotebook, null, 2), { encoding: 'utf8' });
        logger_1.LOGGER.log(`Created notebook at: ${finalNotebookPath}`);
        const notebookUri = utils_1.FileUtils.toUri(finalNotebookPath);
        const notebookDocument = yield vscode_1.workspace.openNotebookDocument(notebookUri);
        yield vscode_1.window.showNotebookDocument(notebookDocument);
    }
    catch (error) {
        logger_1.LOGGER.error(`Error occurred while creating new notebook: ${(0, utils_1.isError)(error) ? error.message : error}`);
        vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.create.error_msg.failed"));
    }
});
const openJshellInContextOfProject = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let client = yield globalState_1.globalState.getClientPromise().client;
        if (yield (0, utils_2.isNbCommandRegistered)(commands_1.nbCommands.openJshellInProject)) {
            const additionalContext = (_a = vscode_1.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.toString();
            const res = yield vscode_1.commands.executeCommand(commands_1.nbCommands.openJshellInProject, ctx === null || ctx === void 0 ? void 0 : ctx.toString(), additionalContext);
            const jshell = os.type() === 'Windows_NT' ? 'jshell.exe' : 'jshell';
            const jshellPath = res.jdkPath ? path.join(res.jdkPath, "bin", jshell) : "jshell";
            const terminal = vscode_1.window.createTerminal({
                name: "Jshell instance", shellPath: jshellPath, shellArgs: res.vmOptions
            });
            terminal.show();
        }
        else {
            throw localiser_1.l10n.value("jdk.extension.error_msg.doesntSupportJShellExecution", { client: client === null || client === void 0 ? void 0 : client.name });
        }
    }
    catch (error) {
        vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.jshell.open.error_msg.failed"));
        logger_1.LOGGER.error(`Error occurred while launching jshell in project context : ${(0, utils_1.isError)(error) ? error.message : error}`);
    }
});
const notebookChangeProjectContextHandler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uri = ctx.notebookEditor.notebookUri;
        let client = yield globalState_1.globalState.getClientPromise().client;
        if (yield (0, utils_2.isNbCommandRegistered)(commands_1.nbCommands.createNotebookProjectContext)) {
            const res = yield vscode_1.commands.executeCommand(commands_1.nbCommands.createNotebookProjectContext, uri.toString());
            if (!res) {
                return;
            }
            const oldValue = (0, handlers_1.getConfigurationValue)(configuration_1.configKeys.notebookProjectMapping, {});
            const newValue = Object.assign(Object.assign({}, oldValue), { [uri.fsPath]: res });
            if (oldValue[uri.fsPath] !== newValue[uri.fsPath]) {
                (0, handlers_1.updateConfigurationValue)(configuration_1.configKeys.notebookProjectMapping, newValue, vscode_1.ConfigurationTarget.Workspace);
                const yes = localiser_1.l10n.value("jdk.extension.cache.label.confirmation.yes");
                const cancel = localiser_1.l10n.value("jdk.extension.cache.label.confirmation.cancel");
                const confirmation = yield vscode_1.window.showWarningMessage(localiser_1.l10n.value("jdk.notebook.project.context.changed.restart.kernel.msg.consent"), yes, cancel);
                if (confirmation === yes) {
                    yield restartKernel(ctx, true);
                }
            }
        }
        else {
            throw localiser_1.l10n.value("jdk.extension.error_msg.doesntSupportNotebookCellExecution", { client: client === null || client === void 0 ? void 0 : client.name });
        }
    }
    catch (error) {
        logger_1.LOGGER.error(`Error occurred while opening notebook : ${(0, utils_1.isError)(error) ? error.message : error}`);
        vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.project.mapping.error_msg.failed"));
    }
});
const restartKernel = (ctx_1, ...args_1) => __awaiter(void 0, [ctx_1, ...args_1], void 0, function* (ctx, skipConfirmation = false) {
    try {
        const uri = ctx.notebookEditor.notebookUri;
        const yes = localiser_1.l10n.value("jdk.extension.cache.label.confirmation.yes");
        const cancel = localiser_1.l10n.value("jdk.extension.cache.label.confirmation.cancel");
        const confirmation = skipConfirmation ? yes : yield vscode_1.window.showWarningMessage(localiser_1.l10n.value("jdk.notebook.restart.kernel.msg.consent"), yes, cancel);
        if (confirmation === yes) {
            let client = yield globalState_1.globalState.getClientPromise().client;
            if (!(yield (0, utils_2.isNbCommandRegistered)(commands_1.nbCommands.resetNotebookSession))) {
                throw new Error(`Language Server for ${client === null || client === void 0 ? void 0 : client.name} doesn't support notebook restart kernel`);
            }
            yield vscode_1.commands.executeCommand(commands_1.nbCommands.resetNotebookSession, uri.toString());
            kernel_1.notebookKernel.resetKernelCounter(uri);
            vscode_1.window.showInformationMessage(localiser_1.l10n.value("jdk.notebook.restart.kernel.msg.success"));
        }
    }
    catch (error) {
        logger_1.LOGGER.error(`Error occurred while restarting kernel: ${(0, utils_1.isError)(error) ? error.message : error}`);
        vscode_1.window.showErrorMessage(localiser_1.l10n.value("jdk.notebook.restart.kernel.error_msg.failed"));
    }
});
exports.registerNotebookCommands = [
    {
        command: commands_1.extCommands.createNotebook,
        handler: createNewNotebook
    },
    {
        command: commands_1.extCommands.openJshellInProject,
        handler: openJshellInContextOfProject
    },
    {
        command: commands_1.extCommands.notebookChangeProjectContext,
        handler: notebookChangeProjectContextHandler
    },
    {
        command: commands_1.extCommands.resetNotebookSession,
        handler: restartKernel
    }
];
//# sourceMappingURL=notebook.js.map