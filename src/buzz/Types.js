import {isKey} from './Key.js';

export const Types = Object.fromEntries([
    "number",
    "string",
    "boolean",
    "object",
    "Key",
].map(t => [t, Symbol(t)]));

export function getType(value) {
    if (value === null) throw new Error("Unexpected null value");

    if (isKey(value)) return Types.Key;
    const type = typeof value;
    if (type in Types) return Types[type];

    throw new Error("Unrecognized type for " + value);
}
