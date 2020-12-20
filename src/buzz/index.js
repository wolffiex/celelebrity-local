import { useState } from 'react';
import createValuesCache from './ValuesCache.js';
import {makeSchema, SchemaType} from './Schema.js';
import {getResult} from './Obj.js';

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

        const write = props => writeEntry(id, schema, props);

        const result = getResult(id, schema, snapshot);
        return [result, write];
    }

    function writeEntry(id, schema, oProps) {
        const props = Object.entries(oProps).reduce((props, [name, oValue]) => {
            const propDef = schema.get(name);
            const value = !propDef.isAssoc ? oValue : 
                valuesCache.assoc(isRef(oValue) ? oValue :
                    writeEntry(newKey(), propDef.subSchema, oValue));
            props[name] = value;
            return props;
        }, schema.defineConstants(valuesCache.assoc));
        valuesCache.append(id, props);
        return id;
    }

    return {useBuzz, debug, toString: () => 'Buzz node ' + nodeKey};
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
