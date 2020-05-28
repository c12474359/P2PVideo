import env from './env'
import config from './config'

export default class LogProxy{
    constructor(options){
        if(LogProxy.instance){
            throw new Error('This is a Singlon,Instance has exit please use getInstance!')
        }
        this.defaultOptions = {
            level:15,
            TRACE:8,
            INFO:4,
            WARN:2,
            ERROR:1
        }
        this.options = Object.assign(this.defaultOptions,options||{});
        this.env = env.getInstance();
        this.cache = [];
    }
    static getInstance(){
        if(!LogProxy.instance){
            LogProxy.instance = new LogProxy();
        }
        return LogProxy.instance;
    }
    trace(...rest){
        if((this.options.level & this.defaultOptions.TRACE) >> 3 === 1){
            if(this.logBar) this.outLog(0,...rest);
            console.log(`[${new Date().Format('YYYY-MM-DD hh:mm:ss.SSS')}]`,...rest)
        }
    }
    info(...rest){
        if((this.options.level & this.defaultOptions.INFO) >> 2 === 1){
            if(this.logBar) this.outLog(1,...rest);
            console.log(`[${new Date().Format('YYYY-MM-DD hh:mm:ss.SSS')}]`,...rest)
        }
    }
    warn(...rest){
        if((this.options.level & this.defaultOptions.WARN) >> 1 === 1){
            if(this.logBar) this.outLog(2,...rest);
            console.log(`[${new Date().Format('YYYY-MM-DD hh:mm:ss.SSS')}]`,...rest)
        }
    }
    error(...rest){
        if((this.options.level & this.defaultOptions.ERROR) === 1){
            if(this.logBar) this.outLog(3,...rest);
            console.log(`[${new Date().Format('YYYY-MM-DD hh:mm:ss.SSS')}]`,...rest)
        }
    }
    outLog(...rest){
        const colors = ['gray','white','orange','red'];
        const str = [];
        const color = colors[rest[0]];
        for(let i=1;i<rest.length;i++){
            str.push(typeof rest[i] === 'object' ? JSON.stringify(rest[i]) : rest[i].toString());
        }
        this.cache.push(`<span style='{color:${color}}'>${str.join('')}</span>`);
        if(this.cache.length>100){
            this.cache.shift();
        }
        this.logBar.innerHTML = this.cache.join('<br/>');
    }
}