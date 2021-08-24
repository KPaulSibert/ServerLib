import {Telegraf,Context} from "telegraf"
import {Keyboard} from "telegram-keyboard"
class Member{
    /**@param {} ctx*/
    constructor(ctx,chat){
        this.chat = chat
        this.name = ctx.chat.first_name+' '+ctx.chat.last_name
        this.id = ctx.chat.id
    }
    send(msg,...kb){
        console.log()
        tg.sendMessage(this.id,msg,kb.length?Keyboard.reply(kb):Keyboard.remove())
    }
    get others(){return Object.values(this.chat.members).filter(p=>p.id!=this.id)}
    received(msg){
    }
    static apply(pl){
        pl.__proto__ = this.prototype
        pl.init?.()
    }
}
class Caht{
    defMemberClass = Member
    members = {}
    all(){return Object.values(this.members)}
    constructor(token){
        const bot = new Telegraf(token)
        bot.on('message',(ctx)=>{
            const id = ctx.message.chat.id
            if(!(id in this.members)){this.members[id] = new this.defMemberClass(ctx)}
            members[id].received(ctx.message.text)
        })
        this.bot = bot
    }
    start(){this.bot.launch()}
}
const ZoomGamesToken = '1653865876:AAEXTXCHmJVfSFSC18QWbJn-3phRZbRbexA'