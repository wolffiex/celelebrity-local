import { useState } from 'react';
import InputForm from './inputform.js';

function ChooseGame(props) {
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
        props.chooser(props.buzz.select(id));
    }

    console.log('hola', games.all.map(({id, name}) => 'game' + id + "xxxx" + name).toArray())
    const selectGameForm = 
        <form onSubmit={submitGameChoice}>
            <select name="games" disabled={isCreating} value={selected}
                    onChange={onChange} size="5">
                {games.all.map(({id, name}) => 
                    <option value={id} key={id}>{name}</option>).toArray()}
                <option value={NEW_GAME_VALUE}>Create new game</option>
            </select>
            <input type="submit" />
        </form>;

        console.log('se', selectGameForm);

    function submitNewGame(name) {
        props.addGame(name);
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
