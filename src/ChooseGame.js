import { useState } from 'react';
import Buzz from "./buzz.js";
import InputForm from './inputform.js';

function ChooseGame(props) {
    const useBuzz = props.buzz.useBuzz;
    const useBuzzConst = props.buzz.useBuzzConst;
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);
    const gameRoom = useBuzz({name: ""});
    const Games = useBuzzConst("CELEBRITY", {list: Buzz.all(gameRoom)});
    console.log('Games', Games, Games.list)

    function addGame(name) {
        console.log('hadd', name)
        props.buzz.assoc(Games.list, {name});
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

    let gameOptions = Games.list.map(gameChoice => {
        return <option value={gameChoice.id}>{gameChoice.name}</option>
    });

    const selectGameForm = 
        <form>
            <select name="games" disabled={isCreating} value={selected}
                    onChange={onChange} size="5">
                {gameOptions}
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
