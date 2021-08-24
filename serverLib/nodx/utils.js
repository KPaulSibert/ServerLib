
import { promisify as pr } from "util";
export const promisify = (cls,...names)=>{
    if(cls.__promised)return
    names.forEach(e=>{cls.prototype['cb_'+e]=cls.prototype[e];cls.prototype[e]=pr(cls.prototype[e])})
    cls.__promised = true;
}