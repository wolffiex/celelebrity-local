export function Key(id, _isDelete) {
    return new KeyClass(id, _isDelete === true);
}

export function isKey(v) {
    return v instanceof KeyClass;
}


function KeyClass(id, isDelete) {
    this.id = id;
    this.isDelete = isDelete;
    Object.freeze(this);
}
