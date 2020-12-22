import Buzz from './index.js';
const mockSetState = jest.fn();

jest.mock('react', () => ({
    useState: initial => [initial, mockSetState]
}));

test('it', () => {
    const buzz = Buzz.node();
    const [list, setList] = buzz.useBuzz({
        myList: {name: ''},
        all: Buzz.constant("ALL")});
    setList({myList: {name: 'a'}});
    console.log(mockSetState.mock)
    expect(1+1).toEqual(2);
});

