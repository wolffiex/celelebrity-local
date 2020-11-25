import React, { useEffect, useState } from 'react';
//import {useValue} from "@repeaterjs/react-hooks";
import Buzz from "./buzz.js";

const GAME = Buzz.record("Game", {
    "name":"string", 
    "state": ["Created", "Started", "Ended"]});

const PLAYER = Buzz.record("Player", {
    "name":"string",
    "client": "id"});

function App(props) {
    const [playerID, setPlayer] = useState(null);
    const buzz = props.buzz;
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);
    //const gamePlayers = buzz.index(GAME, PLAYER); 

    const [playerName, setPlayerName] = useState(null);
    let tryMe = "";
    useEffect(() => {
        const pid = playerID;
        console.log('din this', pid)
        async function f() {
            if (!playerID) return;
            for await (let value of buzz.query(playerID)) {
                setPlayerName(value);
            }
        }
        f();
        return function cleanup() {
            console.log('should cleanup', pid)
        }
    }, [playerID]);

    if (!playerID) {
        function submitPlayer(e) {
            console.log(e)
            e.preventDefault();
            const name = e.target.player.value;
            console.log('name', name    )
            setPlayer(buzz.write(PLAYER, {name}));
        }
        return <form onSubmit={submitPlayer}>
            <label htmlFor="player">Player: </label>
            <input name="player" />
            <input type="submit" />
        </form>
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
        <form onSubmit={addGame}>
            <label htmlFor="gameName">Game name</label>
            <input name="gameName" autoFocus={true}/>
            <input type="submit" value="Add" />
        </form>;
    return (
        <div className="gameChoice">
            <h1>{playerName} enter Game</h1>
            <form>
                <select name="games" disabled={isCreating} value={selected}
                        onChange={onChange} size="5">
                    <option value="keyy">Game onee</option>
                    <option value="kyey">Game two</option>
                    <option value="kyey">Game two</option>
                    <option value={NEW_GAME_VALUE}>Create new game</option>
                </select>
            </form>
            {createGameForm}
        </div>
    );
}

export default App;
