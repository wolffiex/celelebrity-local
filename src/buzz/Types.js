export const Types = Object.fromEntries([
    "number",
    "string",
    "boolean",
    "object",
    "Key",
    "Assoc",
    "Last",
    "Constant",
].map(t => [t, Symbol(t)]));

export function getType(value) {
    if (value instanceof InputTypeClass) return value.type

    const type = typeof value;
    if (type === "object") {
        if (value === null) throw new Error("Null value given");
        return Types.object
    }

    if (type in Types) return Types[type];

    throw new Error("Unrecognized type for " + value);
}

export function InputType(type, ...args) {
    const o = new InputTypeClass(type, ...args);
    Object.freeze(o);
    return o;
}

function InputTypeClass(type, ...args) {
    this.type = type;
    this.args = args;
};
