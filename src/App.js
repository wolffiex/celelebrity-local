import React, { useState } from 'react';
import {useValue} from "@repeaterjs/react-hooks";

function App() {
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);
    //const value = useValue(Buzz.);

    function onChange(e){
        e.preventDefault();
        if (e.target.value === NEW_GAME_VALUE) {
            setSelected("");
            setCreating(true);
        }
    }
    let createGameForm = null;

    function addGame(e) {
        console.log('add', e.target.gameName.value)
        e.target.value= "keyy";
    }

    if (isCreating) {
        createGameForm = (
            <form onSubmit={addGame}>
                <label htmlFor="gameName">Game name</label>
                <input name="gameName" autoFocus={true}/>
                <input type="submit" value="Add" />
            </form>
        );
    }
    return (
        <div className="gameChoice">
            <h1>Enter Game</h1>
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
