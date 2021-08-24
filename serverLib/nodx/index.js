import Node,{ObjNode} from "./node.js";
import { root as fs} from "./fs.js"
import "./telebot.js"
import {store} from "./typesharing.js"
import sql from "sqlite3";
const root = new Node('root')
root.msg_handler('loadtypes',({data})=>store.getnames(data))
const js = new ObjNode(global)
root.set(fs,'fs')
root.set(js,'js')
import http from 'http'
import URL from "url"
const server = http.createServer(async (req, res) => {
  const url = URL.parse(req.url,true)
  var data = ''
  let path = decodeURI(url.pathname);res.statusCode=200; 
  res.setHeader('Content-Type','application/json')  
  if(path.startsWith('/r')){
    path = path.slice(2)
    const node = await root.fromPath(path)
    if(!node){res.statusCode=404;res.end('not found')}
    else{
      const args = url.query
      req.on('data',ch=>{data+=ch})
      req.on('end',async ()=>{
        let respObj
        if(args?.type){respObj = await node.msg(args.type,{req,res,data:data&&JSON.parse(data)})}
        else{respObj = await node.msg(req.method,{req,res,data,args})}
        if(!res.writableEnded){res.end( JSON.stringify(respObj))}
      })
    }
  }else if(path=='/favicon.ico'){root.fromPath('fs/favicon.ico').msg('GET',{req,res})}
  else{root.fromPath('fs/index.html').msg('GET',{req,res})}
  console.log(`${req.url} ${res.statusCode} ${data||''}`)
});
sql.verbose()
const [hostname,port] = ['0.0.0.0',2020]
server.listen(port,hostname,() => {console.log(`Server running at http://${hostname}:${port}/`);});