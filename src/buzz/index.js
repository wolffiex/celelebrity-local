import { useState } from 'react';
import createValuesCache from './ValuesCache.js';
import {getResult, Index} from './Obj.js';
import {Types, getType} from './Types.js';
import {Key} from './Key.js';

function node() {
    const nodeKey = newKey();
    const valuesCache = new createValuesCache(() => newKey());

    function debug() {
        valuesCache.debug();
    }

    function useBuzz(schemaDef, _id) {
        //TODO if _id, make sure it is writeable by me
        const [key, update] = useState(() => _id ? Key(_id) : newKey());
        const invalidate = () => update(k => Key(k.id));

        const snapshot = valuesCache.getSnapshot(invalidate);

        const write = props => writeEntry(key, schemaDef, props);

        const result = getResult(key, schemaDef, snapshot);
        return [result, write];
    }

    function writeEntry(key, schemaDef, oProps) {
        valuesCache.write(key, set => Object.entries(oProps).forEach(([name, value]) => {
            console.log(name, value)
            const type = getType(value);
            set(name, type === Types.object ? writeEntry(newKey(), value) : value);
        }));
        return key;
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

function newKey() {
    return Key(btoa(Math.random()).slice(-8));
}

function constant(id) {
    return Key(id);
}

function index(name, schemaDef) {
    return Index(name || null, schemaDef || null);
}

const Buzz = {node, enumerate, index, key: newKey, constant};
export default Buzz;
