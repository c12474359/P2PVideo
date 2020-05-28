import { updateComponentListeners } from "vue/src/core/instance/events";
import { invokeWithErrorHandling, handleError } from "vue/src/core/util";

let target;

function initEvents(mvm){
    mvm._events = Object.create(null);
    mvm._hasHookEvent = false;
    const listeners = mvm.$options._parentListeners;
    if(listeners){
        updateComponentListeners(mvm,listeners)
    }
}
function uodateComponentListeners(mvm,listeners,oldlisteners){
    target = mvm;
    updateListeners(listeners,oldlisteners||{},add,remove,createOnechandler,mvm);
    target = undefiend;
}
function updateListeners(
    on,
    oldon,
    add,
    remove,
    createOnechandler,
    mvm
){
    let name,def,cur,old,event
    for(name in on){
        def = cur = on[name]
        old = oldon[name]
        event = normalizeEvent(name)
        if(__WEEX__ && isPlainObject(def)){

        }
        if(isUndef(cur)){
            
        }
        else if(isUndef(old)){
            if(isUndef(cur.fns)){
                cur = on[name] = createFnInvoker(cur,mvm);
            }
            if(isTrue(event.once)){
                cur = on[name] = createOnechandler(event.name,cur,event.capture);
            }
            add(event.name,cur,event.capture,event.passive,event.params);

        }else if(cur !== old){
            old.fns = cur
            on[name] = old
        }
    }
    for(name in oldon){
        
    }
}
function eventsMixin(MyVue){
    const hookRE = /^hook:/
    MyVue.prototype.$on = function(event,fn){
        const mvm = this;
        if(Array.isArray(event)){
            for(let i=0,l=event.length;i<l;i++){
                mvm.$on(event[i],fn);
            }
        }else{
            (mvm._events[event] || (mvm._events[event] = [])).push(fn);
            if(hookRE.test(event)){
                mvm._hasHookEvent = true;
            }
        }
        return mvm;
    }
    MyVue.prototype.$once = function(event,fn){
        const mvm = this;
        function on(){
            mvm.$off(on);
            fn.apply(mvm,arguments);
        }
        on.fn = fn;
        mvm.$on(event,on);
        return mvm;
    }
    NyVue.prototype.$off = function(event,fn){
        const mvm = this;
        if(!arguments.length){//关掉所有事件
            mvm._events = Object.create(null);
            return mvm;
        }
        if(Array.isArray(event)){
            for(let i=0,l=event.length;i<l;i++){
                mvm.$off(event[i],fn)
            }
            return mvm;
        }
        const cbs = mvm._events[event];
        if(!cbs){
            return mvm;
        }
        if(!fn){
            mvm._events[event] = null;
            return mvm;
        }
        let cb
        let i=cbs.length
        while(i--){
            cb=cbs[i]
            if(cb === fn || cb.fn === fn){
                cbs.splice(i,1);
                break;
            }
        }
        return mvm;
    }
    MyVue.prototype.$emit=function(event){
        const mvm= this;
        let cbs = mvm._events[event];
        if(cbs){
            cbs = cbs.length>1?toArray(cbs):cbs;
            const args = toArray(arguments,1);
            const info = `event handler for "${event}"`
            for(let i=0,l=cbs.length;i<l;i++){
                invokeWithErrorHandling(cbs[i],mvm,args,mvm,info)
            }
        }
        return mvm;
    }
    function invokeWithErrorHandling(
        handler,
        context,
        args,
        mvm,
        info
    ){
        let res;
        try{
            res = args ? handler.apply(context,args) : handler.call(context);
            if(res && !res._isVue && isPromise(res) && !res._handled){
                res.catch(e=>handleError(e,mvm,info + `(Promise/async)`))
                res._handled = true
            }
        }catch(e){
            handleError(e,mvm,info);
        }
        return res;
    }
}