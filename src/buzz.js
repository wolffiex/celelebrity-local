import { v4 as uuidv4 } from 'uuid';

export default function Buzz(key) {
    function writer(k, doc) {
        write([key, k], doc);
    }
    async function reader(k) {
        return read([key,k]);
    }
    return {writer, reader};
}

export function createKey() {
    return uuidv4();
}

function write(keys, doc) {
}

async function* read(index) {
    
}
