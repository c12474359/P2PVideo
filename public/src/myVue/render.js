import { createElement } from "vue/src/core/vdom/create-element"
import { defineReactive, nextTick, handleError } from "vue/src/core/util"
import { isUpdatingChildComponent } from "vue/src/core/instance/lifecycle"
import { installRenderHelpers } from "vue/src/core/instance/render-helpers"
import { normalizeScopedSlots } from "vue/src/core/vdom/helpers/normalize-scoped-slots"
import { currentRenderingInstance } from "vue/src/core/instance/render"
import { createEmptyVNode } from "vue/src/core/vdom/vnode"

function initRender(mvm){
    mvm._vnode = null
    mvm._staticTrees = null
    const options = mvm.$options
    const parentVnode = mvm.$vnode = options._parentVnode
    const renderContext = parentVnode && parentVnode.context
    mvm.$slots =  resolveSlots(options._renderChildren,renderContext);
    mvm.$scopedSlots = emptyObject;

    mvm._c = (a,b,c,d) => createElement(mvm,a,b,c,d,false)

    mvm.$createElement = (a,b,c,d)=> createElement(vm,a,b,c,d,true);
    const parentData = prentVnode && parentVnode.data;

    if(process.env.NODE_ENV !== 'production'){
        defineReactive(mvm,"$attrs",parentData && paramentData.attrs || emptyObject,()=>{
            !isUpdatingChildComponent && warn(`$attris is readonly.`,mvm);
        },true)
        defineReactive(mvm,'$listeners',options._parentListeners || emptyObject,()=>{

        },true)
    }else{
        defineReactive(mvm,"$attrs",parentData && paramentData.attrs || emptyObject,null,true)
        defineReactive(mvm,'$listeners',options._parentListeners || emptyObject,null,true)
    }
}
function renderMixin(MyVue){
    installRenderHelpers(MyVue.prototype);
    Vue.prototype.$nextTick = function (fn){
        return nextTick(fn,this);
    }
    MyVue.prototype._render =  function(){
        const mvm = this;
        const { render,_parentVnode} = mvm.$options;
        if(_parentVnode){
            mvm.$scopedSlots = normalizeScopedSlots(
                _parentVnode.data.$scopedSlots,
                mvm.$slots,
                mvm.$scopedSlots
            )
        }
        vm.$vnode = _parentVnode
        let $vnode
        try {
            currentRenderingInstance = mvm;
            vnode = render.call(mvm._renderProxy,mvm.$createElement);
        } catch (error) {
            handleError(e,mvm,`render`);
        }finally{
            currentRenderingInstance = null
        }
        if(Array.isArray(vnode) && vnode.length === 1){
            vnode = vnode[0]
        }
        if(!(vnode instanceof VNode)){
            vnode = createEmptyVNode()
        }
        vnode.parent =  _parentVnode
        return vnode;
    }
}