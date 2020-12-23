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
            track(entryIdentifier(entry.id, name));
            if (value instanceof Assoc) {
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
                        !seen.has(entry.id))
                    .tap(entry => seen.add(entry.props[name].id2))
                    .pluck('id')
                    .unique()
            },

        };
    }

    function assoc_(id2, isDelete) {
        return new Assoc(id2, isDelete === undefined ? false : true);
    }

    return {
        getSnapshot,
        assoc: assoc_,
        write: function(id, transaction) {
            let props = {};
            const set = (name, value) => props[name] = value;
            const assoc = (name, id2) => props[name] = assoc_(id2);
            const assocDelete = (name, id2) => props[name] = assoc_(id2, true);
            transaction({set, assoc, assocDelete});
            return appendEntry({id, props});
        },
        append: function (id, props) {
            return appendEntry({id, props});
        },
        debug: function() {
            wu.zip(wu(yieldList(head)), wu.count())
                .forEach(([entry, n]) => console.log(n, entry.id, entry.props));
        },
    };
}

function Assoc(id2, isDelete) {
    this.id2 = id2;
    this.isDelete = isDelete;
    Object.freeze(this);
}

export default createValuesCache;
