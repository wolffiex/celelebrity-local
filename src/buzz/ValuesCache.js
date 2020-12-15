var wu = require("wu");

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

    function callTrackers(identifier) {
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


    const Types = {
        value : 0,
        ref : 1,
        refDelete : 2,
    }

    const isRefType = entry => entry.type === Types.ref || entry.type === Types.refDelete;
    function appendEntry(entry) {
        const version = sign(entry);
        currentChunk = Object.freeze([entry].concat(currentChunk));
        callTrackers(entryIdentifier(entry.id, entry.name));
        if (isRefType(entry)) {
            callTrackers(indexIdentifier(entry.name, entry.refId));
        }
        return version;
    }

    function getSnapshot(invalidate) {
        const snapshotValues = currentChunk;
        const entries = () => wu(snapshotValues);
        const get = (ids, name) => entries()
            .filter(entry => entry.name === name && ids.has(entry.id))
        const tracker = SnapshotTracker(invalidate);

        function refChain(it) {
            let seen = new Set();
            return it
                .filter(entry => isRefType(entry) && !seen.has(entry.refId))
                .tap(entry => seen.add(entry.refId))
                .reject(entry => entry.type === Types.refDelete)
        }

        return {
            getValues : function (id, name) { 
                tracker.entryAccess(id, name);
                return get(new Set([id]), name)
                    .reject(isRefType)
                    .pluck("value");
            },

            getRefs: function(idIterator, name) { 
                const ids = new Set(idIterator);
                ids.forEach(id => tracker.entryAccess(id, name));
                return refChain(get(ids, name)).pluck("refId");
            },

            //iterate over ids that point to the refIds in refIdIterator with prop[name]
            index: function (name, refIdIterator) {
                const refIds = new Set(refIdIterator);
                refIds.forEach(refId => tracker.indexAccess(name, refId));
                return refChain(entries().filter(entry => entry.name === name))
                            .filter(entry => refIds.has(entry.refId))
                            .pluck("id")
                    .flatten(true)
                    .unique()
            },

        };
    }

    return {getSnapshot,
        appendValue: function (id, name, value) {
            return appendEntry({id, name, value, type: Types.value});
        },

        appendRef: function (id, name, refId) {
            return appendEntry({id, name, refId, type: Types.ref});
        },

        appendRefDelete: function (id, name, refId) {
            return appendEntry({id, name, refId, type: Types.refDelete});
        },

        debug : function() {
            wu.zip(wu(currentChunk), wu.count())
                .forEach(([entry, n]) => console.log(n, entry));
        }
    };
}

export default createValuesCache;
