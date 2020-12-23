import Buzz from './index.js';
const mockSetState = jest.fn();

jest.mock('react', () => ({
    useState: initial => [typeof initial == "function" ? initial() : initial, mockSetState]
}));

test('constant', () => {
    const buzz = Buzz.node();
    const schema = {myList: {name: ''}, all: Buzz.constant("ALL")};
    const [list, setList] = buzz.useBuzz(schema);
    setList({myList: {name: 'a'}});
    setList({myList: {name: 'b'}});
    const [list2] = buzz.useBuzz(schema);
    expect([...list2.all.select('myList').map(x => x.name)]).toEqual(['b', 'a']);
});

test('props', () => {
    const buzz = Buzz.node();
    const schema = {x:0, y:0};
    const [obj1, setObj] = buzz.useBuzz(schema);
    setObj({x:1});
    const [obj2] = buzz.useBuzz(schema, obj1.id);
    expect(obj2.x).toEqual(1);
    expect(obj2.y).toEqual(0);
});
