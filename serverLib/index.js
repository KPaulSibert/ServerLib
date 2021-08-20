
import http from "http"
import { existsSync,readFileSync,statSync} from "fs"
export const Cookie = {
    get(request){
      var list = {},rc = request.headers.cookie;
      rc && rc.split(';').forEach(function( cookie ) {
          var parts = cookie.split('=');
          list[parts.shift().trim()] = decodeURI(parts.join('='));
      });
      return list;
    },
    set(res,cookies,path){
      path = path?`; Path = ${path}`:''
      res.setHeader('Set-Cookie',Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ')+path);
      
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
export const STATICFILES = {
  name:'staticFiles',
  folder:existsSync('dist')?"dist":"public",
  mimes:existsSync('serverLib/mimes.json') && JSON.parse(readFileSync('serverLib/mimes.json')),
  mimeType(path){
    const ext = path.split('.').pop()
    if(!this.mimes){console.error('mimes.json is not found')}
    return this.mimes?.[ext]||'application/octet-stream'
  },
  get(path){return readFileSync(`${this.folder}/${path}`)},
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
export const API = {
  name:'API',
  methods:{
    public:{
      hello({data}){
        return `Hello, ${data.name}`
      }
    }
  },
  /**@param {({req:http.IncomingMessage,res:http.ServerResponse})=>void} fn */
  add(name,fn){this.methods[name]=fn},
  prefix:"/api",
  serve(req,res){
    if(req.url.startsWith(this.prefix)){
      const names = req.url.substr(this.prefix.length+1).split('/')
      let folder = this.methods
      for(const name of names){
        if(typeof folder[name]=='object'){folder = folder[name]}
        else if(folder[name]){
          getBody(req).then(async d=>{
            const data = JSON.parse(d)
            console.log(`${this.name}: call ${names.join('/')}`)
            const ret = await folder[name]({req,res,data})
            if(!res.writableEnded){res.end(JSON.stringify(ret))}
          })
          return true
        }else{return}
      }
    }
  }
}
export default {
  name:"http-server",
  host:"localhost",
  port:2020,
  entry:"index.html",
  isSPA:false,
  services:[API,STATICFILES],
  run(port=this.port,host=this.host){
    const server = http.createServer(async (req,res)=>{
      console.log(`incoming ${req.method} request: ${req.url} ${req.headers.cookie||""}`)
      //Cookie.upd(req,res,{url:req.url})
      for(const serv of this.services){
        console.log(`run ${serv.name||"anonym"} service `)
        if(await serv.serve(req,res)) return 
      }
      return this.isSPA||req.url=='/'?res.end(STATICFILES.get(this.entry)):notFound(res,req.url)
    })
    server.listen(port,host,()=>console.log(`Server ${this.name} is running at http://${host}:${port}/`))
  }
}