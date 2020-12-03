import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

function newKey() {
    return btoa(Math.random());
}

function node() {
    const nodeKey = newKey();
    const assocs = new Map();

    function index(schema) {
        return new BuzzIndex(schema, assocs); 
    }

    function getResult(id, schema, values) {
        Object.freeze(schema);
        let result = {
            get schema() {
                return schema;
            },
            get id() {
                return id;
            }
        };

        for (const [propName, propDef] of Object.entries(schema)) {
            const value = propDef instanceof BuzzIndex ?
                new BuzzIndexProperty(propDef) :
                (values && propName in values) ? values[propName] : propDef; 
            Object.defineProperty(result, propName, {enumerable: true, value});
        }

        return result;
    }

    function constant(id, schema) {
        return getResult(id, schema);
    }

    function useBuzz(schema) {
        let id = null;

        let [result, setResult] = useState(null);
        return [result, function (values) {
            id = newKey();
            setResult(getResult(id, schema, values));
        }];
    }

    return {useBuzz, constant, index, toString: () => 'Buzz node ' + nodeKey};
}

function key(hash) {
    return uuidv4();
}

function index(schema) {
    return new BuzzIndex(schema);
}

function BuzzIndex(schema) {
    // map of id to list[schema]
    Object.freeze(schema);
    Object.defineProperty(this, "schema", {enumerable: true, value: schema, writable:false});
    Object.defineProperty(this, "_assocs", {enumerable: false, value: new Map(), writable:false});
}

function BuzzIndexProperty(buzzIndex) {
}

BuzzIndexProperty.prototype.last = function() {
}

BuzzIndexProperty.prototype.all = function() {
    return [];
}

const Buzz = {node, key, index};
export default Buzz;
