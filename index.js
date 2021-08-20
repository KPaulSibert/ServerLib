import SERVER from "./serverLib/index.js"
import "./serverLib/userLib.js"
import socket from "./serverLib/socketLib.js"
import { initDB } from "./serverLib/DBLib.js"
initDB('mysql://root@localhost:3306/newdb')
SERVER.name="parcel"
SERVER.isSPA = true
const server = SERVER.run()
socket(server)
