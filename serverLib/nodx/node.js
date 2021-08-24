export function tourl(path,args){
    return path+'?'+ new URLSearchParams(args).toString()}
export default class Node{
    /**@param {Node} val*/
    static msg_handler(name,val){
        if(!this.hasOwnProperty('msg_handlers')){this.msg_handlers = {}}
        if(typeof name=="object"){
            for(const n in name){
                this.msg_handlers[n] = name[n]
            }
        }else{this.msg_handlers[name] = val}
    }
    /**@param {Node} node*/
    static extend(node,css){
        if(css){for(const name of Object.getOwnPropertySymbols(css)){node[name].css = css[name]}}
        Object.assign(this.prototype,node)}
    childs = {}
    constructor(name,parent){
        this.name = name
        this.parent = parent
    }
    fromPath(path,crea){
        if(path.startsWith('/')){path = path.slice(1)}
        return path?this.get(path.split('/'),crea):this
    }
    _get(name,crea){return crea? new Node(name,this):null}
    /**@returns {Node} */
    get(names,crea){
        if(typeof names=='string'){names=[names]}
        const [name,...next] = names
        let child;
        if(!(name in this.childs)){
            child = this._get(name,crea)
            if(child){this._set(child,name)}else{return}
        }else{child = this.childs[name]}
        if(next.length){
            return child instanceof Promise? new Promise(async ok=>ok(await (await child).get(next,crea))):child.get(next,crea)
        }else{return child} 
        return next.length?child.get(next,crea):child
    }
    async msg(type,args){
        let val
        if(this.msg_handlers?.[type]){val=this.msg_handlers[type]}
        else{
            for(const cls of getMRO(this.constructor)){
                if(!cls.hasOwnProperty('msg_handlers')){continue}
                if(cls.msg_handlers[type]){val=cls.msg_handlers[type];break}
            }
        }if(typeof val=="function"){val = await val.apply(this,[args]);}
        return val
    }
    mset(...vals){
        if(vals[0].constructor==Object){
            for(const name in vals[0]){this.set(vals[0][name],name)}
        }else{for(const n of vals){this.set(n)}}
    }
    _set(node,name){
        if(node instanceof Promise){
            node.then((r)=>{r&&this._set(r,name)})
            this.childs[name] = node;return
        }
        if(node.parent!=false){
            if(!name){name=node.name}
            else{node.name = name}
            this.childs[name] = node
        }else{delete this.childs[name]}
        if(!node.parent){node.parent = this}
    }
    del(name){ delete this.childs[name]}
    childNames(){
        return Object.keys(this.childs)}
    get path(){
        const names = []
        var node = this;
        while(node){
            names.unshift(node.name);
            node = node.parent}
        return names.join('/')
    }
}
Node.prototype.set=Node.prototype._set
Node.prototype.msg_handler = Node.msg_handler
Node.msg_handler('childNames',function(){return this.childNames()})
export class RemoteNode extends Node{
    constructor(host,name,par){super(name,par)
        if(host)this.host = host;
    }
    async _get(name){
        const names = await this.childNames()
        console.log(names)
        const node = new RemoteNode(null,name,this); 
        let type
        if(names.includes(name)){console.log('includes')
            const types = await this.prop('childTypes')
            await stypeLoader.main.load(types)
            type = types[names.indexOf(name)]
        }else{type = await node.msg('typeid');await stypeLoader.main.load([type])}
        if(type==null){return}
        console.log(name+' type '+type)
        changeclass(node,stypeLoader.main.get(type))
        return node
    }
    _cached={};
    get url(){
        const names = []
        let node = this 
        while(!node.host){
            names.unshift(node.name)
            node=node.parent}
        if(!node.host){throw(this,' is not connected')}
        return node.host+'/'+names.join('/')
    }
    childNames(){return this.prop('childNames')}
    async post(args,body){
        if(typeof body!='string'){body=JSON.stringify(body)}
        const ret = await fetch(tourl(this.url,args),{method:"POST",body})
        return await ret.text()
    }
    async msg(type,args){
        return JSON.parse(await this.post({type},args?JSON.stringify(args):''))
    }
    smsg(type,args){return this.post({type},args?JSON.stringify(args):'')}
    async prop(name){
        if(this._cached[name]){return this._cached[name]}
        return this._cached[name] = await this.msg(name)
    }
}
//#region types
const typename = Symbol('typename')
export class typeStorage{ programmsa
    constructor(base=Node){this.base=base}
    types = new Map()
    get(cls){
        if(this.types.has(cls)){return this.types.get(cls)}
        else{
            const newProto = {[typename]:cls}
            const parentcls = cls.prototype.__proto__?.constructor;
            newProto.__proto__ = parentcls?this.get(parentcls):this.base.prototype
            this.types.set(cls,newProto)
            return newProto
        }
    }
    /**@param {Node} proto */
    extend(cls,proto){Object.assign(this.get(cls),proto)}
}
export class stypeStorage extends typeStorage{
    types={}
    setParent(name,par_name){
        const proto = this.get(name)
        proto.__proto__ = par_name!=null?this.get(par_name):this.base.prototype
    }
    get(name){
        if(name in this.types){return this.types[name]}
        else{return this.types[name] = {[typename]:name}}
    }
    key(name){name='keys:'+name
    if(name in this.types){return this.types[name].symbol}
    const symbol = Symbol(name)
    return (this.types[name] = {symbol}).symbol
    }
}
export const types = new stypeStorage(RemoteNode)
export class stypeLoader{
    static main=new stypeLoader(types)//
    ids={}
    msg = 'loadtypes'
    constructor(strg,node){this.storage=strg,this.node=node}
    async load(ids=[]){
        const unloaded = ids.filter((id,i,a)=>!(id in this.ids)&&a.indexOf(id)==i)
        if(unloaded.length){
            console.log('loading ids',unloaded)
            const types = await this.node.msg(this.msg,unloaded)
            for(const id in types){
                if(!(id in this.ids)){
                    const [name,parent] = types[id]
                    this.ids[id] = name
                    this.storage.setParent(name,parent&&this.ids[parent])
                }
            }
        }
    }
    get(id){return id in this.ids?this.storage.get(this.ids[id]):console.error('no id')}
}
export class ObjNode extends Node{
    constructor(val){super()
        this.val = val;
        const proto = jstypes.get(val.constructor||Object)
        if(proto){changeclass(this,proto)}
    }
    _get(name,crea){
        if(this.val[name]===undefined){
            if(crea){this.val[name]={}}else{return null}
        }return new ObjNode(this.val[name])
    }
    set(name,val){
        this.val[name]=val
        super.set(name,new ObjNode(val))
    }
    childNames(){return Object.getOwnPropertyNames(this.val)}
}
export const jstypes = new typeStorage(ObjNode)
//utils
export function* getMRO(cls){
    while(true){
        if(!cls)return
        yield cls
        cls = cls.prototype.__proto__?.constructor
    }
}
export function changeclass(node,proto,...args){
    node.__proto__ = proto
    if(proto.hasOwnProperty('__init')){proto.__init.apply(node,args)}
}

