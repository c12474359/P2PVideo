import Dep, { pushTarget, popTarget } from "vue/src/core/observer/dep";
import { setActiveInstance } from "vue/src/core/instance/lifecycle";

function initLifecycle(mvm){
    const options = mvm.$options;
    let parent = options.parent
    if(parent && !options.abstract){
        while(parent.$options.abstract && parent.$parent){
            parent = parent.$parent;
        }
        parent.$children.push(mvm)
    }
    mvm.$parent = parent;
    mvm.$root = parant ? parant.$root : mvm;
    mvm.$children = [];
    mvm.refs = {}
    mvm._watcher = null;
    mvm._inactive = null;
    mvm._directInactive = false;
    mvm._isMounted = false;
    mvm._isDestroyed = false;
    mvm._isBeingDestroyed = false;
}
function lifecycleMixin(MyVue){
    MyVue.prototype._update = function (vnode,hydrating){
        const mvm = this;
        const prevEl = mvm.$el
        const preVnode = mvm._vnode;
        const restoreActiveInstance = setActiveInstance(mvm)
        vm._vnode = vnode;
        if(!preVnode){
            mvm.$el = mvm.__patch__(mvm.$el,vnode,hydrating,false);
        }else{
            mvm.$el =  mvm.__patch__(preVnode,vnode);
        }
        restoreActiveInstance()
        if(prevEl){
            prevEl.__vue__ = null;
        }
        if(mvm.$el){
            vm.$el.__vue__ = vm;
        }
    }
}
function callHook(mvm,hook){
    pushTarget()
    const handlers =  mvm.$options[hook];
    const info = `${hook} hook`
    if(handlers){
        for(let i=0,j=handlers.length;i<j;i++){
            invokeWithErrorHandling(handlers[i],mvm,null,mvm,info);
        }
    }
    if(mvm._hasHookEvent){
        mvm.$emit('hook:'+hook)
    }
    popTarget()
}
