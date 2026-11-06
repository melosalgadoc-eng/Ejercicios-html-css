"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYamlSameLevelPropertiesFromText = exports.getYamlParentPathFromText = void 0;
function getYamlParentPathFromText(text, position) {
    const lines = text.split('\n');
    const indentStack = [];
    const currentLine = lines[position.line] ?? '';
    const arrayIndent = currentLine.match(/^(\s*)-\s+/)?.[1].length;
    let currentIndent = arrayIndent === undefined ? position.character : arrayIndent + 1;
    for (let i = position.line; i >= 0; i--) {
        const line = lines[i] ?? '';
        const arrayMatch = line.match(/^(\s*)-\s+/);
        if (arrayMatch) {
            const indent = arrayMatch[1].length;
            if (i !== position.line && indent < currentIndent) {
                currentIndent = indent;
            }
            continue;
        }
        const keyMatch = line.match(/^(\s*)([^:]+):/);
        if (keyMatch) {
            const indent = keyMatch[1].length;
            const key = keyMatch[2];
            if (indent < currentIndent) {
                indentStack.push({ indent, key });
                currentIndent = indent;
            }
        }
    }
    return indentStack.reverse().map(item => item.key);
}
exports.getYamlParentPathFromText = getYamlParentPathFromText;
function getYamlSameLevelPropertiesFromText(text, position) {
    const lines = text.split('\n');
    const properties = [];
    const currentIndent = position.character;
    for (let i = position.line; i >= 0; i--) {
        const line = lines[i] ?? '';
        const match = line.match(/^(\s*)([^:]+):/);
        if (!match) {
            continue;
        }
        const indent = match[1].length;
        const key = match[2];
        if (indent === currentIndent) {
            properties.push(key);
        }
        else if (indent < currentIndent) {
            break;
        }
    }
    return properties;
}
exports.getYamlSameLevelPropertiesFromText = getYamlSameLevelPropertiesFromText;
//# sourceMappingURL=yamlPath.js.map