/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotebookCellStateRequest = exports.NotebookCellExecutionResult = exports.ResetOutputRequest = exports.CloseOutputRequest = exports.ShowOutputRequest = exports.WriteOutputRequest = exports.NodeInfoRequest = exports.NodeInfoNotification = exports.NodeChangeType = exports.SaveDocumentsRequest = exports.TextEditorDecorationDisposeNotification = exports.TextEditorDecorationSetNotification = exports.TextEditorDecorationCreateRequest = exports.TestProgressNotification = exports.MutliStepInputRequest = exports.InputBoxRequest = exports.QuickPickRequest = exports.StatusMessageRequest = exports.UpdateConfigurationRequest = exports.ExecInHtmlPageRequest = exports.HtmlPageRequest = void 0;
exports.asPosition = asPosition;
exports.asRange = asRange;
exports.asRanges = asRanges;
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
var HtmlPageRequest;
(function (HtmlPageRequest) {
    HtmlPageRequest.type = new vscode_languageclient_1.ProtocolRequestType('window/showHtmlPage');
})(HtmlPageRequest || (exports.HtmlPageRequest = HtmlPageRequest = {}));
;
var ExecInHtmlPageRequest;
(function (ExecInHtmlPageRequest) {
    ExecInHtmlPageRequest.type = new vscode_languageclient_1.ProtocolRequestType('window/execInHtmlPage');
})(ExecInHtmlPageRequest || (exports.ExecInHtmlPageRequest = ExecInHtmlPageRequest = {}));
;
var UpdateConfigurationRequest;
(function (UpdateConfigurationRequest) {
    UpdateConfigurationRequest.type = new vscode_languageclient_1.ProtocolRequestType('config/update');
})(UpdateConfigurationRequest || (exports.UpdateConfigurationRequest = UpdateConfigurationRequest = {}));
var StatusMessageRequest;
(function (StatusMessageRequest) {
    StatusMessageRequest.type = new vscode_languageclient_1.ProtocolNotificationType('window/showStatusBarMessage');
})(StatusMessageRequest || (exports.StatusMessageRequest = StatusMessageRequest = {}));
;
var QuickPickRequest;
(function (QuickPickRequest) {
    QuickPickRequest.type = new vscode_languageclient_1.ProtocolRequestType('window/showQuickPick');
})(QuickPickRequest || (exports.QuickPickRequest = QuickPickRequest = {}));
var InputBoxRequest;
(function (InputBoxRequest) {
    InputBoxRequest.type = new vscode_languageclient_1.ProtocolRequestType('window/showInputBox');
})(InputBoxRequest || (exports.InputBoxRequest = InputBoxRequest = {}));
var MutliStepInputRequest;
(function (MutliStepInputRequest) {
    MutliStepInputRequest.type = new vscode_languageclient_1.ProtocolRequestType('window/showMultiStepInput');
    MutliStepInputRequest.step = new vscode_languageclient_1.ProtocolRequestType('input/step');
    MutliStepInputRequest.validate = new vscode_languageclient_1.ProtocolRequestType('input/validate');
})(MutliStepInputRequest || (exports.MutliStepInputRequest = MutliStepInputRequest = {}));
var TestProgressNotification;
(function (TestProgressNotification) {
    TestProgressNotification.type = new vscode_languageclient_1.ProtocolNotificationType('window/notifyTestProgress');
})(TestProgressNotification || (exports.TestProgressNotification = TestProgressNotification = {}));
;
;
var TextEditorDecorationCreateRequest;
(function (TextEditorDecorationCreateRequest) {
    TextEditorDecorationCreateRequest.type = new vscode_languageclient_1.ProtocolRequestType('window/createTextEditorDecoration');
})(TextEditorDecorationCreateRequest || (exports.TextEditorDecorationCreateRequest = TextEditorDecorationCreateRequest = {}));
;
var TextEditorDecorationSetNotification;
(function (TextEditorDecorationSetNotification) {
    TextEditorDecorationSetNotification.type = new vscode_languageclient_1.ProtocolNotificationType('window/setTextEditorDecoration');
})(TextEditorDecorationSetNotification || (exports.TextEditorDecorationSetNotification = TextEditorDecorationSetNotification = {}));
;
var TextEditorDecorationDisposeNotification;
(function (TextEditorDecorationDisposeNotification) {
    TextEditorDecorationDisposeNotification.type = new vscode_languageclient_1.ProtocolNotificationType('window/disposeTextEditorDecoration');
})(TextEditorDecorationDisposeNotification || (exports.TextEditorDecorationDisposeNotification = TextEditorDecorationDisposeNotification = {}));
var SaveDocumentsRequest;
(function (SaveDocumentsRequest) {
    SaveDocumentsRequest.type = new vscode_languageclient_1.ProtocolRequestType('window/documentSave');
})(SaveDocumentsRequest || (exports.SaveDocumentsRequest = SaveDocumentsRequest = {}));
var NodeChangeType;
(function (NodeChangeType) {
    NodeChangeType[NodeChangeType["SELF"] = 0] = "SELF";
    NodeChangeType[NodeChangeType["PROPERTY"] = 1] = "PROPERTY";
    NodeChangeType[NodeChangeType["CHILDEN"] = 2] = "CHILDEN";
    NodeChangeType[NodeChangeType["DESTROY"] = 3] = "DESTROY";
})(NodeChangeType || (exports.NodeChangeType = NodeChangeType = {}));
;
var NodeInfoNotification;
(function (NodeInfoNotification) {
    NodeInfoNotification.type = new vscode_languageclient_1.ProtocolNotificationType('nodes/nodeChanged');
})(NodeInfoNotification || (exports.NodeInfoNotification = NodeInfoNotification = {}));
var NodeInfoRequest;
(function (NodeInfoRequest) {
    NodeInfoRequest.explorermanager = new vscode_languageclient_1.ProtocolRequestType('nodes/explorermanager');
    NodeInfoRequest.info = new vscode_languageclient_1.ProtocolRequestType('nodes/info');
    NodeInfoRequest.children = new vscode_languageclient_1.ProtocolRequestType('nodes/children');
    NodeInfoRequest.destroy = new vscode_languageclient_1.ProtocolRequestType('nodes/delete');
    NodeInfoRequest.collapsed = new vscode_languageclient_1.ProtocolNotificationType('nodes/collapsed');
    NodeInfoRequest.getresource = new vscode_languageclient_1.ProtocolRequestType('nodes/getresource');
    NodeInfoRequest.findparams = new vscode_languageclient_1.ProtocolRequestType('nodes/findpath');
    NodeInfoRequest.changes = new vscode_languageclient_1.ProtocolRequestType('nodes/changes');
})(NodeInfoRequest || (exports.NodeInfoRequest = NodeInfoRequest = {}));
;
function asPosition(value) {
    if (!value) {
        return undefined;
    }
    return new vscode.Position(value.line, value.character);
}
function asRange(value) {
    if (!value) {
        return undefined;
    }
    return new vscode.Range(asPosition(value.start), asPosition(value.end));
}
function asRanges(value) {
    return value.map(value => asRange(value));
}
var WriteOutputRequest;
(function (WriteOutputRequest) {
    WriteOutputRequest.type = new vscode_languageclient_1.ProtocolRequestType('output/write');
})(WriteOutputRequest || (exports.WriteOutputRequest = WriteOutputRequest = {}));
var ShowOutputRequest;
(function (ShowOutputRequest) {
    ShowOutputRequest.type = new vscode_languageclient_1.ProtocolRequestType('output/show');
})(ShowOutputRequest || (exports.ShowOutputRequest = ShowOutputRequest = {}));
var CloseOutputRequest;
(function (CloseOutputRequest) {
    CloseOutputRequest.type = new vscode_languageclient_1.ProtocolRequestType('output/close');
})(CloseOutputRequest || (exports.CloseOutputRequest = CloseOutputRequest = {}));
var ResetOutputRequest;
(function (ResetOutputRequest) {
    ResetOutputRequest.type = new vscode_languageclient_1.ProtocolRequestType('output/reset');
})(ResetOutputRequest || (exports.ResetOutputRequest = ResetOutputRequest = {}));
var NotebookCellExecutionResult;
(function (NotebookCellExecutionResult) {
    let STATUS;
    (function (STATUS) {
        STATUS["QUEUED"] = "QUEUED";
        STATUS["EXECUTING"] = "EXECUTING";
        STATUS["SUCCESS"] = "SUCCESS";
        STATUS["FAILURE"] = "FAILURE";
        STATUS["INTERRUPTED"] = "INTERRUPTED";
    })(STATUS = NotebookCellExecutionResult.STATUS || (NotebookCellExecutionResult.STATUS = {}));
    NotebookCellExecutionResult.type = new vscode_languageclient_1.ProtocolNotificationType('notebook/execution/progress');
})(NotebookCellExecutionResult || (exports.NotebookCellExecutionResult = NotebookCellExecutionResult = {}));
var NotebookCellStateRequest;
(function (NotebookCellStateRequest) {
    NotebookCellStateRequest.type = new vscode_languageclient_1.ProtocolRequestType('notebook/cell/state');
})(NotebookCellStateRequest || (exports.NotebookCellStateRequest = NotebookCellStateRequest = {}));
//# sourceMappingURL=protocol.js.map