import { v4 as uuidv4 } from 'uuid';
import { useEffect, useState } from 'react';

function newKey() {
    return btoa(Math.random());
}

function createResult(log, schema) {
    let result = {};
    for (const [key, value] of Object.entries(schema)) {
        let bValue = null;
        Object.defineProperty(result, key, {
            get() { return bValue; },
            set(newValue) { bValue = newValue; },
        });
    }
}

function node() {
    let nodeKey = newKey();
    let sequence = 0;

    function useBuzz(schema) {
        let key = null;

        let [result, setter] = useState(null);

        function selectResult(values) {
            let newResult = Object.assign({}, result || schema);
            setter(Object.freeze(Object.assign(newResult, values)));
        }

        return [result, selectResult];
    }

    return {useBuzz};
}

function key(hash) {
    return uuidv4();
}

function all(node) {
    return {node};
}


const Buzz = {node, key, all};
export default Buzz;
