import InputForm from './inputform.js';
import React, { useEffect, useState } from 'react';
//import {useValue} from "@repeaterjs/react-hooks";
import Buzz from "./buzz.js";

function App(props) {
    const buzz = props.buzz;
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);

    console.log('uk', props.player)
    if (!props.player.name) {
        return <InputForm label="Player: " onSubmit={s => props.player.name = s} />;
    }

    function onChange(e){
        e.preventDefault();
        if (e.target.value === NEW_GAME_VALUE) {
            setSelected("");
            setCreating(true);
        }
    }

    function addGame(e) {
        buzz.create({
            state: "Created",
            name: e.target.gameName.value});
    }

    const createGameForm = !isCreating ? null :
        //refactor thijs with submitPlayer
        <form onSubmit={addGame}>
            <label htmlFor="gameName">Game name</label>
            <input name="gameName" autoFocus={true}/>
            <input type="submit" value="Add" />
        </form>;

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

export default App;
