import { v4 as uuidv4 } from 'uuid';
//const { List, Set } = require('immutable')


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

function instance() {
    let instanceKey = newKey();

    function create(values) {
        const key = newKey();
        if (values) update(key, values);
        return query(key);
    }

    let log = [];
    function update(result, values) {
        console.log('upd', result, values)
        log.push({id: result.get('id'), values});
        console.log('now', log)
    }

    // The fact that you had this key before I told you about it is what is
    // meaningful, not so much the clock time
    function query(key) {
        return log.filter(({id}) => key == id).reduce(function({values}, result) {
            for (const [key, value] of Object.entries(values)) {
              result[key] = value;
            }
            return result;
        }, {'id': key});
    }

    return {create, update, query, get id() {
        return instanceKey;
    }};
}

function key(hash) {
    return uuidv4();
}


const Buzz = {instance, key};
export default Buzz;
