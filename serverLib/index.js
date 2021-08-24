import http from "http"
import { existsSync,readFileSync,statSync} from "fs"
export const Cookie = {
    get(request){
      var list = {},rc = request.headers.cookie;
      rc && rc.split(';').forEach(function( cookie ) {
          var parts = cookie.split('=');
          list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
      });
      return list;
    },
    set(res,cookies,path){
      path = path?`; Path = ${path}`:''
      res.setHeader('Set-Cookie',Object.entries(cookies).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('; ')+path);
      
    },
    upd(req,res,list={},path){
      this.set(res,Object.assign(this.get(req),list),path)  
    }
}
export async function getBody(req){
  return new Promise((ok)=>{
    let data = ''
    req.on('data',(c)=>data+=c)
    req.on('end',()=>ok(data))
  })
}
export function notFound(res,msg){
  console.log('return "not fond"')
  res.statusCode = 404;
  res.end(`not found: ${msg}`)
}
export function redirect(res,url){
  console.log(`redirecting: ${url}`)
  res.writeHead(302, {'Location': url});
  res.end(); return true}
export class STATICFILES{
  folder=existsSync('dist')?"dist":"public"
  static mimes = existsSync('serverLib/mimes.json') && JSON.parse(readFileSync('serverLib/mimes.json'))
  mimeType(path){
    const ext = path.split('.').pop()
    if(!STATICFILES.mimes){console.error('mimes.json is not found')}
    return STATICFILES.mimes?.[ext]||'application/octet-stream'
  }
  get(path){return readFileSync(`${this.folder}/${path}`)}
  serve(req,res){
    const path = this.folder+req.url
    if(existsSync(path)&&statSync(path).isFile()){
      res.statusCode = 200;
      res.setHeader('Content-Type',this.mimeType(path))
      res.end(readFileSync(path))
      return true
    }
  }
}
export class API{
  constructor(server,methods){this.methods = methods||API.methods}
  static methods={
    public:{
      hello({data}){
        return `Hello, ${data.name}`
      }
    }
  }
  prefix="/api"
  serve(req,res){
    if(req.url.startsWith(this.prefix)){
      const names = req.url.substr(this.prefix.length+1).split('/')
      let folder = this.methods
      for(const name of names){
        if(typeof folder[name]=='object'){folder = folder[name]}
        else if(folder[name]){
          getBody(req).then(async d=>{
            const data = JSON.parse(d)
            console.log(`${this.constructor.name}: call ${names.join('/')}`)
            const ret = await folder[name]({req,res,data})
            if(!res.writableEnded){res.end(JSON.stringify(ret))}
          })
          return true
        }else{return}
      }
    }
  }
}
/**@param {(req:http.IncomingMessage,res:http.ServerResponse)=>void} fn */
export function rh(fn){return fn}
export default class Server{
  static reqHandlers = [API,STATICFILES]
  entry ="index.html"
  constructor(port=2020,host="localhost",name="http-server",isSPA=false){
    Object.assign(this,{port,host,isSPA,name})
    this.reqHandlers = Object.fromEntries(Server.reqHandlers.map(
      h=>[h.name,typeof h == "function"?new h(this):h]
      ))
    Object.values(this.reqHandlers).forEach(h=>h.init?.(this))
  }
  addReqHandler(name,rh){this.reqHandlers[name] = rh;rh.init?.(this)}
  run(){
    const rhs = this.reqHandlers
    const server = http.createServer(async (req,res)=>{
      console.log(`incoming ${req.method} request: ${req.url} ${req.headers.cookie||""}`)
      //Cookie.upd(req,res,{url:req.url})
      for(const servName in rhs){
        const serv = rhs[servName]
        console.log(`run ${servName} service `)
        if(await serv.serve(req,res)) return 
      }
      const dosendDef = rhs["STATICFILES"]&&(this.isSPA||req.url=='/')
      return dosendDef?res.end(rhs["STATICFILES"].get(this.entry)):notFound(res,req.url)
    })
    server.listen(this.port,this.host,()=>console.log(`Server ${this.name} is running at http://${this.host}:${this.port}/`))
    return this.server = server
  }
}