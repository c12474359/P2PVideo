import { observe, toggleObserving, defineReactive, del } from "vue/src/core/observer";
import { proxy, getData, defineComputed } from "vue/src/core/instance/state";
import { isServerRendering } from "vue/src/core/util";
import Watcher from "vue/src/core/observer/watcher";
import Dep from "vue/src/core/observer/dep";

function initState(mvm){
    mvm._watcher = []
    const opts = mvm.$options;
    if(opts.props) initProps(mvm,opts.props)
    if(opts.methods) initMethods(mvm,opts.methods)
    if(opts.data){
        initData(mvm);
    }
    else{
        observe(mvm._data = {},true)
    }
    if(opts.computed) initComputed(mvm,opts)
    if(opts.watch && opts.watch !== nativeWatch){
        initWatch(mvm,opts.watch);
    }
}
function stateMixin(MyVue){
    const dataDef = {}
    dataDef.get =  function () { return this._data }
    const propsDef ={}
    propsDef.get = function () { return this._props }

    Object.defineProperty(MyVue.prototype,'$data',dataDef);
    Object.defineProperty(MyVue.prototype, '$props',propsDef);

    MyVue.prototype.$set = set
    MyVue.prototype.$delete = del
    MyVue.prototype.$watch = function(
        expOrFn,
        cb,
        options
    )
    {
        const mvm = this;
        if(isPlainObject(cb)){
            return createWatcher(mvm,expOrFn,cb,options)
        }
        options = options || {}
        options.user = true;
        const watcher = new Watcher(mvm,expOrFn,cb,options);
        if(options.immediate){
            try{
                cb.call(mvm,watcher.value)
            }catch(error){
                //
            }
        }
        return function unwatchFn(){
            watcher.teardown()
        }
    }

}
function initProps(mvm,propsOptions){
    const propsData = mvm.$options.propsData || {}
    const props = vm._props = {}
    const keys =  vm.$options._propKeys = []
    const isRoot = !mvm.$parent
    if(!isRoot){
        toggleObserving(false)
    }
    for(const key in propsOptions){
        keys.push(key)
        const value =  validateProp(key,propsOptions,propsData,mvm)
        if(false){
        defineReactive(props,key,value,()=>{

        })
        }
        else{
            defineReactive(props,key,value);
        }
        if(!(key in mvm)){
            proxy(mvm,`_props`,key)
        }
    }
    toggleObserving(true)
}
function initData(mvm){
    let data = mvm.$options.data;
    data = vm._data = typeof data === 'function'
    ?getData(data,mvm)
    :data||{}
    if(!isPlainObject(data)){
        data ={}
    }
    const keys = Object.keys(data)
    const props = mvm.$options.props
    const methods = mvm.$options.methods;
    let i=keys.length
    while(i--){
        const key = keys[i]
        if(props && hasOwn(props,key)){//props同名

        }else if(!isReserved){
            proxy(mvm,`_data`,key)
        }
    }
    observe(data,true)
}
function initMethod(mvm,methods){
    const props =  mvm.$options.props;
    for(const key in methods){
        if(typeof methods[key] !== 'function'){

        }
        if(props && hasOwn(props,key)){

        }
        if((key in mvm) && isReserved(key)){

        }
        mvm[key] = typeof methods[key] !== 'function' ? noop :bind(methods[key],mvm)

    }
}

function initWatch(mvm,watch){
    for(const key in watch){
        const handler = watch[key]
        if(Array.isArray(handler)){
            for(let i = 0; i<handler.length;i++){
                createWatcher(mvm,key,handler[i]);
            }
        }else{
            createWatcher(mvm,key,handler)
        }
    }
}
function initComputed(mvm,computed){
    const watchers = mvm._computedWatchers = Object.create(null);
    const isSSR =isServerRendering();
    for(const key in computed){
        const userDef =  computed[key];
        const getter =  typeof userDef === 'function' ? userDef : userDef.get;
        if(!isSSR){
            watchers[key] = new Watcher(
                mvm,
                getter || noop,
                noop,
                computedWatcherOptions
            )
        }
        if(!(key in mvm)){
            defineComputed(mvm,key,userDef);
        }else{
            //错误
        }
    }
}
function defineComputed(
    target,
    key,
    fn
){
    const shouldCache = !isServerRendering()
    if(typeof fn === 'function'){
        sharedPropertyDefinition.get = shouldCache
        ? createComputedGetter(key)
        : createGetterInvoker(fn)
        sharedPropertyDefinition.set = noop;
    }else{
        sharedPropertyDefinition.get = fn.get
        ? shouldCache && fn.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(fn.get)
        :noop
        sharedPropertyDefinition.set  = fn.set || noop
    }
    Object.defineProperty(target,key,sharedPropertyDefinition)
}

function createComputedGetter(key){
    return function computedGetter(){
        const watcher = this._computedWatchers && this._computedWatchers[key]
        if(watcher){
            if(watcher.dirty){
                watcher.evaluate()
            }
            if(Dep.target){
                watcher.depend()
            }
            return watcher.value
        }
    }
}

function createGetterInvoker(fn){
    return function computedGetter(){
        return fn.call(this,this);
    }
}
function createWatcher(
    mvm,
    expOrFn,
    handler,
    options
){
    if(isPlainObject(handler)){
        options = handler;
        handler = handler.handler
    }
    if(typeof handler === 'string'){
        handler = vm[handler]
    }
    return mvm.$watch(expOrFn,handler,options);
}
function initWatch(mvm,watch){
    for(const key in watch){
        const handler = watch[key]
        if(Array.isArray(handler)){

        }
    }
}