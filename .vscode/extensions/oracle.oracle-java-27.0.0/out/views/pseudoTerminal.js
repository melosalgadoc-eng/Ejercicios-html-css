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
exports.LineBufferingPseudoterminal = void 0;
const vscode_1 = require("vscode");
class LineBufferingPseudoterminal {
    constructor(name) {
        this.writeEmitter = new vscode_1.EventEmitter();
        this.onDidWrite = this.writeEmitter.event;
        this.closeEmitter = new vscode_1.EventEmitter();
        this.onDidClose = this.closeEmitter.event;
        this.buffer = '';
        this.isOpen = false;
        this.name = name;
    }
    open() {
        this.isOpen = true;
    }
    close() {
        this.isOpen = false;
        this.closeEmitter.fire();
    }
    /**
     * Accepts partial input strings and logs complete lines when they are formed.
     * Also processes carriage returns (\r) to overwrite the current line.
     * @param input The string input to the pseudoterminal.
     */
    acceptInput(input) {
        if (!this.isOpen) {
            return;
        }
        for (const char of input) {
            if (char === '\n') {
                // Process a newline: log the current buffer and reset it
                this.logLine(this.buffer.trim());
                this.buffer = '';
            }
            else if (char === '\r') {
                // Process a carriage return: log the current buffer on the same line
                this.logInline(this.buffer.trim());
                this.buffer = '';
            }
            else {
                // Append characters to the buffer
                this.buffer += char;
            }
        }
    }
    logLine(line) {
        this.writeEmitter.fire(`${line}\r\n`);
    }
    logInline(line) {
        // Clear the current line and move the cursor to the start
        this.writeEmitter.fire(`\x1b[2K\x1b[1G${line}`);
    }
    flushBuffer() {
        if (this.buffer.trim().length > 0) {
            this.logLine(this.buffer.trim());
            this.buffer = '';
        }
    }
    clear() {
        this.writeEmitter.fire('\x1b[2J\x1b[3J\x1b[H'); // Clear screen and move cursor to top-left
    }
    show() {
        if (!this.terminal) {
            this.terminal = vscode_1.window.createTerminal({
                name: this.name,
                pty: this,
            });
        }
        this.terminal.show(true);
    }
    /**
     * Gets an existing instance or creates a new one by the terminal name.
     * The terminal is also created and managed internally.
     * @param name The name of the pseudoterminal.
     * @returns The instance of the pseudoterminal.
     */
    static getInstance(name) {
        if (!this.instances.has(name)) {
            const instance = new LineBufferingPseudoterminal(name);
            this.instances.set(name, instance);
        }
        const instance = this.instances.get(name);
        instance.show();
        return instance;
    }
}
exports.LineBufferingPseudoterminal = LineBufferingPseudoterminal;
LineBufferingPseudoterminal.instances = new Map();
//# sourceMappingURL=pseudoTerminal.js.map