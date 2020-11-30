import React, { useEffect, useState } from 'react';
//import {useValue} from "@repeaterjs/react-hooks";
import Buzz from "./buzz.js";

// partial schema ok. schema type errors are expected and are handled with rollback
const GAME = {
    "state": ["Created", "Started", "Ended"],
    "name":"string"}; 

const PLAYER = {"name":"string"};

function App(props) {
    const buzz = props.buzz;
    function InputForm(props) {
        let name = Buzz.key();
        function onSubmit(e) {
            console.log(e, e.target, name)
            e.preventDefault();
            props.onSubmit(e.target[name].value);
            console.log(e.target[name].value);
        }
        return <form onSubmit={onSubmit}>
            <label htmlFor={name}>{props.label}</label>
            <input name={name} />
            <input type="submit" />
        </form>
    };
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);

    console.log('uk', props.player)
    if (!props.player) {
        return <InputForm label="Player: " onSubmit={s => buzz.write(PLAYER.name, s)} />;
    }


    function onChange(e){
        e.preventDefault();
        if (e.target.value === NEW_GAME_VALUE) {
            setSelected("");
            setCreating(true);
        }
    }

    function addGame(e) {
        buzz.write(GAME, {
            state: GAME.enum.state.Created,
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

    //const gamePlayers = game.players

    return (
        <div className="gameChoice">
            <h1>{props.player.name} enter Game</h1>
            {selectGameForm}
            {createGameForm}
        </div>
    );
}

export default App;
