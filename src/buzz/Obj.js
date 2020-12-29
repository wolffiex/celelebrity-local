import {get} from './Schema.js';
function Obj(key, schemaDef, snapshot) {
    let result = {
        get key() {
            return key;
        }
    };

    Object.keys(schemaDef).forEach(name => Object.defineProperty(result, name,
        {get: () => get([key], name, snapshot, schemaDef)}
    ));

    Object.freeze(result);
        
    return result;
}
    
export function getResult(id, schema, snapshot) {
    return Obj(id, schema, snapshot);
}

