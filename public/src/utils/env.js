export const RTC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
export const SDP = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
/**
 * 支持程度：
 */
const UserMedia  = navigator.getUserMedia?navigator.getUserMedia:
                   navigator.mozGetUserMedia?navigator.mozGetUserMedia:
                   navigator.webkitGetUserMedia?navigator.webkitGetUserMedia:null;
const MediaDevices = navigator.mediaDevices?navigator.mediaDevices:
                    navigator.mozMediaDevices?navigator.mozMediaDevices:
                    navigator.webkitMediaDevices?navigator.webkitMediaDevices:null;

Date.prototype.Format = function(fmt){
    const o = {
        'Y+':this.getFullYear(),
        'M+':this.getMonth()+1,
        'D+':this.getDate(),
        'h+':this.getHours(),
        'm+':this.getMinutes(),
        's+':this.getSeconds(),
        'S+':this.getMilliseconds()
    }
    for(let v in o){
        const reg = new RegExp(`(${v})`);
        if(reg.test(fmt)){
            fmt = fmt.replace(RegExp.$1,RegExp.$1.length===1 ? o[v] : ('000' + o[v]).slice(-RegExp.$1.length));
        }
    }
    return fmt;
}
String.prototype.startsWith = typeof String.prototype.startsWith === 'function' ? String.prototype.startsWith
                                :function(prefix){ return this.slice(0,prefix.length) === prefix;}
String.prototype.endsWith = typeof String.prototype.endsWith === 'function' ? String.prototype.endsWith
                                :function(endfix){ return this.slice(-endfix.length) === endfix;}
export default class ProcessEnv{
    constructor(){
        if(ProcessEnv.instance){
            throw new Error('Instance has exit,please use getInstance!');
        }
        this.options={
            RTC,
            SDP,
            UserMedia,
            MediaDevices
        }
    }
    static getInstance(){
        if(!ProcessEnv.instance){
            ProcessEnv.instance = new ProcessEnv()
        }
        return ProcessEnv.instance;
    }
    get isSupport(){
        return !!RTC && !!SDP && (!!UserMedia||!!MediaDevices);
    }
    getAPI(name){
        return this.options[name];
    }
    getPlatForm(){
        if(!window) return '未知设备';
        const {navigator} = window;
        const {platform,userAgent} = navigator;
        const pf = platform.toLowerCase();
        const ua = userAgent.toLowerCase();
        const isWin = pf === 'win32' || pf === 'windows';
        const isMac = pf.startsWith('mac');
        if(isMac) return 'mac';
        if(pf.includes('iphone') || ua.includes('iphone')) return 'iphone';
        if(pf.includes('android') || ua.includes('android')) return 'android'
        if(pf === 'x11' && !isWin && !isMac) return 'unix';
        if(pf.includes('linux')) return 'linux';
        if(isWin){
            if(ua.includes('windows nt 5.0') || ua.includes('windows 2000')) return 'win2000';
            if(ua.includes('windows nt 5.1') || ua.includes('windows xp')) return 'winxp';
            if(ua.includes('windows nt 5.2') || ua.includes('windows 2003')) return 'win2003';
            if(ua.includes('windows nt 6.0') || ua.includes('windows vista')) return 'winvista';
            if(ua.includes('windows nt 6.1') || ua.includes('windows 7')) return 'win7';
            return 'win'
        }
        return 'other'
    }
    setParam(key,value){
        this.options[key] = value;
    }
    getParam(key){
        if(this.options.hasOwnProperty(key)){
            return this.options[key];
        }
        return null;
    }
    getVersion(ua,exp,pos){
        const match = ua.match(exp);
        return match && match.length >= pos && parseInt(match[pos],10);
    }
    detectBroswer(window){
        const {navigator} = window;
        const result =  {browser:null,version:null};

        if(typeof window === 'undefined' || !navigator){
            result.browser = 'Not a broswer.'
            return result;
        }
        if(navigator.mozGetUserMedia){//FireFox
            result.browser = 'firefox';
            result.version = this.getVersion(navigator.userAgent,/Firefox\/(\d+)\./,1);
        }else if(navigator.webkitGetUserMedia 
            || (window.isSecureContext === false && window.webkitRTCPeerConnection && !window.RTCIceGather)){
            //Chrome,chromium,webview,Opera.
            result.browser = 'chrome';
            result.version =  this.getVersion(navigator.userAgent,
                /Chrom[e|ium]\/(\d+)\./,1);
        }else if(navigator.MediaDevices
            && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/))
        {//Edge
            result.browser = 'edge';
            result.version =  this.getVersion(navigator.userAgent,/Edge\/(\d+).(\d+)$/,2);
        }else if(window.RTCPeerConnection 
                && navigator.userAgent.match(/AppleWebKit\/(\d+)\./)
        ){//Safari
            result.browser = 'safari';
            result.version = this.getVersion(navigator.userAgent,/AppleWebKit\/(\d+)\./,1);

         }else{
            result.browser = 'Not a supported broswer.';
        }
        return result;
    }
    getRandomId(){
        const time = new Date().getTime();
        return `uid-${time}-${(Math.random()*1000000).toFixed(0)}-${(Math.random()*1000000).toFixed(0)}`
    }
}