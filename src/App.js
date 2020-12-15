import InputForm from './inputform.js';
import Buzz from "./buzz";
import ChooseGame from "./ChooseGame.js";

const GAME_STATES = Buzz.enumerate("Created", "Ongoing", "Finished");
function App(props) {
    let stepper = () => {};
    function step(_cb) {
        stepper = _cb;

    }
    const button = <button onClick={()=>stepper()}> Step </button>;
    return <div>{button} <SubApp buzz={props.buzz} step={step} /></div>
}

function SubApp(props) {
    const useBuzz = props.buzz.useBuzz;
    const [player, setPlayer] = useBuzz({name: "", ready: false});
    // new rules: you can only write to objects you created
/*
    const [game, setGame] = useBuzz({
        room: Buzz.last(rooms.schema),
        state: GAME_STATES.Created,
        players: player.schema});
  
*/
    const gameSchema = {
        name: "", players: player.schema, state: GAME_STATES.Created};
    const [games, setGames] = useBuzz({all_donotuse: gameSchema});
    const [chooser, setChooser] = useBuzz({chosen: Buzz.last(gameSchema)});

    const chosen = chooser.chosen;
    props.step(() => {
        if (!player.ready) {
            setPlayer('name', 'k3f');
            setPlayer('ready', true);
            return
        }

        const id = setGames('all', {name: "playroom"});
        setChooser('chosen', id);
        props.buzz.debug();
    });

    if (!player.ready) {
        return <InputForm label="Player: "
            onSubmit={name => {
                setPlayer('name', name)
                setPlayer('ready', true)}} />; }
    
    if (!chosen || chosen.state === GAME_STATES.Finished) {
        return <ChooseGame games={games} choose={id => setChooser('chosen', id)} player={player} 
             addGame={name=>setGames('all', {name})} buzz={props.buzz} />
    }

    return <GamePlay game={chosen} player={player} />
}

function GamePlay(props) {
    return <div>
        <h2>This is game {props.game.name}</h2>
    </div>;
}

export default App;
