import InputForm from './inputform.js';
import Buzz from "./buzz.js";
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
    const [rooms, setRooms] = useBuzz({name: "", all: Buzz.constant("CELEBRITY")});
    const [game, setGame] = useBuzz({
        room: Buzz.last(rooms.schema),
        state: GAME_STATES.Created,
        players: player.schema});
  
*/
    const gameSchema = {
        name: "", players: player.schema, state: GAME_STATES.Created};
    const [games, setGames] = useBuzz({id: "CELEBRITY", all: gameSchema});
    const [chooser, setChooser] = useBuzz({chosen: Buzz.last(gameSchema)});

    const chosen = chooser.chosen;
    props.step(() => {
        if (!player.ready) {
            setPlayer({name: 'k3f', ready: true});
            return
        }

        const id = setGames({all: {name: "playroom"}});
        setChooser({chosen: {id}});
    });

    if (!player.ready) {
        return <InputForm label="Player: "
            onSubmit={name => {
                setPlayer({name, ready:true})}} />; }
    
    if (!chosen || chosen.state === GAME_STATES.Finished) {
        return <ChooseGame games={games} choose={id => setChooser({chosen: {id}})} player={player} 
             addGame={name=>setGames({all: {name}})} buzz={props.buzz} />
    }

    const setName = name => setChooser({chosen: {id: chosen.id, name}});
    return <GamePlay game={chosen} setName={setName} player={player}/>
}

function GamePlay(props) {
    return <div>
        <h2>This is game {props.game.name}</h2>
        <button onClick={() => props.setName(props.game.name + "o")}> o me </button>
    </div>;
}

export default App;
