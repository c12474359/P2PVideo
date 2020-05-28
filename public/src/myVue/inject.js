import { toggleObserving, defineReactive } from "vue/src/core/observer";
function initProvide(mvm){
    const provide = mvm.$options.provide
    if(provide){
        mvm._provided = typeof provide === 'function'
        ? provide.call(mvm)
        : provide
    }
}
function initInjections(mvm){
    const result = resolveInject(mvm.$options.inject,mvm);
    if(result){
        toggleObserving(false)
        Object.keys(result).forEach(key=>{
            defineReactive(mvm,key,result[key])
        })
        toggleObserving(true)
    }
}
function resolveInject(inject,mvm){
    if(inject){
        const result  =  Object.create(null)
        const keys = hasSymbol
        ? Reflect.ownKeys(inject)
        : Object.keys(inject)

        for(let i=0;i<keys.length;i++){
            const key = keys[i]
            if(key === '__ob__') continue;
            const providKey = inject[key].from
            let source =mvm
            while(source){
                if(source._provided && hasOwn(source._provided,providKey)){
                    result[key] = source._provided[providKey]
                    break
                }
                source = source.$parent
            }
            if(!source){
                if('default' in inject[key]){
                    const provideDefault = inject[key].default;
                    result[key] = typeof provideDefault === 'function'
                    ?provideDefault.call(vm)
                    :provideDefault
                }else if(process.env.NODE_ENV !== 'production'){
                    
                }
            }
        }
        return result
    }
}