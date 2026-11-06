"use strict";
/*
  Copyright (c) 2023-2025, Oracle and/or its affiliates.

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminalListeners = void 0;
const pseudoTerminal_1 = require("../../../views/pseudoTerminal");
const protocol_1 = require("../../protocol");
const writeOutputRequestHandler = (param) => {
    const outputTerminal = pseudoTerminal_1.LineBufferingPseudoterminal.getInstance(param.outputName);
    outputTerminal.acceptInput(param.message);
};
const showOutputRequestHandler = (param) => {
    const outputTerminal = pseudoTerminal_1.LineBufferingPseudoterminal.getInstance(param);
    outputTerminal.show();
};
const closeOutputRequestHandler = (param) => {
    const outputTerminal = pseudoTerminal_1.LineBufferingPseudoterminal.getInstance(param);
    outputTerminal.close();
};
const resetOutputRequestHandler = (param) => {
    const outputTerminal = pseudoTerminal_1.LineBufferingPseudoterminal.getInstance(param);
    outputTerminal.clear();
};
exports.terminalListeners = [{
        type: protocol_1.WriteOutputRequest.type,
        handler: writeOutputRequestHandler
    }, {
        type: protocol_1.ShowOutputRequest.type,
        handler: showOutputRequestHandler
    }, {
        type: protocol_1.CloseOutputRequest.type,
        handler: closeOutputRequestHandler
    }, {
        type: protocol_1.ResetOutputRequest.type,
        handler: resetOutputRequestHandler
    }];
//# sourceMappingURL=terminal.js.map