import { useState } from 'react';
import InputForm from './inputform.js';

function ChooseGame(props) {
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);

    function addGame(e) {
        console.log('hadd', e)
    }

    const createGameForm = !isCreating ? null :
        <InputForm onSubmit={addGame} label="Game name: " />;

    function onChange(e){
        e.preventDefault();
        if (e.target.value === NEW_GAME_VALUE) {
            setSelected("");
            setCreating(true);
        }
    }

    const selectGameForm = 
        <form>
            <select name="games" disabled={isCreating} value={selected}
                    onChange={onChange} size="5">
                <option value="keyy">Game onee</option>
                <option value="kyey">Game two</option>
                <option value="kyey">Game two</option>
                <option value={NEW_GAME_VALUE}>Create new game</option>
            </select>
        </form>;

    return (
        <div className="gameChoice">
            <h1>{props.player.name} enter Game</h1>
            {selectGameForm}
            {createGameForm}
        </div>
    );
}

export default ChooseGame;
