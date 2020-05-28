import Log from './logproxy'
import Dep from './dep'

export class Loader{
    constructor(options){
        this.defaultOptions={
            baseUrl:'',
            path:'',
            method:'GET',
            data:null,
            type:'text',
            totalTime:0,
            speed:0,
            readyState:0,
            responseCode:-1,
            response:'',
            error:-1,
            range:0
        }
        this.options = Object.assign(this.defaultOptions,options||{});
        this.name = this.__proto__.constructor.name;
        this.log =  Log.getInstance();
        this.dep =  Dep.getInstance();
        this.http = null;
    }
    load(options){
        this.options = Object.assign(this.options,options||{});
        this.log.trace(`${this.name}::load->`)
        if(!this.http){
            this.http = this.createRequest();
        }
        const this$1 = this,startTime = Date.now();
        this.http.onreadystatechange = function(){
            this$1.options.readyState = this.readyState;
            if(this.readyState === 4){
                this$1.options.responseCode = this.status;
                this$1.options.response = this.response || '';
                this$1.options.totalTime = Date.now() - startTime;
                if(this.status >= 200 && this.status < 300){
                    this$1.options.error = 200;
                }
                this$1.dep.emit('complete',this$1);
            }
        }
        let urls = [];
        if(!!this.options.baseUrl){
            urls.push(this.options.baseUrl);
        }
        if(!!this.options.path){
            urls.push(this.options.path);
        }
        this.http.open(this.options.method,urls.join(''));
        if(!!this.options.range){
            this.http.setRequestHeader('range',this.options.range);
        }
        this.http.responseType = this.options.type;
        this.http.send(this.options.data);
    }
    createRequest(){
        let objXMLHttpRequest;
        if(window.XMLHttpRequest){
            objXMLHttpRequest = new XMLHttpRequest();
            if(objXMLHttpRequest.overrideMimeType){
                objXMLHttpRequest.overrideMimeType = this.options.type;
            }
        } else if(window.ActiveXObject){//IE
            const activeXNameList = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "Msxml2.XMLHTTP.3.0", "Msxml2.XMLHTTP",
            "Microsoft.XMLHTTP"];
            let i = activeXNameList.length;
            while(i--){
                try{
                    objXMLHttpRequest = new ActiveXObject(activeXNameList[i]);
                }catch(e){
                    continue;
                }
                if(objXMLHttpRequest){
                    break;
                }
            }
        }
        return objXMLHttpRequest;
    }
}