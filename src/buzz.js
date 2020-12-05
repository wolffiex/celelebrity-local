import { useState } from 'react';
var wu = require("wu");

function newKey() {
    return btoa(Math.random());
}

function node() {
    const nodeKey = newKey();
    const valuesCache = createValuesCache();

    function useBuzz(schema) {
        const [{id}, update] = useState({id : schema.id || newKey()});
        const invalidate = () => update({id});
        const getValues = id => valuesCache.get(id, invalidate);
        const result = getResult(id, schema, getValues);

        function writer(values) {
            let setObj = {};
            function set(k, v) {
                setObj[k] = v;
            }
            for (const [propName, propValue] of Object.entries(values)){
                const propDef = schema[propName];
                const propType = getPropType(propDef);
                if (propType === "Last" || propType === "List") {
                    const subId = propValue.id || newKey();
                    valuesCache.append(subId, propValue);
                    set(propName, {id: subId});
                } else {
                    set(propName, propValue);
                }
            }
            valuesCache.append(id, setObj);
        }

        return [result, writer];
    }

    return {useBuzz, toString: () => 'Buzz node ' + nodeKey};
}

function getResult(id, schema, getValues) {
    Object.freeze(schema);
    let result = {
        get id() {
            return id;
        },
        get schema() {
            return schema;
        }
    };

    const valuesList = getValues(id);
    for (const [propName, propDef] of Object.entries(schema)) {
        if (propDef == null) throw new Error("Invalid property definition", propName);
        Object.defineProperty(result, 
            propName, defineProp(propDef, iterateValues(propName, valuesList), getValues, propName));
    }
    return result;
}

function getPropType(propDef) {
    if (propDef == null) {
        throw new Error("Invalid propDef");
    }

    if (propDef instanceof BuzzLast) {
        return "Last";
    } else if (propDef instanceof Object) {
        return "List"
    } else {
        return typeof propDef;
    }
}

function defineProp(propDef, getPropValues, getValues, pname) {
    let get;
    function* iterateConnection(schema) {
        const seenMap = new Map();
        for (let value of getPropValues()) {
            let id = value.id;
            // TODO: Handle deletes
            if (!seenMap.has(id)) {
                const result = getResult(id, schema, getValues);
                yield result;
            }
            seenMap.set(id, true);
        }
    }

    function first(it, fallback) {
        const {value, done} = it.next();

        return done && value === undefined ? fallback : value;
    }

    switch(getPropType(propDef)) {
        case "Last":
            get = () => first(iterateConnection(propDef.schema), null);
            break;
        case "List":
            get = () => wu(iterateConnection(propDef));
            break;
        default:
            get = () => first(getPropValues(), propDef);
            break;
    }
    return {get, enumerable: true}
}

function iterateValues(propName, valuesList) {
    return function* () {
        for (var i = valuesList.length-1; i >=0; i--) {
            const values = valuesList[i];
            if (propName in values) yield values[propName]
        }
    }
}

function enumerate(...variants) {
    return new BuzzEnum(variants);
}

function BuzzEnum(variants) {
    for (var k of variants) {
        this[k] = new BuzzEnumVariant(this);
    }
}

function BuzzEnumVariant(enumeration) {
    this.enumeration = enumeration;
}

function BuzzLast(schema) {
    Object.freeze(schema);
    this.schema = schema;
}

function last(schema) {
    return new BuzzLast(schema);
}

const Buzz = {node, enumerate, last, key: newKey};
export default Buzz;

function createValuesCache() {
    let callbackMap = new Map();
    let valuesMap = new Map();

    function get(id, invalidate) {
        const oldCallback = callbackMap.get(id);
        callbackMap.set(id, function() {
            invalidate();
            oldCallback && oldCallback();
        });

        return _get(id);
    }

    function append(id, values) {
        valuesMap.set(id, _get(id).concat(values));
        const callback = callbackMap.get(id);
        callbackMap.delete(id);
        callback && callback();
    }

    function _get(id) {
        return valuesMap.get(id) || [];
    }

    return {get, append};
}
