import bcrypt from "bcrypt"
import SQ from "sequelize";
import SERVER,{API,Cookie,redirect} from "./index.js";
const {Model,STRING,INTEGER} = SQ
import {Models} from "./DBLib.js"
export const User = class User extends Model{
    static init(sequelize){
      super.init({
        name:{type:STRING,allowNull:false},
        email:{type:STRING,allowNull:false},
        password:{type:STRING,allowNull:false},
        id:{type:INTEGER,primaryKey:true,autoIncrement:true}
      },{sequelize,timestamps:false,tableName:'users'})
    }
}
export class SEQURITY{
    init(srv){
      const api = srv.reqHandlers.filter(h=>h instanceof API)[0]
      Object.assign(api.methods.public, 
        { 
            login:this.set.bind(this),
            signup:this.create.bind(this),
            getuser:this.get.bind(this)
        })
    }
    name='sequrity'
    /**@type {Model} */
    class=User
    idKey='email'
    passKey='password'
    loginPath='/login'
    fields=['name']
    anonymURLs=[
        /\/[^\/]+\.(js|css|png|jpg|map)/,
        /\/api\/public\/./
    ]
    async create({data}){
      const id = data[this.idKey],pwd = data[this.passKey];
      if(!id||!pwd){return "bad input"}
      data[this.passKey] = bcrypt.hashSync(data[this.passKey],10)
      const fields = [this.idKey,this.passKey,...this.fields]
      const user = await User.create(data,{fields})
      return user
    }
    async get({req}){
      const token = Cookie.get(req).token
      if(!token) return null
      const user = await this.class.findOne({where:{[this.passKey]:token},raw:true})
      return user
    }
    async set({req,res,data}){
      const id = data[this.idKey],pwd = data[this.passKey];
      if(!id||!pwd){return "bad input"}
      const user = await this.class.findOne({where:{[this.idKey]:id},raw:true})
      if(!user){return "wrong username or password"}
      if(bcrypt.compareSync(pwd,user[this.passKey])){
        Cookie.upd(req,res,{token:user[this.passKey]},'/')
        return user
      }else{return "wrong username or password"}
    }
    IsAllowed(url){
      if(url==this.loginPath)return true
      for(const cond of this.anonymURLs){
        if(cond instanceof RegExp){
          if(cond.test(url))return true
        }else{if(cond==url)return true}
      }
    }
    async serve(req,res){
      if(!this.class)return console.log(`${this.name}: no user class`)
      const pwd = Cookie.get(req)['token'];
      const user = pwd&& await this.class.findOne({where:{[this.passKey]:pwd}})
      if(!user&&!this.IsAllowed(req.url)){return redirect(res,this.loginPath)}
      req.user = user;
    }
}
SERVER.reqHandlers.unshift(SEQURITY)
export default SEQURITY
  