import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Buzz from './buzz.js';


//const params = new URLSearchParams(window.location.search);
//const masterKey = params.get('id');
//if (!masterKey) throw new Error("Missing id.");
//const key = "password"
const buzz = Buzz.instance();
const player = buzz.create();
console.log('ind', player)

ReactDOM.render(
  <React.StrictMode>
    <App buzz={buzz} player={player}/>
  </React.StrictMode>,
  document.getElementById('root')
);
