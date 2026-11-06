"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDictionaryReferenceRanges = void 0;
const DIRECT_DICTIONARY_PROPERTIES = new Set(['name', 'display_name', 'item_name']);
function findDictionaryReferenceRanges(text) {
    const lines = text.split('\n');
    const ranges = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const direct = line.match(/^(\s*)([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/);
        if (direct && DIRECT_DICTIONARY_PROPERTIES.has(direct[2])) {
            const valueRange = readYamlScalarValue(line, direct[0].indexOf(direct[3]));
            if (valueRange) {
                ranges.push({ line: lineIndex, ...valueRange });
            }
            continue;
        }
        const lore = line.match(/^(\s*)lore\s*:\s*$/);
        if (!lore) {
            continue;
        }
        const loreIndent = lore[1].length;
        for (let nextLineIndex = lineIndex + 1; nextLineIndex < lines.length; nextLineIndex++) {
            const nextLine = lines[nextLineIndex];
            if (!nextLine.trim()) {
                continue;
            }
            const indent = nextLine.match(/^\s*/)?.[0].length ?? 0;
            if (indent <= loreIndent) {
                break;
            }
            const item = nextLine.match(/^(\s*)-\s+(.+?)\s*$/);
            if (!item) {
                continue;
            }
            const valueRange = readYamlScalarValue(nextLine, item[0].indexOf(item[2]));
            if (valueRange) {
                ranges.push({ line: nextLineIndex, ...valueRange });
            }
        }
    }
    return ranges;
}
exports.findDictionaryReferenceRanges = findDictionaryReferenceRanges;
function readYamlScalarValue(line, valueStart) {
    const raw = line.slice(valueStart).trimEnd();
    if (!raw || raw.includes(' ')) {
        return undefined;
    }
    const trimmedStart = line.indexOf(raw, valueStart);
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        const key = raw.slice(1, -1).trim();
        return key ? toReference(trimmedStart, trimmedStart + raw.length, key) : undefined;
    }
    return toReference(trimmedStart, trimmedStart + raw.length, raw);
}
function toReference(startCharacter, endCharacter, rawKey) {
    const langMatch = rawKey.match(/^<lang:([^>]+)>$/);
    if (langMatch) {
        return {
            startCharacter,
            endCharacter,
            key: langMatch[1],
            kind: 'minecraft_lang'
        };
    }
    return {
        startCharacter,
        endCharacter,
        key: rawKey,
        kind: 'dictionary'
    };
}
//# sourceMappingURL=dictionaryReferences.js.map