import { v4 as uuidv4 } from 'uuid';


function newKey() {
    return btoa(Math.random());
}

function record(schema) {
    function index(otherRecord) {
    }
    return {index};
}

function _write(instanceKey, record, id, values) {
    return id;
}

function instance() {
    let instanceKey = newKey();

    function write(record, _key, values) {
        const key = _key
        if (values == null) {
        } else {
            for (const [key, value] of Object.entries(values)) {
              console.log(`${key}: ${value}`);
            }
        }
        return query(key);
    }

    function query(key, assoc) {

    }

    return {write, query, get id() {
        return instanceKey;
    }};

}

function key(hash) {
    return uuidv4();
}


const Buzz = {instance, record, key};
export default Buzz;
