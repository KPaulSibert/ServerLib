import 'regenerator-runtime/runtime'
import {io} from "socket.io-client"
import "bootstrap/dist/css/bootstrap.min.css"
const socket = io('ws://localhost:2020/')
socket.on('connect', function(data) {
  console.log('connected')
  socket.emit('setname','Paul Sibert');
});
import App from "./app"
import reactDOM from "react-dom"
reactDOM.render(App(),document.getElementById('app'))