import InputForm from './inputform.js';
import Buzz from "./buzz.js";
import ChooseGame from "./ChooseGame.js";
import { useState } from 'react';

const GAME_STATES = Buzz.enumerate("Created", "Ongoing", "Finished");
console.log(GAME_STATES, GAME_STATES.Created)
function App(props) {
    const useBuzz = props.buzz.useBuzz;
    const [player, setPlayer] = useBuzz({name: "", ready: false});
    const gameSchema = {
        name: "", players: player.schema, state: GAME_STATES.Created};
    const [games, setGames] = useBuzz({id: "CELEBRITY", all: gameSchema});
    const [chosen, setChosen] = useState(null);

    if (!player.ready) {
        console.log(' ret pla')
        return <InputForm label="Player: "
            onSubmit={name => {
                setPlayer({name, ready:true})}} />; }
    
    if (!chosen || chosen.state === GAME_STATES.Finished) {
        return <ChooseGame games={games} chooser={setChosen} player={player} 
             addGame={name=>setGames({all: {name}})} buzz={props.buzz} />
    }

    return <GamePlay game={chosen} player={player}/>
}

function GamePlay(props) {
    console.log('wyy th', typeof props.game)
    return <h2>This is game {props.game.name}</h2>;
}

export default App;
