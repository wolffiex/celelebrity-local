import { render, screen } from '@testing-library/react';
import App from './App';
import Buzz from './buzz';

test('steps', () => {
    const buzz = Buzz.node(Storage());
    render(<App buzz={buzz}/>);
    const stepButton = screen.getByText(/step/i);
    expect(stepButton).toBeInTheDocument();
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
