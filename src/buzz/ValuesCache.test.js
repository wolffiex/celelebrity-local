import {Key} from './Key.js';
import createValuesCache from './ValuesCache.js';

const keyIt = id => [Key(id)];

let sigNum = 0;
const sign = () => (sigNum++).toString();
test('snapshot', () => {
    const valuesCache = createValuesCache(sign, Storage());
    valuesCache.write(Key('A'), set => {
        set('x', 1);
        set('y', 10);
    });
    let invalidated = 0;
    const invalidate = () => invalidated++;
    const snap1 = valuesCache.getSnapshot(invalidate);
    expect([...snap1.get(keyIt('A'), 'x')]).toEqual([1]);

    valuesCache.write(Key('B'), set => {
        set('x', 2);
        set('y', 20);
    });
    expect(invalidated).toEqual(0)

    valuesCache.write(Key('A'), set => {
        set('x', 3);
        set('y', 30);
    });
    expect(invalidated).toEqual(1)
    expect([...snap1.get(keyIt('A'), 'x')]).toEqual([1]);
    const snap2 = valuesCache.getSnapshot(()=>{});
    expect([...snap2.get(keyIt('A'), 'x')]).toEqual([3, 1]);
});

test('assoc', () => {
    const valuesCache = createValuesCache(sign, Storage());
    valuesCache.write(Key('A'), set => set('name', "aayyy"));
    valuesCache.write(Key('B'), set => set('a', Key('A')));
    let snap = valuesCache.getSnapshot(() => {});
    const r = [...snap.get(keyIt('B'), 'a')];
    expect(r.length).toEqual(1);
    expect(r[0].id).toEqual('A');

    //now delete
    valuesCache.write(Key('B'), set => set('a', Key('A', true)));
    snap = valuesCache.getSnapshot(() => {});
    expect([...snap.get(keyIt('B'), 'a')]).toEqual([]);
});

test('index', () => {
    const valuesCache = createValuesCache(sign, Storage());
    valuesCache.write(Key('A'), set => set('name', "aayyy"));
    valuesCache.write(Key('B'), set => set('a', Key('A')));
    valuesCache.write(Key('C'), set => set('a', Key('A')));
    let snap = valuesCache.getSnapshot(() => {});
    expect([...snap.index('a', keyIt('A'))].map(key=>key.id)).toEqual(['C', 'B']);

    //now delete
    valuesCache.write(Key('B'), set => set('a', Key('A', true)));
    snap = valuesCache.getSnapshot(() => {});
    expect([...snap.index('a', keyIt('A'))].map(key=>key.id)).toEqual(['C']);
});

function Storage() {
    const dict = new Map();
    function setItem(k, v) {
        expect(typeof k).toBe("string");
        expect(typeof v).toBe("string");
        dict.set(k, v);
    }

    function getItem(k) {
        return dict.get(k);
    }
    return {setItem, getItem}
}
