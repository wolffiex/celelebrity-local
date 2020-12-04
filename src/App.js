import InputForm from './inputform.js';
import Buzz from "./buzz.js";
import ChooseGame from "./ChooseGame.js";

const GAME_STATES = Buzz.enumerate("Initialized", "Created", "Ongoing", "Finished");
function App(props) {
    const useBuzz = props.buzz.useBuzz;
    const player = useBuzz({name: "", ready: false});
    const gameSchema = {
        name: "", players: player.schema, state: GAME_STATES.Initialized};
    const games = useBuzz({id: "CELEBRITY", all: gameSchema, chosen: Buzz.last(gameSchema)});

    if (!player.ready) {
        return <InputForm label="Player: "
            onSubmit={name => {
                console.log('lkdj player', player, player.name)
                player.ready = true;
                player.name = name; }} />;
    }
    
    const chosen = games.chosen;
    if (!chosen || chosen.state === GAME_STATES.Finished) {
        return <ChooseGame games={games} player={player} buzz={props.buzz}/>
    }

    return <GamePlay game={chosen} player={player}/>
}

function GamePlay(props) {
    return <h2>This is game</h2>;
}

export default App;
