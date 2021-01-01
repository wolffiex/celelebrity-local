import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Buzz from './buzz';


//const params = new URLSearchParams(window.location.search);
//const masterKey = params.get('id');
//if (!masterKey) throw new Error("Missing id.");
//const key = "password"
const params = new URLSearchParams(window.location.search)
const peer = params.has('peer') ? params.get('peer') : null;
console.log(params, peer)

const buzz = Buzz.node(localStorage, peer);
global.buzz = buzz;

ReactDOM.render(
  <React.StrictMode>
    <App buzz={buzz} />
    <footer style={{fontSize:'small'}}>Buzz id: {buzz.key.id}</footer>
  </React.StrictMode>,
  document.getElementById('root')
);
