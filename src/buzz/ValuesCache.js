import {isKey} from './Key.js';
var wu = require("wu");

function createValuesCache(sign) {
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


    function appendEntry(entry) {
        const version = sign(entry);
        entry.next = head;
        head = entry;
        for (const [name, value] of Object.entries(entry.props)) {
            track(entryIdentifier(entry.key.id, name));
            if (isKey(value)) {
                track(indexIdentifier(name, value.id));
            }
        }
        return version;
    }

    function* yieldList(ptr) {
        while(ptr) {
            yield ptr;
            ptr = ptr.next;
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
            if (!isKey(key)) throw new Error("Expected key for write, got " + key);
            if (key.isDelete) throw new Error("Don't write to deleted key");
            let props = {};
            transaction((name, value) => props[name] = value);
            return appendEntry({key, props});
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
