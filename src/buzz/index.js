import { useState } from 'react';
import createValuesCache from './ValuesCache.js';

function newKey() {
    return btoa(Math.random()).slice(-8);
}

function node() {
    const nodeKey = newKey();
    const valuesCache = new createValuesCache(() => newKey());

    function debug() {
        valuesCache.debug();
    }

    function useBuzz(_schema) {
        const schema = makeSchema(_schema);
        const [{id}, update] = useState(() => ({id: newKey()}));
        const invalidate = () => update(({id}) => ({id}));

        const snapshot = valuesCache.getSnapshot(invalidate);

        let didConstants = false;
        const write = (name, valueOrObj) => {
            if (!didConstants) {
                schema.writeConstants(id, writeEntry);
                didConstants = true;
            }
            return writeEntry(id, schema, name, valueOrObj);
        }

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
        const refId = isRef(valueOrObj) ? valueOrObj : addRef(propDef.subSchema, valueOrObj);
        valuesCache.appendRef(id, name, refId);
        return refId;
    }

    function addRef(schema, values) {
        const id = newKey();
        schema.writeConstants(id, writeEntry);
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

function Schema(_schema) {
    if (_schema instanceof Schema) console.error("FIx this");
    function get(name) {
        if (! (name in _schema)) {
            throw new Error("Property not found");
        }
        return new PropDef(name, _schema[name], _schema);
    }

    this.get = get
    this.entries = (id, snapshot) => {
        return Object.keys(_schema).map(name => 
            ({name, def: get(name).define(id, snapshot)}));
    }

    this.debug = () => _schema;
    this.writeConstants = (id, writeEntry)  => {
        Object.keys(_schema)
            .map(name =>({name, propDef: this.get(name)}))
            .filter(({propDef}) => propDef.type === PropDef.Types.Constant)
            //gross
            .forEach(({name, propDef}) => writeEntry(id, this, name, propDef.schemaPropValue.id))

    }
}

function makeSchema(schemaOr_schema) {
    if (schemaOr_schema instanceof Schema) return schemaOr_schema;
    else return new Schema(schemaOr_schema);
}

function PropDef(name, schemaPropValue, ssschema) {
    let type = null;
    let subSchema = null;
    if (schemaPropValue instanceof BuzzLast) {
        type = PropDef.Types.Last;
        subSchema = makeSchema(schemaPropValue.schema);
    } else if (schemaPropValue instanceof Index) {
        type = PropDef.Types.Index;
        subSchema = makeSchema(schemaPropValue.schema);
    } else if (schemaPropValue instanceof Constant) {
        subSchema = makeSchema(ssschema);
        type = PropDef.Types.Constant;
    } else if (schemaPropValue instanceof Object) {
        type = PropDef.Types.List;
        subSchema = makeSchema(schemaPropValue);
    } else {
        type = PropDef.Types[typeof schemaPropValue];
    }

    if (type === undefined) {
        throw new Error("Unrecognized type for", schemaPropValue);
    }

    this.schemaPropValue = schemaPropValue;
    this.type = type;

    const isAssoc = !!subSchema
    this.subSchema = subSchema;
    this.isAssoc = isAssoc;
    function wrapIndex(index, getter, snapshot) {
        //TODO: build set of index
        const result = index.map(getter);
        result.select = n => snapshot.getRefs(index, n)
            .map(id => getResult(id, subSchema.get(n).subSchema, snapshot))
        return result;
    }

    this.define = (id, snapshot) => {
        let get;
        if (type === PropDef.Types.Constant) {
            // this creates an index that points back to every node with this schema
            get = () => wrapIndex(snapshot.index(name, [schemaPropValue.id]),
                refId => getResult(refId, subSchema, snapshot), snapshot);
        } else if (isAssoc) {
            const toResult = () => snapshot.getRefs([id], name)
                .map(refId => getResult(refId, subSchema, snapshot));
            switch (type) {
                case PropDef.Types.Index:
                    get = () => {
                        const result = toResult();
                        result.index = n => snapshot.index(n, snapshot.getRefs([id], name));
                        return result;
                    }
                    break;
                case PropDef.Types.Last:
                    get = () => first(toResult(), null);
                    break;
                case PropDef.Types.List:
                    get = () => {
                        const result = toResult();
                        result.last = () => first(result, null);
                        return result;
                    }
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

function isRef(valueOrRef) {
    return typeof valueOrRef === "string";
}
