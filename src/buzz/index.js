import { useState } from 'react';
import createValuesCache from './ValuesCache.js';
import {get, Index} from './Schema.js';
import {getResult} from './Obj.js';
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
        valuesCache.write(key, ({set, assoc, assocDelete}) => {
            Object.entries(oProps).forEach(([name, oValue]) => {
                console.log(name, oValue)
                const type = getType(oValue);
                switch (type) { 
                    case "Key":
                        assoc(oValue);
                        break;
                    case "object":
                        assoc(writeEntry(newKey(),  oValue));
                        break;
                    default:
                        set(name, oValue);
                        break;
                }
            });
        });
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

function last(schemaDef) {
    return InputType(Types.Last, schemaDef);
}

function newKey() {
    return Key(btoa(Math.random()).slice(-8));
}


function constant(id) {
    return Key(id);
}

function isRef(valueOrRef) {
    return typeof valueOrRef === "string";
}

const Buzz = {node, enumerate, last, key: newKey, constant};
export default Buzz;
