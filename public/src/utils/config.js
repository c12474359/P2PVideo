/*
    初始化配置参数
    create by chenzhaofei on 2020/04/30
*/
export default class Config{
    constructor(){
        this.defaultOptions = {
            stun:['stun1.l.google.com:19302','stun2.l.google.com:19302','stun3.l.google.com:19302','stun4.l.google.com:19302'],
            websocket:'ws://49.232.108.228:5001'
        };
        this.options = Object.assign({},this.defaultOptions);
        this.map = new WeakMap();
    }
    static getInstance(){
        if(!Config.instance){
            Config.instance = new Config();
        }
        return Config.instance;
    }
    getVideoArea(){
        if(!window){
            return null;
        }
        if(window.document.getElementById('userVideo')){
            return window.document.getElementById('userVideo');
        }
        if(window.document.getElementById('app')){
            return window.document.getElementById('app');
        }
        return null;
    }
    initParams(options){
        this.options = Object.assign(this.options,options||{});
    }
    getParam(key){
        if(this.options.hasOwnProperty(key)){
            return this.options[key];
        }
        return null;
    }
    setParam(key,value){
        this.options[key] = value;
    }
}