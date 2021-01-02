import {isKey} from './Key.js';
import Trackers from './Trackers.js';
var wu = require("wu");

function createValuesCache(cache) {
    let trackers = Trackers();

    function appendBlock(block) {
        trackers.notify(block.map(({key, name}) => 
            trackers.entryIdentifier(key.id, name)).concat(block.filter(({value}) => 
                isKey(value)).map(({name, value}) => 
                    trackers.indexIdentifier(name, value.id))));
        cache.addBlock(block);
    }

    function* yieldList(head) {
        for (const block of cache.read(head)) {
            for (const entry of block) {
                yield entry;
            }
        }
    }

    function getSnapshot(invalidate) {
        const head = cache.snapshot();
        const entries = name => wu(yieldList(head)).filter(entry => entry.name === name);
        const track = trackers.tracker(invalidate);

        return {
            get: function (keys, name) { 
                const idSet = IdSet(keys);
                idSet.forEach(id => track(Trackers.entryIdentifier(id, name)));
                let seenIds = new Set();
                return entries(name)
                    .filter(entry => idSet.has(entry.key.id))
                    .map(entry => entry.value)
                    .reject(value => isKey(value) && seenIds.has(value.id))
                    .tap(value => isKey(value) && seenIds.add(value.id))
                    .reject(value => isKey(value) && value.isDelete);
            },

            index: function (name, key2s) {
                const id2set = new IdSet(key2s);
                id2set.forEach(id2 => track(Trackers.indexIdentifier(name, id2)));
                let seenIds = new Set();
                return entries(name)
                    .filter(entry => isKey(entry.value) && !seenIds.has(entry.key.id))
                    .tap(entry => seenIds.add(entry.key.id))
                    .reject(entry => entry.value.isDelete)
                    .map(entry => entry.key);
            },

        };
    }

    let block = null;
    return {
        getSnapshot,
        write: function(key, transaction) {
            if (!isKey(key) || key.isDelete) throw new Error("Bad key:" + key);
            const isEntryPoint = block === null;
            if (isEntryPoint) block = [];
            transaction((name, value) => {
                block.push({key, name, value});
            });
            if (isEntryPoint) {
                appendBlock(block);
                block = null;
            }
        },
        receive: function(otherNodeId, otherVersion) {
            //console.log('GOOT', otherNodeId, otherVersion)
        },
        debug: function() {
            wu.zip(wu(yieldList(cache.snapshot())), wu.count())
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
