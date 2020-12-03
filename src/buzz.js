import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

function newKey() {
    return btoa(Math.random());
}

function getIndexedProp(id, propDefinition) {
    const [type, ...args] = propDefinition.info;
    switch (type) {
        case _BuzzIndex.all:
            return function() {
                console.log('dunno how to handle all()', args[0]);
                return [];
            }
        case _BuzzIndex.last:
            return function() {
                console.log('dlglu')
                return 'fkdu';
            }
        default:
            throw new Error("Unreachable");
    }
}


function node() {
    const nodeKey = newKey();

    function getResult(id, meta, values) {
        const schema = meta.schema;
        const lastResult = meta.result;
        let result = {
            get id() {
                return id;
            }
        };

        for (const [propName, propDefinition] of Object.entries(meta.schema)) {
            if (propDefinition instanceof _BuzzIndex) {
                let get = getIndexedProp(id, propDefinition);
                Object.defineProperty(result, propName, {enumerable: true, get});
            } else {
                const value = propName in values ? values[propName] : 
                    (lastResult ? lastResult.get(propName) : propDefinition);
                Object.defineProperty(result, propName, {enumerable: true, value});
            }
        }

        return {schema, result};
    }

    function useBuzzConst(name, schema) {
        let [meta] = useState(getResult(name, {schema, result:null}, null));
        return meta.result;
    }

    function useBuzz(schema) {
        let id = null;

        let [meta, setter] = useState({schema, result:null});

        function selectResult(values) {
            id = newKey();
            setter(getResult(id, meta, values));
        }

        return [meta.result, selectResult, {schema}];
    }

    return {useBuzz, useBuzzConst, toString: () => 'Buzz node ' + nodeKey};
}

function key(hash) {
    return uuidv4();
}

function all(node) {
    return new _BuzzIndex(_BuzzIndex.all, node);
}

function last() {
    return new _BuzzIndex(_BuzzIndex.last);
}

function _BuzzIndex(...args) {
    console.log('args', args)
    this.info = [...args];
}
_BuzzIndex.last = Symbol();
_BuzzIndex.all = Symbol();

const Buzz = {node, key, all, last};
export default Buzz;
