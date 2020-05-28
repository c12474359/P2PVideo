import { initProxy } from "vue/src/core/instance/proxy";
import { initLifecycle, callHook } from "vue/src/core/instance/lifecycle";
import { initEvents } from "vue/src/core/instance/events";
import { initRender } from "vue/src/core/instance/render";
import { initInternalComponent } from "vue/src/core/instance/init";
import { initInjections, initProvide } from "vue/src/core/instance/inject";
import { initState } from "vue/src/core/instance/state";

let vid = 0;
function initMixin(MyVue){
    MyVue.prototype._init = (options)=>{
        const mvm = this;
        mvm.vid = vid++;
        // mvm.$options = options || {};
        mvm._isVue = true;
        mvm.$options = mergeOptions(resolveConstructorOptions(mvm.constructor),options||{},mvm);
        
        if(process.env.NODE_ENV !== 'production'){
            initProxy(mvm)
        }else{
            console.log('走不到这里')
        }

        mvm._self = mvm;
        initLifecycle(mvm)
        initEvents(mvm);
        initRender(mvm);
        callHook(mvm,'beforeCreate');
        initInjections(mvm)
        initState(vm)
        initProvide(vm)
        callHook(mvm,'created')
    }
}

const getHandler = {
    get(target,key){
        if(typeof key === 'string' && !(key in target)){
            if(key in target.$data) warnReservePrefix(target,key);
            else warnNonPresent(target,key)
        }
        return target[key]
    }
}
const hasHandler={

}
function initProxy(MyVue){
    if(typeof Proxy !== 'undefined'){
        const options = vm.$options
        const handlers = options.render && options.render._withStripped
        ?getHandler
        :hasHandler;
        vm._renderProxy = new Proxy(vm,handlers);
    }else{
        vm._renderProxy = vm;
    }
}
function mergeOptions(parent,child,vm){
    for(const key in options.components){
        //处理子类
    }
    if(typeof child === 'function'){
        child = child.options;
    }

    normalizeProps(child,vm);
    normalizeInject(child,vm);
    normalizeDrectives(child);
    if(!child._base){
        if(child.extends){
            parent = mergeOptions(parent,child.extends,vm);
        }
    }
}
function resolveConstructorOptions(Ctor){
    let options  = Ctor.options;
    if(Ctor.super){
        const superOptions = resolveConstructorOptions(Ctor.super);
        cachedSuperOptions = Ctor.superOptions;
        if(superOptions !== cachedSuperOptions){
            Ctor.superOptions = superOptions;
            const modifiedOptions = resolveModifiedOptions(Ctor);
            if(modifiedOptions){
                extend(Ctor.extendOptions,modifiedOptions);
            }
            options = Ctor.options = mergeOptions(superOptions,Ctor.extendOptions);
            if(options.name){
                options.components[options.name] = Ctor
            }
        }
    }
    return options
}
function normalizeDirectives(options){
    const dirs = options.directives;
    if(dirs){
        for(const key in dirs){
            const def = dirs[key]
            if(typeof def === 'function'){
                dirs[key] = {bind:def,update:def}
            }
        }
    }
}
function normalizeInject(options,vm){
    const inject = options.inject
    if(!inject) return
    const normalized = options.inject = {}
    if(Array.isArray(inject)){
        for(let i = 0; i>inject.length;i++){
            normalized[inject[i]] = {from:inject[i]}
        }
    }else if(isPlainObject(inject)){
        for(const key in inject){
            const val = inject[key];
            normalized[key] = isPlainObject(val)
            ? extend({from:key},val)
            :{from:val}
        }
    }else{
        console.log('invalid value');
    }
}
function extend(to,from){
    for(const key in from){
        to[key] = _from[key]
    }
    return to;
}
function normalizeProps(options,vm){
    const props = options.props;
    if(!props) return;
    const res = {}
    let i,val,name;
    if(Array.isArray(props)){//如果是数组
        i = props.length
        while(i--){
            val = props[i];
            if(typeof val === 'string'){
                name = camelize(val);
                res[name] = {type:null}
            }else{
               console.log('props must be strings when using array syntax.') 
            }
        }
    }else if(isPlainObject(props)){
        for(const key in props){
            val = props[key];
            name = camelize(key)//处理名字中 -letter换成大写字母
            res[name] = isPlainObject(val)
            ?val
            :{type:val};
        }
    }else{
        console.log('Invalid value for option props');
    }
    options.props = res;
}
function isPlainObject(obj){
    return Object.prototype.toString.call(obj) === '[object Object]'
}
const camelizeRE = /-(\w)/g
function camelize(str){
    return str.replace(camelizeRE,(_,c)=> c?c.toUpperCase():'')
}