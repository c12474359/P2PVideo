/* @flow */
import config from '../utils/config';
import Env from '../utils/env.js';
import Log from '../utils/logproxy';
import UserMedia from './usermedia';

export default class LocalStream{
    config:config
    env:Env
    log:Log
    name:String
    options:Object
    userMedia:UserMedia

    constructor(options:Object){
        this.config = config.getInstance();
        this.env = Env.getInstance();
        this.log = Log.getInstance();
        this.name = this.__proto__.constructor.name;
        this.defaultOptions={
            type:'local',
            id:null,
            window:null
        };
        this.options = Object.assign({},this.defaultOptions,options||{});
        //创建视频
        this.init();
    }
    init(){
        if(!!this.env.isSupport === void 0){
            this.log.warn('该浏览器对于视频直播支持上存在问题，请检查！');
            return;
        }
        const broswerInfo = this.env.detectBroswer(window);
        this.log.info('浏览器信息：',broswerInfo);
        //创建本地流读取对象
        this.userMedia = new UserMedia(window);
    }
    /**
     * 
     * @param {*} options 
     */
    async getUserMedia(){
        this.options.streamType = 'desktop';
        const devices = this.userMedia.UserMedia && this.userMedia.UserMedia.enumerateDevices()
        //设定麦克风
        console.log(devices)
        const userStream = await this.userMedia.getUserMedia(this.constraints);
        return userStream
    }
    async getDesktop(){
        const screenStream = this.userMedia.getDisplayMedia(this.constraints)
        return screenStream
    }
    get constraints():Object{
        const csts = {
            video:
            {
                width:1024,
                heigth:728,
                frameRate:{ideal:60,min:10}
            },
            audio:true
        }
        return csts;
    }
    addEvent(){
        this.peer.onnegotiationneeded = ()=>{
            this.onRTCOpen()
        }
        this.peer.ondatachannel = (evt)=>{
            this.onChannel(evt)
        }
        this.peer.onicecandidate = (evt)=>{
            this.onIceCandidate(evt)
        }
    }
    removeEvent(){
        this.peer.onnegotiationneeded = null
        this.peer.ondatachannel = null
        this.peer.onicecandidate = null
    }
    destroy(){
        this.config = null
        this.env = null
        this.log = null
        this.name = null
        this.removeEvent()
        this.peer = null
        this.userMedia = null
        this.defaultOptions=null
        this.options = null
    }
}