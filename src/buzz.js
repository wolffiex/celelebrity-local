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

    for (const [propName, propDef] of Object.entries(schema)) {
        if (propDef == null) throw new Error("Invalid property definition", propName);
        const getPropValues = () => getValues(id).filter(e => propName in e).pluck(propName);
        Object.defineProperty(result, propName, defineProp(propDef, getPropValues, getValues));
    }
    return result;
}

function defineProp(propDef, getPropValues, getValues) {
    let get;
    function iterateConnection(schema) {
        const seenMap = new Map();
        return getPropValues()
            .reject(value => seenMap.has(value.id))
            .tap(value => seenMap.set(value.id))
            .reject(value => value instanceof BuzzDeleted)
            .map(value => getResult(value.id, schema, getValues))
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
            get = () => iterateConnection(propDef);
            break;
        default:
            get = () => first(getPropValues(), propDef);
            break;
    }
    return {get, enumerable: true}
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

    let currentChunk = []; //list of key, id, values
    let chunks = [];
    function receiveExternalChunk(chunk) {
        chunks = [currentChunk, chunk, ...chunks];
        currentChunk = [];
        //for entry in chunk, notify
        wu(chunk).pluck('id').forEach(notify);
    }

    function get(id, invalidate) {
        const oldCallback = callbackMap.get(id);
        callbackMap.set(id, function() {
            invalidate();
            oldCallback && oldCallback();
        });

        const log = wu.flatten(chunks);
        return getEntries()
            .filter(entry => entry.id === id)
            .pluck('values');
    }


    function getEntries(since) {
        const log = wu.flatten(chunks);
        return wu.chain(currentChunk, log)
            .takeWhile(entry => entry.key != since);
    }

    function notify(id) {
        const callback = callbackMap.get(id);
        callbackMap.delete(id);
        callback && callback();
    }

    function append(id, values) {
        const key = newKey();
        currentChunk.unshift({id, values, key});
        notify(id);
    }

    return {get, append};
}

function BuzzDeleted() {
}
