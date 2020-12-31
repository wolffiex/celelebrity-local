import Buzz from './index.js';
const mockSetState = jest.fn();

jest.mock('react', () => ({
    useState: initial => [typeof initial == "function" ? initial() : initial, mockSetState]
}));

test('constant', () => {
    const buzz = Buzz.node(Storage());
    const schema = {myList: {name: ''}, all: Buzz.index('all')};
    const [list, setList] = buzz.useBuzz(schema);
    setList({myList: {name: 'a'}, all: Buzz.constant('ALL')});
    setList({myList: {name: 'b'}, all: Buzz.constant('ALL')});
    const [list2, setList2] = buzz.useBuzz(schema, list.key);
    expect([...list2.all.map(e=>e.myList).flatten(true).map(r=>r.name)]).toEqual(['b', 'a']);
});

test('props', () => {
    const buzz = Buzz.node(Storage());
    const schema = {x:0, y:0};
    const [obj1, setObj] = buzz.useBuzz(schema);
    setObj({x:1});
    const [obj2] = buzz.useBuzz(schema, obj1.key);
    expect(obj2.x).toEqual(1);
    expect(obj2.y).toEqual(0);
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
