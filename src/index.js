import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Buzz from './buzz.js';


const CLIENT = Buzz.record("Client");
//const params = new URLSearchParams(window.location.search);
//const masterKey = params.get('id');
//if (!masterKey) throw new Error("Missing id.");
const buzz = Buzz.instance();

ReactDOM.render(
  <React.StrictMode>
    <App buzz={buzz} />
  </React.StrictMode>,
  document.getElementById('root')
);
