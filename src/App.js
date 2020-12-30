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
    const gameSchema = {
        room: {name:""}, players: player.schema, state: GAME_STATES.Created};
    const [game, setGame] = useBuzz(gameSchema);

    const chosenRoom = game.room.last();
    props.step(() => {
        if (!player.ready) {
            setPlayer({name: 'k3f', ready: true});
            return
        }
        if (!chosenRoom) {
            setGame({room : {name: 'chose'}});
        }
    });

    if (!player.ready) {
        return <InputForm label="Player: "
            onSubmit={name => setPlayer({name, ready: true})} />; }
    
    if (!chosenRoom) {
        return <ChooseGame game={game} choose={room => setGame({room})}
            player={player} buzz={props.buzz} />
    }

    return <GamePlay game={game} player={player} />
}

function GamePlay(props) {
    return <div>
        <h2>This is game {props.game.room.name}</h2>
    </div>;
}

export default App;
