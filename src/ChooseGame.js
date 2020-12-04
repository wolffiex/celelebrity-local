import { useState } from 'react';
import Buzz from "./buzz.js";
import InputForm from './inputform.js';

function ChooseGame(props) {
    const useBuzz = props.buzz.useBuzz;
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);
    const games = props.games;

    function onChange(e){
        e.preventDefault();
        if (e.target.value === NEW_GAME_VALUE) {
            setSelected("");
            setCreating(true);
        }
    }

    console.log('higames', games.id, games.list)
    let gameOptions = games.all.map(({id, name}) => 
        <option value={id} key={id}>{name}</option>
    );

    const selectGameForm = 
        <form>
            <select name="games" disabled={isCreating} value={selected}
                    onChange={onChange} size="5">
                {gameOptions}
                <option value={NEW_GAME_VALUE}>Create new game</option>
            </select>
        </form>;

    const createGameForm = !isCreating ? null :
        <InputForm onSubmit={name => games.all.append({name})} label="Game name: " />;

    return (
        <div className="gameChoice">
            <h1>{props.player.name} enter Game</h1>
            {selectGameForm}
            {createGameForm}
        </div>
    );
}

export default ChooseGame;
