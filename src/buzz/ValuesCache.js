var wu = require("wu");

function createValuesCache(sign) {
    let callbackMap = new Map();

    let currentChunk = []; //list of key, id, values
    let chunks = [];
    /*
    function receiveExternalChunk(chunk) {
        chunks = [currentChunk, chunk, ...chunks];
        currentChunk = [];
        //for entry in chunk, notify
        wu(chunk).pluck('id').forEach(notify);
    }
    */

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
                if (tracker.acccess.has(identifier)) {
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
        currentChunk = [entry].concat(currentChunk);
        callTrackers(entryIdentifier(entry.id, entry.name));
        if (isRefType(entry)) {
            callTrackers(indexIdentifier(entry.name, entry.refId));
        }
    }

    function getSnapshot(invalidate) {
        const snapshotValues = [currentChunk, ...chunks];
        const entries = () => wu(snapshotValues).flatten(true);
        const get = (id, name) => entries()
            .filter(entry => entry.name === name && entry.id === id)
        const tracker = SnapshotTracker(invalidate);

        function refChain(it) {
            let seen = new Set();
            return it
                .filter(entry => isRefType(entry) && !seen.has(entry.refId))
                .tap(entry => seen.add(entry.refId))
                .filter(entry => entry.type == Types.refDelete)
        }

        function getValues(id, name) { 
            tracker.entryAccess(id, name);
            get(id, name)
                .reject(isRefType)
                .pluck("value");
        }

        function getRefs(id, name) { 
            tracker.entryAccess(id, name);
            return refChain(get(id, name)).pluck("refId");
        }

        //iterate over ids that point to the refIds in refIdIterator with prop[name]
        function index(name, refIdIterator) {
            return wu(refIdIterator)
                .tap(id2 => tracker.indexAccess(name, id2))
                .map(id2 => 
                    refChain(entries().filter(entry => entry.name == name))
                        .filter(entry => entry.refId === id2)
                        .pluck("id"))
                .flatten(true)
                .unique()
        }

        function appendValue(id, name, value) {
            appendEntry({id, name, value, type: Types.value});
        }

        function appendRef(id, name, refId) {
            appendEntry({id, name, refId, type: Types.ref});
        }

        function appendRefDelete(id, name, refId) {
            appendEntry({id, name, refId, type: Types.refDelete});
        }
    }

    function get(id, invalidate) {
        const oldCallback = callbackMap.get(id);
        callbackMap.set(id, function() {
            invalidate();
            oldCallback && oldCallback();
        });

        return getEntries()
            .filter(entry => entry.id === id)
            .pluck('values');
    }


    function getEntries(since) {
        const log = wu.flatten(chunks);
        return wu.chain(currentChunk, log)
            .takeWhile(entry => entry.version !== since);
    }

    function notify(id) {
        const callback = callbackMap.get(id);
        callbackMap.delete(id);
        callback && callback();
    }

    function append(id, values) {
        const version = sign(id, values);
        currentChunk.unshift({id, values, version});
        notify(id);
    }

    return {get, append, getEntries};
}

export default createValuesCache;
