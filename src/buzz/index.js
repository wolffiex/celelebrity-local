import { useState } from 'react';
import createValuesCache from './ValuesCache.js';
import {makeSchema, SchemaType} from './Schema.js';

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

function last(schemaDef) {
    return SchemaType(SchemaType.Last, schemaDef);
}

function constant(id) {
    return SchemaType(SchemaType.Constant, id);
}

function isRef(valueOrRef) {
    return typeof valueOrRef === "string";
}

const Buzz = {node, enumerate, last, key: newKey, constant};
export default Buzz;
