import {Server, Socket} from "socket.io"
export const Members = []
export class Member{
    /**@param {Socket} socket*/
    constructor(socket){
        this.socket = socket
        this.id = socket.id
        this.setClass(this.constructor)
        Members.push(this)
        socket.on('disconnect',()=>{
            let id = Members.indexOf(this)
            Members.splice(id,1)
        })
    }
    id=0
    emit(ev,...args){
        this.socket.emit(ev,...args)
    }
    others(){return Members.filter(m=>m.id!=this.id)}
    setClass(cls){
        this.__proto__ = cls.prototype
        for(const fnname of Object.getOwnPropertyNames(cls.prototype)){
            const fn = cls.prototype[fnname]
            if(fnname.startsWith('on')){
                const evname = fnname.substr(2)
                this.socket.on(evname,fn.bind(this))
            }
        }
    }
    onsetname(name){this.name = name;console.log(this)}
}
export default function start(srv){
    const server = new Server(srv)
    server.on('connection',(s)=>{
        console.log('socket.io: someone connected')
        new Member(s)
    })
}