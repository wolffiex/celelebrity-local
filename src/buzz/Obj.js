import {get} from './Schema.js';
function Obj(key, schemaDef, snapshot) {
    let result = {
        get key() {
            return id;
        }
    };

    Object.keys(schemaDef).forEach(name => Object.defineProperty(result, name,
        {get: () => get([key], name, snapshot, schemaDef)}
    ));

    Object.freeze(result);
        
    return result;
}
    
/*
const UNSET = Symbol();
function once(getValue) {
    let value = UNSET;
    return function () {
        if (value === UNSET) {
            value = getValue();
        }
        return value;
    }
}
*/

export function getResult(id, schema, snapshot) {
    return Obj(id, schema, snapshot);
}

