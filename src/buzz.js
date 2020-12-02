import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

function newKey() {
    return btoa(Math.random());
}

function node() {
    const nodeKey = newKey();
    //let sequence = 0;

    function useBuzz(schema) {
        let id = null;

        let [result, setter] = useState(null);

        function selectResult(values) {
            id = newKey();
            //const updated = ++sequence;
            let newResult = Object.assign({id}, result || schema);
            setter(Object.freeze(Object.assign(newResult, values)));
        }

        return [result, selectResult];
    }

    return {useBuzz, toString: () => 'Buzz node ' + nodeKey};
}

function key(hash) {
    return uuidv4();
}

const allSymbol = Symbol();
function all(node) {
    return Object.freeze({symbol: allSymbol, node});
}

const last = Object.freeze({symbol: Symbol()});

const Buzz = {node, key, all, last};
export default Buzz;
