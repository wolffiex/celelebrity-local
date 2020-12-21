import { render, screen } from '@testing-library/react';
import App from './App';
import Buzz from './buzz';

test('steps', () => {
    const buzz = Buzz.node();
    render(<App buzz={buzz}/>);
    const stepButton = screen.getByText(/step/i);
    expect(stepButton).toBeInTheDocument();
});
