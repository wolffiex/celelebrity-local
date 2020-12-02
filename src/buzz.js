import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

function newKey() {
    return btoa(Math.random());
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
                console.log('dunno how to handle', propDefinition)
            } else {
                const value = propName in values ? values[propName] : propDefinition;
                Object.defineProperty(result, propName, {enumerable: true, value});
            }
        }

        return {schema, result};
    }

    function addAssoc(fromId, toId) {
    }

    function useBuzz(schema, assoc) {
        let id = null;

        let [meta, setter] = useState({schema, result:null});

        function selectResult(values) {
            id = newKey();
            setter(getResult(id, meta, values));
        }

        if (assoc != null) {
            addAssoc(assoc, id);
        }

        return [meta.result, selectResult];
    }

    return {useBuzz, toString: () => 'Buzz node ' + nodeKey};
}

function key(hash) {
    return uuidv4();
}

const allSymbol = Symbol();

function all(node) {
    return new _BuzzIndex(_BuzzIndex.all, {node});
}

function last() {
    return new _BuzzIndex(_BuzzIndex.last, node);
}

const _BuzzIndexEnum= {all: Symbol(), last: Symbol()};
function _BuzzIndex(...args) {
    this.info = [...args];
}

const Buzz = {node, key, all, last};
export default Buzz;
