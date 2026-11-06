"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCollectionBlockRanges = exports.findItemBlockRanges = exports.findDisabledBlockRanges = void 0;
const collectionPathCache = new WeakMap();
function findDisabledBlockRanges(text) {
    const lines = text.split('\n');
    const ranges = [];
    lines.forEach((line, lineIndex) => {
        if (!/^\s*enabled:\s*false\b/.test(line)) {
            return;
        }
        const ownIndent = indentOf(line);
        let startLine = lineIndex;
        let parentIndent = ownIndent;
        for (let index = lineIndex - 1; index >= 0; index--) {
            if (!lines[index].trim()) {
                continue;
            }
            const indent = indentOf(lines[index]);
            if (indent < ownIndent) {
                startLine = index;
                parentIndent = indent;
                break;
            }
        }
        let endLine = lines.length - 1;
        for (let index = startLine + 1; index < lines.length; index++) {
            if (!lines[index].trim()) {
                continue;
            }
            if (index !== startLine && indentOf(lines[index]) <= parentIndent) {
                endLine = index - 1;
                break;
            }
        }
        ranges.push({ startLine, endLine, endCharacter: lines[endLine]?.length ?? 0 });
    });
    return ranges;
}
exports.findDisabledBlockRanges = findDisabledBlockRanges;
function findItemBlockRanges(text) {
    return findNamedCollectionBlockRanges(text, new Set(['items']));
}
exports.findItemBlockRanges = findItemBlockRanges;
function findCollectionBlockRanges(text, schemas) {
    return findNamedCollectionBlockRanges(text, collectionPathsFromSchema(schemas));
}
exports.findCollectionBlockRanges = findCollectionBlockRanges;
function findNamedCollectionBlockRanges(text, collectionPaths) {
    const lines = text.split('\n');
    const entries = yamlKeyEntries(lines);
    const ranges = [];
    for (const entry of entries) {
        if (!collectionPaths.has(pathKey(entry.parentPath))) {
            continue;
        }
        if (entry.parentPath.length === 0) {
            continue;
        }
        ranges.push({
            startLine: entry.line,
            endLine: findEntryEndLine(lines, entries, entry)
        });
    }
    return ranges;
}
function findEntryEndLine(lines, entries, entry) {
    const nextBoundary = entries.find(candidate => candidate.line > entry.line &&
        candidate.indent <= entry.indent);
    return nextBoundary?.line ?? lines.length;
}
function yamlKeyEntries(lines) {
    const entries = [];
    const parents = [];
    lines.forEach((lineText, line) => {
        if (/^\s*-\s+/.test(lineText)) {
            return;
        }
        const match = lineText.match(/^(\s*)([^:#][^:]*):/);
        if (!match) {
            return;
        }
        const indent = match[1].length;
        const key = match[2].trimEnd();
        while (parents.length > 0 && parents[parents.length - 1].indent >= indent) {
            parents.pop();
        }
        const valueText = lineText.slice(match[0].length).trim();
        const hasNestedValue = valueText === '' || valueText.startsWith('#');
        entries.push({
            line,
            indent,
            key,
            parentPath: parents.map(parent => parent.key),
            hasNestedValue
        });
        if (hasNestedValue) {
            parents.push({ indent, key });
        }
    });
    return entries;
}
function collectionPathsFromSchema(schemas) {
    if (!schemas || typeof schemas !== 'object') {
        return new Set();
    }
    const cached = collectionPathCache.get(schemas);
    if (cached) {
        return cached;
    }
    const paths = new Set();
    collectCollectionPaths(schemas, [], paths, schemas, new Set());
    collectionPathCache.set(schemas, paths);
    return paths;
}
function collectCollectionPaths(node, path, paths, root, visitedRefs) {
    const schema = resolveSchemaRef(node, root, visitedRefs);
    if (!schema || typeof schema !== 'object') {
        return;
    }
    if (path.length > 0 && schema.additionalProperties) {
        paths.add(pathKey(path));
    }
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
        collectCollectionPaths(value, [...path, key], paths, root, new Set(visitedRefs));
    }
}
function resolveSchemaRef(node, root, visitedRefs) {
    if (!node?.$ref) {
        return node;
    }
    const ref = String(node.$ref);
    if (visitedRefs.has(ref)) {
        return node;
    }
    visitedRefs.add(ref);
    const refKey = ref.split('/').pop();
    return refKey ? root.$defs?.[refKey] ?? node : node;
}
function pathKey(path) {
    return path.join('\u0000');
}
function indentOf(line) {
    return line.match(/^\s*/)?.[0].length ?? 0;
}
//# sourceMappingURL=decorationRanges.js.map