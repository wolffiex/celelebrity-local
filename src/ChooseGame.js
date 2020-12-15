import { useState } from 'react';
import InputForm from './inputform.js';
import Buzz from './buzz';

function ChooseGame(props) {
    const useBuzz = props.buzz.useBuzz;
    const roomSchema = {name: ""}; 
    const [rooms, setRooms] = useBuzz({
        myRooms: Buzz.index(roomSchema),
        all: Buzz.constant("CELEBRITY")});
    const NEW_GAME_VALUE ="__new"
    const [isCreating, setCreating] = useState(false);
    const [selected, setSelected] = useState(undefined);

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
        props.choose(id);
    }

    const selectGameForm = 
        <form onSubmit={submitGameChoice}>
            <select name="games" disabled={isCreating} value={selected}
                    onChange={onChange} size="5">
                {rooms.all.map(aRooms => aRooms.myRooms)
                    .flatten(true)
                    .map(({id, name}) => 
                        <option value={id} key={id}>{name}</option>).toArray()}
                <option value={NEW_GAME_VALUE}>Create new room</option>
            </select>
            <input type="submit" />
        </form>;

    function submitNewGame(name) {
        setCreating(false);
        setRooms('myRooms', {name});
    }
    const createGameForm = !isCreating ? null :
        <InputForm onSubmit={submitNewGame} label="Room name: " />;

    return (
        <div className="gameChoice">
            <h1>{props.player.name} choose room:</h1>
            {selectGameForm}
            {createGameForm}
        </div>
    );
}

export default ChooseGame;
