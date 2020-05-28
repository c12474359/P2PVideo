import { del } from "vue/src/core/observer";
import { initUse } from "vue/src/core/global-api/use";
import { initMixin } from "vue/src/core/global-api/mixin";
import { initExtend } from "vue/src/core/global-api/extend";
import { initAssetRegisters } from "vue/src/core/global-api/assets";

function initGlobalAPI(MyVue){
    const configDef = {}
    configDef.get = ()=>config
    Object.defineProperty(MyVue,'config',configDef);
    MyVue.util={
        warn,
        extend,
        mergeOptions,
        defineReactive  
    }
    MyVue.set = set;
    MyVue.delete = del
    MyVue.nextTick = nextTick

    MyVue.observable = {
        observe(obj)
        return obj
    }
    MyVue.options = Object.create(null)
    ASSET_TYPES.forEach(type=>{
        MyVue.options[type + 's'] = Object.create(null);
    })
   //Object.assign(MyVue.options.components,builtInComponents);
    extend(MyVue.options.components,builtInComponents)
    initUse(MyVue);
    initMixin(MyVue);
    initExtend(MyVue);
    initAssetRegisters(MyVue)
}
function initUse(MyVue){
    MyVue.use = function (plugin){
        const installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
        if(installedPlugins.indexOf(plugin)>-1){
            return this;
        }
        const args = toArray(arguments,1);
        args.unshift(this);
        if(typeof plugin.install === 'function'){
            plugin.install.apply(plugin,args);
        }else if(typeof plugin === 'function'){
            plugin.apply(null,args)
        }
        installedPlugins.push(plugin);
        return this;
    }
}
function initMixin(MyVue){
    MyVue.mixin =  function(mixin){
        this.options = mergeOptions(this.options,mixin);
        return this;
    }
}
function initExtend(MyVue){
    MyVue.cid = 0;
    let cid = 1;
    MyVue.extend = function (extendOptions){
        extendOptions =  extendOptions || {}
        const Super = this;
        const SuperId = Super.cid;
        const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
        if(cachedCtors[SuperId]){
            return cachedCtors[SuperId]
        }
        const name = extendOptions.name || Super.options.name;
        const Sub = function VueComponent(options){
            this._init(options);
        }
        Sub.prototype = Object.create(Super.prototype);
        Sub.prototype.constructor = Sub;
        Sub.cid = cid++
        Sub.options = megerOptions(
            Super.options,
            extendOptions
        )
        Sub['super'] = Super;

        if(Sub.options.props){
            initProps(Sub)
        }
        if(Sub.options.computed){
            initComputed(Sub)
        }
        Sub.extend = Super.extend
        Sub.mixin = Super.mixin;
        Sub.use = Super.use;
        Asset_TYPES.forEach((type)=>{
            Sub[type] = Super[type]
        })
        if(name){
            Sub.options.components[name] = Sub
        }

        Sub.superOptions = Super.options;
        Sub.extendOptions = extendOptions;
        Sub.sealedOptions = extend({},Sub.options);
        cachedCtors[SuperId] = Sub;
    }
}
function initAssetRegisters(MyVue){
    
}