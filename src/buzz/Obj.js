function Obj(id, schema, snapshot) {
    const obj = schema.keys().reduce((o, propName) => {
        const get = once(() => schema.get(propName).read(id, snapshot, Obj));
        Object.defineProperty(o, propName, {get, enumerable: true});
        return o;
    }, {});
}
    
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

export function getResult(id, schema, snapshot) {
    let result = {
        get id() {
            return id;
        },
        get schema() {
            return schema;
        }
    };

    schema.entries(id, snapshot).forEach(({name, def}) =>
        Object.defineProperty(result, name, def));
        
    return result;
}

