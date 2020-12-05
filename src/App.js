import InputForm from './inputform.js';
import Buzz from "./buzz.js";
import ChooseGame from "./ChooseGame.js";

const GAME_STATES = Buzz.enumerate("Created", "Ongoing", "Finished");
function App(props) {
    const useBuzz = props.buzz.useBuzz;
    const [player, setPlayer] = useBuzz({name: "", ready: false});
    const gameSchema = {
        name: "", players: player.schema, state: GAME_STATES.Created};
    const [games, setGames] = useBuzz({id: "CELEBRITY", all: gameSchema});
    const [chooser, setChooser] = useBuzz({chosen: Buzz.last(gameSchema)});

    if (!player.ready) {
        return <InputForm label="Player: "
            onSubmit={name => {
                setPlayer({name, ready:true})}} />; }
    
    const chosen = chooser.chosen;
    if (!chosen || chosen.state === GAME_STATES.Finished) {
        return <ChooseGame games={games} choose={id => setChooser({chosen: {id}})} player={player} 
             addGame={name=>setGames({all: {name}})} buzz={props.buzz} />
    }

    return <GamePlay game={chosen} player={player}/>
}

function GamePlay(props) {
    return <h2>This is game {props.game.name}</h2>;
}

export default App;
