import 'regenerator-runtime/runtime'
import {io} from "socket.io-client"
const socket = io('ws://localhost:2020/')
socket.on('connect', function(data) {
  console.log('connected')
  socket.emit('join', 'Hello World from client');
});
import App from "./app"
import reactDOM from "react-dom"
reactDOM.render(App(),document.getElementById('app'))