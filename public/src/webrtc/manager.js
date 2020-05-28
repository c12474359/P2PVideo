/* @flow */
import env from '../utils/env';
import Room from './room';
import Session from '../webrtc/session'
import dep from '../utils/dep'

export default class Manager{
    id:String
    dep:dep
    session:?Session
    room:?Room
    options:Object
    onOpen:Function

    constructor(options?:?Object){
        this.id = env.getInstance().getRandomId()
        this.defaultOptions = {
            sessionId:null
        }
        this.options = Object.assign({},this.defaultOptions,options||{})
        this.dep = dep.getInstance()
        this.session = null
        this.room = null
        this.onOpen = ()=>{this.enterRoom()}
        this.init()
    }
    init(){
        const options = Object.assign({},this.options,{id:this.id,parent:this})
        this.dep.on('onopen',this.onOpen)
        this.session = new Session(options)
    }
    enterRoom(){
        this.room = new Room({...this.options,id:this.id})
    }
    closeRoom(params){
        this.session.destroy()
        this.session = null
        this.room.destroy()
        this.room = null
        this.dep.off('onopen',this.onOpen)
        this.onOpen = null
        this.dep = null
        this.options = null
    }
}