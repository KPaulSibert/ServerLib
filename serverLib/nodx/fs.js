import Node, { changeclass ,ObjNode} from "./node.js"
import sql from "sqlite3"
import { promisify } from "./utils.js";
import { dirname ,join} from "path";
import { fileURLToPath } from 'url';
import {existsSync, mkdir,lstatSync,readdirSync, readFileSync, writeFileSync, exists} from "fs"
export const PATH = dirname(dirname(fileURLToPath(import.meta.url)));
export const SRCPATH = join(PATH,'client')
export class File extends Node{
    constructor(path,){super();
        this.dirpath=path;
        this.ext = path.split('\\').pop().split('.').pop()
        if(this.ext in exts){
            changeclass(this,exts[this.ext].prototype)
        }
    }
    get content(){
        if(!existsSync(this.dirpath)){return}
        return readFileSync(this.dirpath)
    }
    set content(v){writeFileSync(this.dirpath,v)}
}
File.msg_handler({GET({res}){
    res.setHeader('Content-Type',mime[this.ext]||'application/octet-stream') 
    res.end(this.content) 
}})
export class Dir extends Node{
    constructor(dir=SRCPATH){
        super();
        this.dirpath = dir
    }
    _get(name,crea){
        const child_path = join(this.dirpath,name)
        if(!existsSync(child_path)){
            if(crea){
                if(name.includes('.')){return new File(child_path)}
                else{mkdir(child_path)}
            }else{return null}
        }
        const cls = lstatSync(child_path).isFile()?File:Dir
        return new cls(child_path)
    }
    childNames(){
        return readdirSync(this.dirpath)
    }
}
export const root = new Dir()
export class json extends File{
    get obj(){
        const value = JSON.parse(this.content)
        Object.defineProperty(this,'obj',{value});
        return value
    }
    childNames(){
        if(typeof this.obj=='object'){
            return Object.keys(this.obj)
        }
    }
    _get(name,crea){
        if(typeof this.obj!='object'){return}
        if(!(name in this.obj)){
            if(crea){this.obj[name]={};}else{return}//TODO save changes
        }return new ObjNode(this.obj[name])
    }
}
export class DBColumn extends Node{
    constructor(name,type,tbl){
        super(name,tbl)
        this.type=type
    }
    _get(name){}
}
export class DBtable extends Node{
    constructor(db,name,exi=false){
        super(name)
        this.exists = exi
        this.cols = new Set()
        if(!exi){this.set(new DBColumn('id','integer PRIMARY KEY'))}
        this.init = db.all(`PRAGMA table_info(${name})`)
        this.init.then(r=>{
            delete this.init
            for(const c of r){
                this.set(new DBColumn(c.name,c.type))
            }
        })
    }
    set(col,n){
        if(!this.cols.has(col.name)){
            this.cols.add(col.name);
            super.set(col,n)}
        }
    async create(){
        const types = Object.entries(this.childs).map(([k,v])=>`\n ${k} ${v.type}`)
        const sql = `CREATE TABLE IF NOT EXISTS ${this.name}(${types.join(',')})`
        await this.parent.db.run(sql);
        this.exists = true
    }
    async insert(val){
        this.init&&await this.init
        this.exists||await this.create()
        const isarr = Array.isArray(val)
        const keys = isarr?this.cols.slice(1,val.length+1):Object.keys(val)
        const vals = isarr?val:Object.values(val)
        const _vals = vals.map(()=>'?').join(',')
        const sql = `INSERT INTO ${this.name}(${keys}) VALUES(${_vals})`
        console.log('exe ',sql,vals)
        return new Promise(r=>this.parent.db.cb_run(sql,vals,function(){r(this.lastID)})) 
        
    }
    async select(cond,args=[],cols){
        if(typeof cond=='object'){cond=Object.keys(cond).map(k=>{args.push(cond[k]);return k+'=?'}).join(' AND ')}
        this.init&&await this.init
        this.exists||await this.create()
        cols=cols?cols.join(' '):'*'
        const sql = `SELECT ${cols} FROM ${this.name}`+(cond&&` WHERE ${cond}`)
        console.log('exe ',sql,args)
        return this.parent.db.all(sql,args)
    }
}
promisify(sql.Database,'get','all','run')
export class db extends File{
    get db(){
        const value = new sql.Database(this.dirpath)
        Object.defineProperty(this,'db',{value});
        return value
    }
    async _get(name,crea){
        const exists = (await this.childNames()).includes(name)
        return (exists||crea)&& new DBtable(this.db,name,exists)
    }
    async childNames(){
        const req = await this.db.all('SELECT name FROM sqlite_master')
        return req.map(e=>e.name)
    }
}
export const exts = {json,db}
const mime = root.get('mime.json').obj