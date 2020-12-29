import {Key, isKey} from './Key.js';
var wu = require("wu");

// FIXME: linked list rather than chunks
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
            track(entryIdentifier(entry.key, name));
            if (isKey(value)) {
                track(indexIdentifier(name, value));
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
                const keySet = new Set(keys.map(k => k.id));
                keySet.forEach(id => tracker.entryAccess(id, name));
                return entries()
                    .filter(entry =>  ids.has(entry.id) && name in entry.props)
                    .map(entry => entry.props[name]);

                return get(new Set([id]), name)
                    .reject(value => value instanceof Assoc)
                return get(ids, name)
                    .filter(value => value instanceof Assoc && !seen.has(value.key2))
                    .tap(value => seen.add(value.key2))
                    .reject(value => value.isDelete)
                    .pluck('key2')
            },

            //iterate over ids that point to the key2s in key2Iterator with prop[name]
            index: function (name, key2Iterator) {
                const key2s = new Set(key2Iterator);
                key2s.forEach(key2 => tracker.indexAccess(name, key2));
                let seen = new Set();
                return entries()
                    .filter(entry =>  
                        name in entry.props && 
                        entry.props[name] instanceof Assoc &&
                        key2s.has(entry.props[name].key2) && 
                        !seen.has(entry.id))
                    .tap(entry => seen.add(entry.props[name].key2))
                    .pluck('id')
                    .unique()
            },

        };
    }

    return {
        getSnapshot,
        write: function(key, props) {
            return appendEntry({id, props});
        },
        debug: function() {
            wu.zip(wu(yieldList(head)), wu.count())
                .forEach(([entry, n]) => console.log(n, entry.id, entry.props));
        },
    };
}

function Assoc(key2, isDelete) {
    this.key2 = key2;
    this.isDelete = isDelete;
    Object.freeze(this);
}

export default createValuesCache;
