import { useState } from 'react';

function newKey() {
    return btoa(Math.random());
}

function createResult(id, schema, update) {
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
        Object.defineProperty(result, propName, defineProp(propName, propDef, update));
    }

    Object.freeze(result);
    return result;
}

function node() {
    const nodeKey = newKey();

    function useBuzz(schema) {
        const update = () => {
            setResult(r => [...r])
        }
        const [[result], setResult] = useState(() => 
            [createResult(schema.id || newKey(), schema, update)]);

        console.log('use', result)
        return result;
    }

    return {useBuzz, toString: () => 'Buzz node ' + nodeKey};
}

function defineProp(propName, propDef, update) {
    let get;
    let set = _ => {
        throw new Error("Can't assign to", propName);
    }

    if (propDef instanceof Object) {
        let assocs = [];
        get = () => {
            let updateLocked = false;
            const subUpdate = () => updateLocked || update();
            const append = function(values) {
                updateLocked = true;
                try {
                    const result = createResult(newKey(), propDef, subUpdate);
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
            let seq = {append};
            seq[Symbol.iterator] = function*() {
                for (var assoc of assocs) {
                    yield assoc;
                }
            }
            seq.map = (...args) => [...seq].map(...args);
            return seq;
        }
    } else {
        let value = propDef;
        get = () => value;
        set = v => {
            value = v;
            console.log('hhiii', value, propName)
            update();
        }
    }

    return {get, set, enumerable: true}
}

function enumerate(...variants) {
    return new BuzzEnum(variants);
}

function BuzzEnum(variants) {
    for (var k in variants) {
        this[k] = {enum: this};
    }
}

const Buzz = {node, enumerate, key: newKey};
export default Buzz;
