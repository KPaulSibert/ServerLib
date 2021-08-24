import {Session} from 'inspector'
import {promisify} from "./utils.js"
import {relative} from "path" 
import Node from '../client/node.js'
import {PATH,DBtable, db as DB, DBColumn, File} from "./fs.js"
export class TypesStorage extends DBtable{
  constructor(path,name='types'){
    const [db,c] = [new DB(path),DBColumn]
    super(db.db,name)
    this.parent=db
    this.mset(new c('name'),new c('parent','integer'))
    this.create()
  }
  async getid(cls,par){
    const name = typeof cls=='string'?cls:await getLoc(cls)
    const entries = await this.select({name})
    if(!entries.length){
      const parentCls = par||(cls.prototype.__proto__?.constructor)
      const parent = parentCls && await this.getid(parentCls)
      return await this.insert({name,parent});
    }else{return entries[0].id}
  }
  async getnames(ids){
    if(!(ids instanceof Set)){ids = new Set(ids)}
    const ret = {}
    const parents = new Set()
    for(const id of ids){if(id==null){continue}
      const entry = await this.select({id})
      if(entry.length){
        const {name,parent} = entry[0]
        if(!ids.has(parent)){parents.add(parent)}
        ret[id] = [name,parent]
      }else{console.warn(`type with id ${id} wasnt found`)}
    }
    return parents.size?{...(await this.getnames(parents)),...ret}:ret
  }
}
export const store = new TypesStorage(PATH+'/types.db')
promisify(Session,'post')
const scripts = {}
const insp = new Session();
insp.connect()
insp.on('Debugger.scriptParsed', result => {
    const id = result.params.scriptId
    scripts[id] = decodeURI(result.params.url)
  });
await insp.post('Debugger.enable');
async function getLoc(fn){
    global._fn = fn
    const objData = await insp.post('Runtime.evaluate',{expression:'global._fn'})
    const props = await insp.post('Runtime.getProperties',{objectId:objData.result.objectId})
    //console.log(props)
    const path = scripts[props.internalProperties[0].value.value?.scriptId]
    if(path&&path.startsWith('node:')){return path}
    return path?(relative('file:/'+PATH,path)+'/'+fn.name):fn.name
}
Node.msg_handler({
  typeid(){return store.getid(this.constructor)},
  async childTypes(){
    const types = []
    for(const name of await this.childNames()){
      const child = await this.get(name)
      types.push(await child?.msg('typeid'))
    }
    return types
  }
})
File.msg_handler({
  typeid(){console.log(this);return store.getid('ext:'+this.ext,File)}
})