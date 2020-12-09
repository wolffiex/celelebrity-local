import { useState } from 'react';
var wu = require("wu");

function newKey() {
    return btoa(Math.random());
}

function node() {
    const nodeKey = newKey();
    const valuesCache = createValuesCache();

    function debug() {
        console.log("BUZZ", nodeKey);
        let n = 0;
        for (let entry of valuesCache.getEntries()) {
            console.log(n++, entry.id, entry.values);
        }
    }

    function useBuzz(_schema) {
        const schema = makeSchema(_schema);
        const [{id}, update] = useState({id: newKey()});
        const invalidate = () => update({id});
        const getValues = id => valuesCache.get(id, invalidate);

        function writer(values) {
            console.log('writer called', values)
            let setObj = {};
            function set(k, v) {
                setObj[k] = v;
            }
            for (const [propName, propValue] of Object.entries(values)){
                const propDef = schema.get(propName);
                console.log(propName, propDef)
                console.log(id, propName, propValue, propDef.isAssoc());
                if (propDef.isAssoc()) {
                    const subId = newKey();
                    console.log('WHHH', propName, subId, propValue)
                    valuesCache.append(subId, propValue);
                    set(propName, {id: subId});
                } else {
                    set(propName, propValue);
                }
            }
            valuesCache.append(id, setObj);
            debug();
        }

        const result = getResult(id, schema, getValues);
        console.log('useBuzz', id, result)
        return [result, writer];
    }

    return {useBuzz, debug, toString: () => 'Buzz node ' + nodeKey};
}

function assert(x, msg) {
    if (!x) throw( new Error(msg));
}
function getResult(id, schema, getValues) {
    assert(schema instanceof Schema, "him dk");
    let result = {
        get id() {
            return id;
        },
        get schema() {
            return schema;
        }
    };

    for (const [propName, propDef] of schema.entries(id, getValues)) {
        Object.defineProperty(result, propName, propDef);
    }
    return result;
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

    return {get, append, getEntries};
}

function BuzzDeleted() {
}

function Schema(_schema) {
    if (_schema instanceof Schema) console.error("FIx this");
    function get(propName) {
        return propName in _schema ? 
            new PropDef(_schema[propName]) : null;
    }

    this.get = get
    this.matches = entry => {
        //🤔
    }
    this.entries = (id, getValues) => {
        function getGetPropValues(propName) {
            return function() {
                return getValues(id).filter(e => propName in e).pluck(propName);
            }
        }
        return Object.keys(_schema).map(propName => 
            [propName, get(propName).define(getGetPropValues(propName), getValues)]);
    }
}

function makeSchema(schemaOr_schema) {
    if (schemaOr_schema instanceof Schema) return schemaOr_schema;
    else return new Schema(schemaOr_schema);
}

function PropDef(schemaPropValue) {
    let type = null;
    let subSchema = null;
    if (schemaPropValue instanceof BuzzLast) {
        type = PropDef.Types.Last;
        subSchema = makeSchema(schemaPropValue.schema);
    } else if (schemaPropValue instanceof Object) {
        type = PropDef.Types.List;
        subSchema = makeSchema(schemaPropValue);
    } else {
        type = PropDef.Types[typeof schemaPropValue];
    }

    this.type = type;

    const isAssoc = () => !!subSchema;
    this.isAssoc = isAssoc
    this.define = (getPropValues, getValues) => {
        let get;
        if (isAssoc()) {
            const connection = () => iterateConnection(getPropValues(), getValues, subSchema);
            switch (type) {
                case PropDef.Types.Last:
                    get = () => first(connection(), null)
                    break;
                case PropDef.Types.List:
                    get = connection;
                    break;
                default:
                    throw new Error('Unexpected');
            }
        } else {
            get = () => {
                return first(getPropValues(), schemaPropValue);
            }
        }
        return {get, enumerable: true};
    }

    return typeof propDef;
}

function iterateConnection(propValues, getValues, schema) {
    const seenMap = new Map();
    return propValues
        .reject(value => seenMap.has(value.id))
        .tap(value => seenMap.set(value.id))
        .reject(value => value instanceof BuzzDeleted)
        .map(value => getResult(value.id, schema, getValues))
}

function first(it, fallback) {
    const {value, done} = it.next();
    console.log('first', value, done, fallback)
    console.log(done && (value === undefined) , fallback , value);
    return done && (value === undefined) ? fallback : value;
}

PropDef.Types = Object.fromEntries([
    "Last",
    "List",
    "Unique",
    "Reverse",
    "number",
    "string",
    "boolean",
].map(t => [t, Symbol(t)]));
