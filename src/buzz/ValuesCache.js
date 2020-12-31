import {isKey, Key} from './Key.js';
import {getType, Types} from './Types.js';
var wu = require("wu");

const KEY_MARKER = "@@BUZZ";
function createValuesCache(sign, storage) {
    let head = null; //list of key, id, values

    let allTrackers = [];
    function SnapshotTracker(invalidate) {
        let tracker = {access: new Set(), invalidate};
        allTrackers.push(tracker);
        return {
            entryAccess: (id, name) => tracker.access.add(entryIdentifier(id, name)),
            indexAccess: (name, id) => tracker.access.add(indexIdentifier(name, id)),
        }
    }
    const entryIdentifier = (id, name) => id + "|" + name;
    const indexIdentifier = (name, refId) => name + "*" + refId;

    function track(identifier) {
        allTrackers = allTrackers
            .map(tracker => {
                if (tracker.access.has(identifier)) {
                    tracker.invalidate();
                    return null;
                } else {
                    return tracker;
                }})
            .filter(tracker => !!tracker);
    }


    function appendEntry(id, oProps) {
        const props = {};
        for (const [name, value] of Object.entries(oProps)) {
            track(entryIdentifier(id, name));
            if (isKey(value)) {
                track(indexIdentifier(name, value.id));
            }
            props[name] = convertKey(value);
        }
        const next = head;
        const serialized = JSON.stringify({id, props, next});
        const version = sign(serialized);
        head = version;
        storage.setItem(version, serialized);
        return version;
    }

    function* yieldList(ptr) {
        while(ptr) {
            const entry = JSON.parse(storage.getItem(ptr));
            const key = Key(entry.id);
            const props = Object.fromEntries(Object.entries(entry.props).map(([name, value]) => 
                [name, restoreKey(value)]));
            yield {key, props};
            ptr = entry.next;
        }
    }

    function convertKey(value) {
        switch(getType(value)) {
            case Types.number:
            case Types.string:
            case Types.boolean:
                return value;
            case Types.Key:
                const {id, isDelete} = value;
                return {[KEY_MARKER]:KEY_MARKER, id, isDelete};
            case Types.object:
            default:
                throw new Error("Bad value for serialize:" + value);
        }
    }

    function restoreKey(value) {
        switch(getType(value)) {
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
                throw new Error("Unexpected value for hyrdate:" + value);
        }
    }

    function getSnapshot(invalidate) {
        const currentHead = head;
        const entries = () => wu(yieldList(currentHead));
        const tracker = SnapshotTracker(invalidate);

        return {
            get: function (keys, name) { 
                const idSet = IdSet(keys);
                idSet.forEach(id => tracker.entryAccess(id, name));
                let seenIds = new Set();
                return entries()
                    .filter(entry => idSet.has(entry.key.id) && name in entry.props)
                    .map(entry => entry.props[name])
                    .reject(value => isKey(value) && seenIds.has(value.id))
                    .tap(value => isKey(value) && seenIds.add(value.id))
                    .reject(value => isKey(value) && value.isDelete);
            },

            //iterate over ids that point to any of the key2s with prop[name]
            index: function (name, key2s) {
                const id2set = new IdSet(key2s);
                id2set.forEach(id2 => tracker.indexAccess(name, id2));
                let seenIds = new Set();
                return entries()
                    .filter(entry =>  {
                        if (name in entry.props) {
                            const value = entry.props[name];
                            if (isKey(value)) {
                                const id = entry.key.id;
                                if (!seenIds.has(id)) {
                                    seenIds.add(id)
                                    if (!value.isDelete) {
                                        return true;
                                    }
                                }
                            }
                        }
                        return false;
                    })
                    .map(entry => entry.key)
            },

        };
    }

    return {
        getSnapshot,
        write: function(key, transaction) {
            if (!isKey(key) || key.isDelete) throw new Error("Bad key:" + key);
            let props = {};
            transaction((name, value) => props[name] = value);
            return appendEntry(key.id, props);
        },
        debug: function() {
            wu.zip(wu(yieldList(head)), wu.count())
                .forEach(([entry, n]) => console.log(n, entry.key.id, entry.props));
        },
    };
}

function IdSet(keys) {
    const keySet = new Set();
    const seen = new Set();
    for (const key of keys) {
        if (!isKey(key)) throw new Error("Expected Key, got " + key);
        if (!seen.has(key.id)) {
            seen.add(key.id);
            if (!key.isDelete) keySet.add(key.id);
        }
    }
    return keySet;
}

export default createValuesCache;
