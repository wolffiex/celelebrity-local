import { useState } from 'react';

function newKey() {
    return btoa(Math.random());
}

function getResult(id, schema, update, cache) {
    if (!cache.has(id)) {
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
            Object.defineProperty(result, propName, defineProp(propName, propDef, update, cache));
        }

        cache.set(id, result);
    }

    return cache.get(id);
}

function node() {
    const nodeKey = newKey();
    const cache = new Map();

    function useBuzz(schema) {
        const update = () => setResult(r => [...r])
        const [[result], setResult] = useState(() => 
            [getResult(schema.id || newKey(), schema, update, cache)]);

        return result;
    }

    return {useBuzz, toString: () => 'Buzz node ' + nodeKey};
}


function defineProp(propName, propDef, update, cache) {
    let get;
    let set = _ => {
        throw new Error("Can't assign to", propName);
    }

    if (propDef instanceof BuzzLast) {
        const assoc = assocGet(propDef.schema, update, cache);
        get = () => assoc.last();
        set = r => assoc.append(r);
    } else if (propDef instanceof Object) {
        const assoc = assocGet(propDef, update, cache);
        get = () => assoc;
    } else if (propDef instanceof BuzzEnum) {
        let value = propDef;
        get = () => value;
        set = v => {
            if (!(v instanceof BuzzEnum)) {
                value = propDef.enumeration[v];
            }
            update();
        }
    } else {
        let value = propDef;
        get = () => value;
        set = v => {
            value = v;
            update();
        }
    }

    return {get, set, enumerable: true}
}

function assocGet(schema, update, cache) {
    let assocs = [];
    let updateLocked = false;
    const subUpdate = () => updateLocked || update();
    const append = function(idOrValues) {
        let [id, values] = idOrValues instanceof Object ? 
            [newKey(), idOrValues] : [idOrValues, {}];
        updateLocked = true;
        try {
            const result = getResult(id, schema, subUpdate, cache);
            for (let k in values) {
                result[k] = values[k];
            }
            assocs.unshift(result);
            return result;
        } finally {
            updateLocked = false;
            update();
        }
    }
    const last = () => assocs[assocs.length-1] || null;
    let seq = {append, last};
    seq.map = (...args) => [...seq].map(...args);
    seq[Symbol.iterator] = function*() {
        for (var assoc of assocs) {
            yield assoc;
        }
    }
    return seq;
}

function enumerate(...variants) {
    return new BuzzEnum(variants);
}

function BuzzEnum(variants) {
    for (var k in variants) {
        this[k] = {enumeration: this};
    }
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
