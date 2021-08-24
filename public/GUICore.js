//#region style
var cssEl = document.createElement('style')
var parsedStyle = {}
/**@type {Object.<string,CSSStyleDeclaration>|(stl:Object.<string,CSSStyleDeclaration>)=>none} */
var style = (stl)=>{}
function parse(obj){
    const el = document.createElement('div')
    for(const attr in obj){
        el.style[attr] = obj[attr]
    }
    return el.style.cssText
}
function updateStyle(){
    var code = ''
    for(const name in parsedStyle){
        code+=`${name}{${parsedStyle[name]}}\n`
    }
    cssEl.textContent = code;
}
style.update=updateStyle
export const css = new Proxy(style,{
    set(t,p,v){
        t[p]= new Proxy(v,{
            set(dec,p2,v2){
                dec[p2] = v2
                parsedStyle[p] = parse(dec)
                t.update()
                return true
            }
        })
        parsedStyle[p] = parse(v)
        return true
    },
    apply(fn,_,[style]){
        for(const name in style){
            this.set(fn,name,style[name])
            style[name] = fn[name]
        }
        return style
    }
})
document.head.append(cssEl)
//#endregion
//#region HTMLElement
class ReactProp{
    subs=[]
    constructor(val){this.val = val;}
    set(val=this.val){
        const oldVal = this.val
        this.val = val
        const subs = [...this.subs]
        for(const i in subs){
            const [el,fn] = subs[i]
            if(el.isConnected==false){console.log('remove',el);this.subs.splice(i,1)}
            else{fn(val,oldVal,el)}
        }
    }
}
class ReactFunc extends ReactProp{
    constructor(fn,...args){
        this.setArgs(...args)
        this.fn = fn
    }
    set(){
        super.set(this.fn(this.args.map(a=>a.val)))
    }
    setArgs(...args){this.args = args;args.map(a=>a.subs.push([this,this.set.bind(this)]))}
    subs=[]
}
export function ref(val){return new ReactProp(val)}
export function refn(fn,...args){
    return new ReactFunc(fn,...args)
}
export function toEl(src,p){
    if(src instanceof HTMLElement)return src
    p.addChilds=false;
    if(typeof src=="function"){
        const args = p.args.map(a=>a instanceof ReactProp?a.val:a)
        const el = toEl(src.apply(p.cfg.this||p,args),p)
        const updFn = (v,o,cel)=>cel.upd(e(src,p.cfg,...p.args),updFn)
        for(const arg of p.args){
            if(arg instanceof ReactProp){
                el.watch(arg,updFn)}}
        return el
    }
    for(const type of iterTypes(src)){
        if(toEl.types.has(type)){return toEl.types.get(type)(src,p)}
    }
    return document.createTextNode(String(src))
}
Object.assign(window.Node.prototype,{
    watch(rp,fn){
        rp.subs.push([this,fn])
        if(!this._wtach_){this._wtach_=[]}
        this._wtach_.push(rp)
    },
    upd(newEl,fn){
        this.replaceWith(newEl)
        if(this._wtach_){
            for(const rp of this._wtach_){
                for(const item of rp.subs){if(item[0]==this&&item[1]!=fn){item[0]=newEl}}
            }
            newEl._wtach_ = this._wtach_
        }
        return newEl
    }
})
function* iterTypes(obj){
    if(obj==null){return [obj]}
    while(obj!=null){
        yield obj.constructor;
        obj = obj.__proto__
    }
}
toEl.types = new Map()
toEl.types.set(ReactProp,(rp,p)=>{
    const el = toEl(rp.val,p)
    el.watch(rp,(val,_,el)=>{el.upd(toEl(val,p))})
    return el;
})
toEl.types.set(Promise,(promise,p)=>{
    const tmp = e('loading',e('div','wait'))
    promise.then(e=>tmp.upd(toEl(e,p)))
    return tmp
})
export const elConfig = {}
export function react(data){
    for(const name in data){data[name] = new ReactProp(data[name])}
    return data
}
/**@param {HTMLElement} cfg
 * @returns {HTMLElement}
*/
export function e(src,cfg,...args){
	const props = {cfg:cfg==null?{}:cfg,args,addChilds:true}
    /**@type {HTMLElement} */
	const el = src=='body'?document.body:(typeof src == "string"?document.createElement(src):src instanceof HTMLElement?src:toEl(src,props))
    props.el = el;props.src=src;
    for(const name in cfg){
		switch(name){
			case "class":
				const cls = cfg.class
				if(Array.isArray(cls)){
					for(const name of cls){el.classList.add(name)}
				}else if(typeof cls=='object'){
                    for(const name in cls){
                        if (cls[name] instanceof ReactProp){
                            el.classList.toggle(name,cls[name].val)
                            el.watch(cls[name],v=>el.classList.toggle(name,v))
                        }else{cls[name]&&el.classList.add(name)}
                    }
                }else{el.classList.add(cls)}
				break;
			case "style":
				const style = cfg.style;
				for(const attr in style){
                    if (style[attr] instanceof ReactProp){
                        el.style[attr] = style[attr].val
                        el.watch(style[attr],v=>{el.style[attr]=v})
                    }else{el.style[attr] = style[attr]}}
				break;
			case "props":
				const props = cfg.props;
				for(const prop in props){
                    if (props[prop] instanceof ReactProp){
                        Object.defineProperty(el,prop,{
                            get(){return props[prop]},
                            set:props[prop].set.bind(props[prop])
                        })
                    }else{el[prop] = props[prop]}
				}break;
            case "attrs":
                const attrs = cfg.attrs;
                for(const attr in attrs){
                    if (attrs[attr] instanceof ReactProp){
                        el.setAttribute(attr,attrs[attr].val)
                        el.watch(attrs[attr],v=>el.setAttribute(attr,v))
                    }else{el.setAttribute(attr,attrs[attr])}
                }
            break;
			case "events":
				const evts = cfg.events;
				for(const ev in evts){
					el.addEventListener(ev,evts[ev])
				}break;
			case "this":continue;
            default:
                if(name=='value'&&cfg[name] instanceof ReactProp){
                    const rp = cfg[name]
                    el.addEventListener('keyup',function(){rp.set(this.value)})
                    el.addEventListener('change',function(){rp.set(this.value)})
                }
                const handler = elConfig[name]
                if(handler){handler.apply(cfg,[cfg[name]])}
                else{
                    if(el[name]!=undefined){ // set as el property
                       
                        if (cfg[name] instanceof ReactProp){
                            el[name] = cfg[name].val
                            el.watch(cfg[name],v=>el[name]=v)
                        }else{ el[name] = cfg[name]}
                    }else{ // set as el attribute
                        if (cfg[name] instanceof ReactProp){
                            el.setAttribute(name,cfg[name].val)
                            el.watch(cfg[name],v=>el.setAttribute(name,v))
                        }else{el.setAttribute(name,cfg[name])}
                    }
                }
				break;
		}
	}
	if(props.addChilds){
        if(args.length==1&& Array.isArray(args[0])){args = args[0]}
        for(const child of args){
            el.append(typeof child=="string"||child instanceof HTMLElement?child:toEl(child,props))
        }
    }
	return el
}
//#endregion
Function.prototype.then = function(postfn){
    const preFn = this
    return function(){
        const ret = preFn.apply(this,arguments)
        return postfn.apply(this,[ret,...arguments])
    }
}