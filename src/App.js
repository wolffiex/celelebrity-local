import InputForm from './inputform.js';
import { useState } from 'react';
import Buzz from "./buzz.js";
import ChooseGame from "./ChooseGame.js";

function App(props) {
    const useBuzz = props.buzz.useBuzz;
    const [player, setPlayer] = useBuzz({name: "", currentGame: Buzz.last});
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

function GamePlay(props) {
    return <h2>This is game</h2>;
}

export default App;
