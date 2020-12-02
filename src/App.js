import InputForm from './inputform.js';
import React, { useEffect, useState } from 'react';
//import {useValue} from "@repeaterjs/react-hooks";
import Buzz from "./buzz.js";

const states = ["Ready", "Choose", "Play"];
function App(props) {
    const useBuzz = props.buzz.useBuzz;
    const [player, setPlayer] = useBuzz({name: "", ready: false, currentGame: Buzz.last});
    const [game, setGame] = useBuzz({name: "", state: ["Created","Started", "Ended"], 
        players: Buzz.all(player)});

    if (player === null) {
        return <InputForm label="Player: "
            onSubmit={name => setPlayer({name, ready: true} )} />;
    }
    
    if (game === null) {
        return <ChooseGame setGame={setGame} player={player} />
    }

    return <GamePlay game={game} player={player}/>
}

function ChooseGame(props) {
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);
    function addGame(e) {
        console.log('had', e)
    }

    const createGameForm = !isCreating ? null :
        //refactor this with submitPlayer
        <form onSubmit={addGame}>
            <label htmlFor="gameName">Game name</label>
            <input name="gameName" autoFocus={true}/>
            <input type="submit" value="Add" />
        </form>;

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

function GamePlay(props) {
    return <h2>This is game</h2>;
}

export default App;
