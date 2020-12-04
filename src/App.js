import InputForm from './inputform.js';
import Buzz from "./buzz.js";
import ChooseGame from "./ChooseGame.js";

const GAME_STATES = Buzz.enumerate("Created", "Ongoing", "Finished");
console.log(GAME_STATES, GAME_STATES.Created)
function App(props) {
    const useBuzz = props.buzz.useBuzz;
    const player = useBuzz({name: "", ready: false});
    const gameSchema = {
        name: "", players: player.schema, state: GAME_STATES.Created};
    const games = useBuzz({id: "CELEBRITY", all: gameSchema, chosen: Buzz.last(gameSchema)});

    if (!player.ready) {
        console.log(' ret pla')
        return <InputForm label="Player: "
            onSubmit={name => {
                player.ready = true;
                player.name = name; }} />;
    }
    
    const chosen = games.chosen;
    if (!chosen || chosen.state === GAME_STATES.Finished) {
        console.log(' ret shoo')
        return <ChooseGame games={games} player={player} buzz={props.buzz} />
    }

    return <GamePlay game={chosen} player={player}/>
}

function GamePlay(props) {
    console.log('wyy th')
    return <h2>This is game</h2>;
}

export default App;
