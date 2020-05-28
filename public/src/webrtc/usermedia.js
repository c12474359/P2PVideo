import env from '../utils/env';
import log from '../utils/logproxy';

export default class UserMedia{
    constructor(window){
        this.window = window;
        this.env = env.getInstance();
        this.log = log.getInstance();
        this.name = this.__proto__.constructor.name;
        this.log.info(`[${this.name}]::'检查是否支持getUserMedia：${!!this.env.isSupport}`);
        this.UserMedia = this.env.getAPI('MediaDevices') || this.env.getAPI('UserMedia');
        this.stream = null;
    }
    getSupportedConstraints(um){
        return um.getSupportedConstraints();
    }
    async getUserMedia(constraints){
        if(!this.UserMedia){
            this.log.error(`[${this.name}]::getUserMedia API is not exit!`);
            return;
        }
        this.log.info(`[${this.name}::getDisplayMedia mediaType ${this.UserMedia.constructor.name}`)
        if(this.UserMedia.constructor.name.includes('UserMedia')){
            this.UserMedia = {
                getUserMedia:this.UserMedia
            }
        }
        this.stream = await this.UserMedia.getUserMedia(constraints);
        return {
            stream:this.stream,
            type:'camara'
        }
    }
    async getDisplayMedia(constraints){
        if(!this.UserMedia){
            this.log.error(`[${this.name}]::getUserMedia API is not exit!`);
            return;
        }
        this.log.info(`[${this.name}::getDisplayMedia mediaType ${this.UserMedia.constructor.name}`)
        if(this.UserMedia.constructor.name.includes('UserMedia')){
            return;
        }
        this.stream = await this.UserMedia.getDisplayMedia(constraints);
        return {
            stream:this.stream,
            type:'desktop'
        }
    }
    close(){
        if(this.stream){
            this.stream.close();
            this.stream =  null;
        }
        this.log.trace(`${this.name}::close`)
    }
    destroy(){
        this.close();
        this.window = null;
        this.UserMedia = null;
        this.log = null;
        this.defaultOptions = null;
        this.name = null;
    }
}