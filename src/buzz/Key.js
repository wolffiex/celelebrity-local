export function Key(id) {
    return new KeyClass(id);
}

export function isKey(v) {
    return v instanceof KeyClass;
}


function KeyClass(id) {
    this.id = id;
    Object.freeze(this);
}
