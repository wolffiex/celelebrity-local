var wu = require("wu");

// FIXME: Store values as obj, rather than as k,v
// FIXME: linked list rather than chunks
function createValuesCache(sign) {
    let currentChunk = []; //list of key, id, values

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
        currentChunk = Object.freeze([entry].concat(currentChunk));
        for (const [name, value] of Object.entries(entry.props)) {
            track(entryIdentifier(entry.id, name));
            if (value instanceof Assoc) {
                track(indexIdentifier(name, value));
            }
        }
        return version;
    }

    function getSnapshot(invalidate) {
        const snapshotValues = currentChunk;
        const entries = () => wu(snapshotValues);
        const get = (ids, name) => entries()
            .filter(entry => name in entry.props && ids.has(entry.id))
            .map(entry => entry.props[name]);

        const tracker = SnapshotTracker(invalidate);

        return {
            getValues : function (id, name) { 
                tracker.entryAccess(id, name);
                return get(new Set([id]), name)
                    .reject(value => value instanceof Assoc)
            },

            getRefs: function(idIterator, name) { 
                const ids = new Set(idIterator);
                ids.forEach(id => tracker.entryAccess(id, name));

                let seen = new Set();
                return get(ids, name)
                    .filter(value => value instanceof Assoc && !seen.has(value.id2))
                    .tap(value => seen.add(value.id2))
                    .reject(value => value.isDelete)
                    .pluck('id2')
            },

            //iterate over ids that point to the id2s in id2Iterator with prop[name]
            index: function (name, id2Iterator) {
                const id2s = new Set(id2Iterator);
                id2s.forEach(id2 => tracker.indexAccess(name, id2));
                let seen = new Set();
                return entries()
                    .filter(entry =>  
                        name in entry.props && 
                        entry.props[name] instanceof Assoc &&
                        id2s.has(entry.props[name].id2) && 
                        !seen.has(entry.props[name].id2))
                    .tap(entry => seen.add(entry.props[name].id2))
                    .pluck('id')
                    .unique()
            },

        };
    }

    return {getSnapshot,
        append: function (id, props) {
            return appendEntry({id, props});
        },

        assoc: function (id2, isDelete) {
            return new Assoc(id2, isDelete === undefined ? false : true);
        },

        debug: function() {
            wu.zip(wu(currentChunk), wu.count())
                .forEach(([entry, n]) => console.log(n, entry));
        }
    };
}

function Assoc(id2, isDelete) {
    this.id2 = id2;
    this.isDelete = isDelete;
    Object.freeze(this);
}

export default createValuesCache;
