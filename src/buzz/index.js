import { useState } from 'react';
import createValuesCache from './ValuesCache.js';
import {getResult, Index} from './Obj.js';
import {Types, getType} from './Types.js';
import {Key} from './Key.js';
import Network from './Network.js';
import Cache from './Cache.js';
import BlockCache from './BlockCache.js';

function node(storage, peer) {
    const key = newKey();
    const blockCache = BlockCache(Cache(() => newKey().id, storage));
    const valuesCache = createValuesCache(blockCache);
    const peek = nodeId => storage.getItem(nodeId);
    const network = Network(peek, valuesCache.receive);
    if (peer) network.addPeer(peer);
    setInterval(network.poll, 500);

    function useBuzz(schemaDef, _key) {
        //TODO if _key, make sure it is writeable by me
        const [key, update] = useState(() => _key ? _key : newKey());
        const invalidate = () => update(k => Key(k.id));

        const snapshot = valuesCache.getSnapshot(invalidate);
        const write = props => writeEntry(key, schemaDef, props);

        const result = getResult(key, schemaDef, snapshot);
        return [result, write];
    }

    function writeEntry(key, schemaDef, props) {
        valuesCache.write(key, set => Object.entries(props).forEach(([name, value]) => {
            const type = getType(value);
            set(name, type === Types.object ? writeEntry(newKey(), schemaDef[name], value) : value);
        }));
        return key;
    }

    return {useBuzz, key, debug: valuesCache.debug(), toString: () => 'Buzz node ' + key.id};
}

function enumerate(...variants) {
    return new BuzzEnum(variants);
}

function BuzzEnum(variants) {
    for (var k of variants) {
        this[k] = new BuzzEnumVariant(this);
    }
}

function BuzzEnumVariant(enumeration) {
    this.enumeration = enumeration;
}

function newKey() {
    return Key(btoa(Math.random()).slice(-8));
}

function constant(id) {
    return Key(id);
}

function index(name, schemaDef) {
    return Index(name || null, schemaDef || null);
}

const Buzz = {node, enumerate, index, key: newKey, constant};
export default Buzz;
