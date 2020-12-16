function Obj(id, schema, snapshot) {
    let result = {
        get id() {
            return id;
        },
        get schema() {
            return schema;
        }
    };

    function getGet(name) {
        return () => schema.getValue(id, name, snapshot);
    }

    schema.keys().forEach(name =>
        Object.defineProperty(result, name, {get: getGet(name)}));
        
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

