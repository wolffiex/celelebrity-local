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
    function getId() {
        return instanceKey;
    }

    function write(record, values) {
        return _write(instanceKey, record, newKey(), values);
    }

    function index(r1, r2) {
    }

    async function* query(k) {
        let r = "foo";
        for (var i=0; i< 8; i++) {
            yield r;
            await new Promise(resolve => setTimeout(resolve, 1000));
            r = r + '1';
        }
    }
    return {write, index, query, getId};
}

function key(hash) {
    return uuidv4();
}

function write(keys, doc) {
}

const Buzz = {instance, record, key};
export default Buzz;
