import { useState } from 'react';
import createValuesCache from './ValuesCache.js';

function newKey() {
    return btoa(Math.random()).slice(-8);
}

function node() {
    const nodeKey = newKey();
    const valuesCache = new createValuesCache(() => newKey());

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
        const snapshot = valuesCache.getSnapshot(invalidate);

        const write = (name, valueOrObj) => writeEntry(id, schema, name, valueOrObj);

        const result = getResult(id, schema, snapshot);
        return [result, write];
    }

    function writeEntry(id, schema, name, valueOrObj) {
        const propDef = schema.get(name);
        return propDef.isAssoc ?
            makeRef(id, name, propDef, valueOrObj) :
            valuesCache.appendValue(id, name, valueOrObj);
    }

    function makeRef(id, name, propDef, valueOrObj) {
        const refId = isRef(valueOrObj) ? valueOrObj : addRef(propDef.schema, valueOrObj);
        return valuesCache.appendRef(id, name, refId);
    }

    function addRef(schema, values) {
        const id = newKey();
        Object.entries(values)
            .forEach(([name, valueOrObj]) => writeEntry(id, schema, name, valueOrObj));
        return id;
    }

    return {useBuzz, debug, toString: () => 'Buzz node ' + nodeKey};
}

function assert(x, msg) {
    if (!x) throw( new Error(msg));
}
function getResult(id, schema, snapshot) {
    assert(schema instanceof Schema, "him dk");
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

function constant(id) {
    return new Constant(id);
}

function index(schema) {
    return new Index(schema);
}

class Constant {
    constructor(id) {
        this._id = id;
    }
    get id() {
        return this._id
    }
}

class Index{
    constructor(schemaOr_schema) {
        Object.defineProperty(this, 'schema', 
            {value: makeSchema(schemaOr_schema), writeable: false});
    }
}

const Buzz = {node, enumerate, last, key: newKey, constant, index};
export default Buzz;

class BuzzDeleted {
}

function Schema(_schema) {
    if (_schema instanceof Schema) console.error("FIx this");
    function get(name) {
        if (! (name in _schema)) {
            console.error("Property not found", name, _schema);
            throw new Error("Property not found");
        }
        return new PropDef(name, _schema[name]);
    }

    this.get = get
    this.entries = (id, snapshot) => {
        return Object.keys(_schema).map(name => 
            ({name, def: get(name).define(id, snapshot)}));
    }
}

function makeSchema(schemaOr_schema) {
    if (schemaOr_schema instanceof Schema) return schemaOr_schema;
    else return new Schema(schemaOr_schema);
}

function PropDef(name, schemaPropValue) {
    let type = null;
    let subSchema = null;
    if (schemaPropValue instanceof BuzzLast) {
        type = PropDef.Types.Last;
        subSchema = makeSchema(schemaPropValue.schema);
    } else if (schemaPropValue instanceof Index) {
        type = PropDef.Types.Index;
    } else if (schemaPropValue instanceof Constant) {
        type = PropDef.Types.Constant;
    } else if (schemaPropValue instanceof Object) {
        type = PropDef.Types.List;
        subSchema = makeSchema(schemaPropValue);
    } else {
        type = PropDef.Types[typeof schemaPropValue];
    }

    if (type == undefined) {
        throw new Error("Unrecognized type for", schemaPropValue);
    }

    this.type = type;

    const isAssoc = !!subSchema
    this.isAssoc = isAssoc;
    this.define = (id, snapshot) => {
        let get;
        if (type === PropDef.Types.Constant) {
            // this creates an index that points back to every node with this schema
            let inIn = new IndexInstance();
            console.log('inin', inIn, inIn.reverse(), inIn.reverse().map)
            return inIn.reverse();
        } else if (isAssoc) {
            const toResult = () => snapshot.getRefs(id, name)
                .map(refId => getResult(refId, subSchema, snapshot));
            switch (type) {
                case PropDef.Types.Index:
                    throw new Error("here at le");
                case PropDef.Types.Last:
                    get = () => first(toResult(), null);
                    break;
                case PropDef.Types.List:
                    get = () => toResult();
                    break;
                default:
                    throw new Error('Unexpected');
            }
        } else {
            get = () => {
                return first(snapshot.getValues(id, name), schemaPropValue);
            }
        }
        return {get, enumerable: true};
    }

    return typeof propDef;
}

function iterateConnection(propValues, snapshot, schema) {
    const seenMap = new Map();
    return propValues
        .reject(value => seenMap.has(value.id))
        .tap(value => seenMap.set(value.id))
        .reject(value => value instanceof BuzzDeleted)
        .map(value => getResult(value.id, schema, snapshot))
}

function first(it, fallback) {
    const {value, done} = it.next();
    return done && (value === undefined) ? fallback : value;
}

PropDef.Types = Object.fromEntries([
    "Index",
    "Constant",
    "Last",
    "List",
    "Unique",
    "Reverse",
    "number",
    "string",
    "boolean",
].map(t => [t, Symbol(t)]));

class IndexInstance {
    append() {
        return null();
    }
    reverse() {
        return new IndexInstance();
    }
    map() {
        console.log('whoa')
    }
}

function isRef(valueOrRef) {
    if (typeof valueOrObj == "string") return true;
}
