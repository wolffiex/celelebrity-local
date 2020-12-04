import { useState } from 'react';
import InputForm from './inputform.js';

function ChooseGame(props) {
    console.log("GoG")
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);
    const games = props.games;

    function onChange(e){
        e.preventDefault();
        const value = e.target.value;
        if (value === NEW_GAME_VALUE) {
            setSelected("");
            setCreating(true);
        } else {
            setSelected(value);
        }
    }

    function submitGameChoice(e) {
        e.preventDefault();
        const id = e.target.games.value;
        games.chosen = id;
    }

    const selectGameForm = 
        <form onSubmit={submitGameChoice}>
            <select name="games" disabled={isCreating} value={selected}
                    onChange={onChange} size="5">
                {games.all.map(({id, name}) => 
                    <option value={id} key={id}>{name}</option>)}
                <option value={NEW_GAME_VALUE}>Create new game</option>
            </select>
            <input type="submit" />
        </form>;

    function submitNewGame(name) {
        games.all.append({name});
        setCreating(false);
    }
    const createGameForm = !isCreating ? null :
        <InputForm onSubmit={submitNewGame} label="Game name: " />;

    return (
        <div className="gameChoice">
            <h1>{props.player.name} enter Game</h1>
            {selectGameForm}
            {createGameForm}
        </div>
    );
}

export default ChooseGame;
