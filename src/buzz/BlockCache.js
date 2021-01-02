import {Types} from './Types.js';
import {Key} from './Key.js';
const KEY_MARKER = "@@BUZZ";
//typedef Block : [{key: Key, name: string, value: ValueType}];
//typedef ValueType : boolean|number|string|Key

export default function BlockCache({store, fetch}) {
    let next = "";

    return {
        snapshot: () => next,
        addBlock: block => 
            (next = store({next, block: convert(block), isMerge : false})),

        merge: branch => 
            (next = store({next, branch, isMerge : true})),

        read: function*(snapshot) {
            let stack = [snapshot];
            let seen = new Set();
            while (stack.length) {
                let ptr = stack.pop();
                while (ptr) {
                    const record = fetch(ptr);
                    if (record.isMerge) {
                        stack.push(record.branch);
                    } else {
                        if (!seen.has(ptr)) yield deconvert(record.block);
                        seen.add(ptr);
                    }
                    ptr = record.next;
                }
            }
        }
    }
}

function convert(block) {
    return block.map(({key, name, value}) => 
        ({id: key.id, name, value: serialize(value)}));
}

function deconvert(sBlock) {
    return sBlock.map(({id, name, value}) => 
        ({key: Key(id), name, value: deserialize(value)}));
}

function serialize(value) {
    switch(Types.get(value)) {
        case Types.number:
        case Types.string:
        case Types.boolean:
            return value;
        case Types.Key:
            const {id, isDelete} = value;
            return {[KEY_MARKER]:KEY_MARKER, id, isDelete};
        case Types.object:
        default:
            throw new Error("Bad value for convert:" + value);
    }
};

function deserialize(value) {
    switch(Types.get(value)) {
        case Types.number:
        case Types.string:
        case Types.boolean:
            return value;
        case Types.object:
            if (value[KEY_MARKER] === KEY_MARKER) {
                return Key(value.id, value.isDelete);
            }
            //intentional fall through
        case Types.Key:
        default:
            throw new Error("Unexpected value for deserialize:" + value);
    }
}

