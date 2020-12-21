import createValuesCache from './ValuesCache.js';

test('snapshot', () => {
    const sign = () => 'test';
    const valuesCache = createValuesCache(sign);
    valuesCache.append('A', {x:1, y:10});
    let invalidated = 0;
    const invalidate = () => invalidated++;
    const snap1 = valuesCache.getSnapshot(invalidate);
    expect([...snap1.getValues('A', 'x')]).toEqual([1]);
    valuesCache.append('B', {x:2, y:20});
    expect(invalidated).toEqual(0)
    valuesCache.append('A', {x:3, y:30});
    expect(invalidated).toEqual(1)
    expect([...snap1.getValues('A', 'x')]).toEqual([1]);
    const snap2 = valuesCache.getSnapshot(invalidate);
    expect([...snap2.getValues('A', 'x')]).toEqual([3, 1]);
});

test('assoc', () => {
    const sign = () => 'test';
    const valuesCache = createValuesCache(sign);
    valuesCache.append('A', {name: "aayyy"});
    valuesCache.append('B', {a: valuesCache.assoc('A')});
    const snap = valuesCache.getSnapshot(() => {});
    expect([...snap.getRefs('B', 'a')]).toEqual(['A']);
});

test('index', () => {
    const sign = () => 'test';
    const valuesCache = createValuesCache(sign);
    valuesCache.append('A', {name: "aayyy"});
    valuesCache.append('B', {a: valuesCache.assoc('A')});
    valuesCache.append('C', {a: valuesCache.assoc('A')});
    const snap = valuesCache.getSnapshot(() => {});
    expect([...snap.index('a', ['A'])]).toEqual(['C', 'B']);
});
