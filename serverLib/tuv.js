import https from "https"

import http from 'http'
//#region setup request
const data = `{"locale":"de-DE","isLegacyTos":false,"filterMonth":8,"filterYear":2021,"vehicleServices":[{"id":4007}],"vehicleType":{"id":44},"vics":[{"id":378,"externalLocale":"de-DE","distance":0},{"id":379,"externalLocale":"de-DE","distance":10},{"id":380,"externalLocale":"de-DE","distance":19}]}`
const options = {
    hostname: 'www.tuv.com',
    port: 443,
    path: '/tos-pti-relaunch-2019/rest/ajax/getVacanciesByMonth',
    method: 'POST',
    headers: {
    'origin': 'https://www.tuv.com',
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
}
let counter = 0;
function makeRequest(){
  const req = https.request(options, res => {
      console.log(`statusCode: ${res.statusCode}`)
      res.on('data', d => {
          const vacan = JSON.parse(d).vacancies.map(e=>e.date.slice(8)+' Августа').join('\n')
          if(vacan){tg.sendMessage(PAULID,vacan)}
        process.stdout.write(d)
        counter++;
      })
    })
    req.on('error', error => {
      console.error(error)
    })
    req.write(data)
    req.end()
}
//#endregion
//#region setup bot
import {Telegraf} from "telegraf"
const bot = new Telegraf('1653865876:AAEXTXCHmJVfSFSC18QWbJn-3phRZbRbexA')
const tg = bot.telegram
const PAULID = 719245346
bot.on('message',(b)=>{
  if(b.message.text=='exit'){
    b.reply('exit');
    setTimeout(()=>process.exit(),1000)}
  b.reply(`counter:${counter}`)
})
//#endregion
const cb = bot.webhookCallback()
debugger
const delay = 3
const PORT = 2021
const server = http.createServer(bot.webhookCallback())
server.listen(PORT,'0.0.0.0',async ()=>{
  const tunnel = await lt({port:PORT,subdomain:"nodx"})
  tg.sendMessage(PAULID,`StartServer ${tunnel.url}`)
  tg.setWebhook(tunnel.url)
  bot.startWebhook('/',null,4000)
  makeRequest();
  setInterval(makeRequest,1000*60*delay)
  process.once('exit',()=>{
    tunnel.close()
    tg.deleteWebhook()
  })
})
  