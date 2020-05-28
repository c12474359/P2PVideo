/* flow */
import env from '../utils/env'
import config from '../utils/config'
import log from '../utils/logproxy'
import dep from '../utils/dep'
import Peer from './peer';

export default class Session{
    env:env
    dep:dep
    cfg:config
    log:log
    name:String
    guests:?Set
    peers:?Map
    ws:?WebSocket
    isOpen:Boolean
    options:Object
    send:Function
    push:Function

    constructor(options){
        this.defaultOptions = {
        }
        this.env  = env.getInstance();
        this.log = log.getInstance();
        this.dep = dep.getInstance();
        this.cfg = config.getInstance();
        this.name = this.__proto__.constructor.name;
        this.options = Object.assign({},this.defaultOptions,options||{});
        this.guests = null;
        this.peers = new Map();
        this.ws = null;
        this.isOpen = false;
        this.send = data => {this.sendMessage(data)}
        this.push = data => {this.pushStream(data)}
        this.init();
    }
    init(){
        const WebSocket = this.options.window.WebSocket;
        this.ws = new WebSocket(this.cfg.getParam('websocket'))
        this.ws.onopen = () => this.onOpen()
        this.ws.onerror = () => this.onError()
        this.ws.onmessage = (data) => this.onMessage(data)
        this.ws.onclose = () => this.onClose()
        //peer
        //增加事件
        this.dep.on('peerMessage',this.send)
        this.dep.on('pushStream',this.push)
        //获取视频
    }
    onOpen(){
        if(this.isOpen) return;
        this.isOpen = true;
        this.dep.emit('onopen');
        //注册信令
        this.sendMessage({type:'register'});
    }
    sendMessage(msg:Object){
        const type = msg.type;
        const data = Object.assign({id:this.options.id,roomid:this.options.roomId},msg.data||{});
        msg.data = data;
        this.ws.send(JSON.stringify(msg));
    }
    onMessage(res:MessageEvent){
        const data =  res.data;
        this.dep.emit('onmessage',data);
        const msg = JSON.parse(data);
        if(msg.data.error !== 0){
            this.log.error(`${this.name}::onMessage-> ${msg.type}:${msg.data.message}`);
            return;
        }
        let old;
        switch(msg.type){
            case 'register':
                this.log.trace(`${this.name}::onMessage-> register ${msg.data.message}`);
                //发送信令查询用户
                this.sendMessage({type:'getGuestList'});
                break;
            case 'onGuestList':
                //根据列表创建peer
                old = this.guests || [];
                const ngl = msg.data.list || [];
                this.guests = new Set([...old,...ngl]);
                this.log.trace(`${this.name}::onMessage-> onGuestList ${this.guests.size}`);
                ///去创建peer
                this.guests.forEach(id=>{
                    if(!this.peers.has(id)&&id !== this.options.id){
                        this.createPeer(id)
                    }
                })
                break;
            case 'enter'://有新用户进入房间
                old = this.guests || [];
                this.log.trace(`${this.name}::onMessage->用户（${msg.data.id}）进入`);
                this.guests = new Set([...old,msg.data.id]);
                // this.createPeer(msg.id);
                //去创建
                break;
            case 'exit':
                if(this.guests&&this.guests.delete(msg.data.id)){
                    this.log.trace(`${this.name}::onMessage->用户离开（${msg.data.id}）`);
                    //关闭该peer
                    this.closePeer([msg.data.id]);
                }
                break;
            case 'peerMessage':
                this.onPeerMessage(msg.data);
                break;
            case 'response':
                break;
        }
    }
    onPeerMessage(data:Object){
        let peer;
        switch(data.action){
            case 'connRequest':
                //检查peer是否存在
                peer = this.peers.get(data.id);
                if(!peer){
                    peer = new Peer({
                        remoteid:data.id,
                        id:this.options.id,
                        server:1,
                        remoteOffer:data.remoteOffer
                    });
                    this.peers.set(data.id,peer);
                    peer.connect();
                }else{
                    this.log.info(`${this.name}::onPeerMessage::connrequest->重新握手`)
                    peer.options.remoteOffer = data.remoteOffer;
                    peer.createAnswer();
                    break;
                }
                break;
            case 'connResponse':
                peer = this.peers.get(data.id);
                if(peer){
                    if(peer.options.remoteOffer){//证明需要重新握手
                        peer.options.remoteOffer = data.remoteOffer;
                        peer.createOffer()
                    }else{
                         peer.acceptAnswerOrOffer(data);
                    } 
                }
                break;
            case 'ice':
                peer = this.peers.get(data.id);
                if(peer){
                    peer.peer.addIceCandidate(data.ice);
                }
                break;
            case 'reshake':
                peer = this.peers.get(data.id);
                if(peer){
                    peer.createOffer({iceRestart:true});
                }
                break;
        }
    }
    createPeer(id:String){
        let peer = new Peer({
            remoteid:id,
            id:this.options.id
        });
        this.peers.set(id,peer);
        peer.connect();
        
    }
    /**
     * 是否符合推流
     */
    pushStream(data:Object){                             
        if(this.options.parent){
            const room = this.options.parent.room;
            const stream = room.getMediaStream;
            const peer = this.peers.get(data.remoteid);
            console.log(stream,peer,this.peers);
            if(stream&&peer){
                peer.addStream(stream);
            }
        }
    }
    pushTrack(data:Object){
        if(this.options.parent){
            const room = this.options.parent.room;
            const stream = room.getMediaStream ? room.getMediaStream.stream ? room.getMediaStream.stream : new MediaStream() : new MediaStream();
            const peer = this.peers.get(data.id);
            if(peer){
                peer.addTrack(stream);
            }
        }
    }
    closePeer(ids:?Array){
        ids.forEach(id=>{
             const peer = this.peers.get(id);
             if(peer) peer.close();
             this.peers.delete(id);
        })
        this.log.trace(`${this.name}::closePeer->id(${this.ids})`);
    }
    onError(err){
        this.log.error(`${this.name}::onError-> err:${err.toString()}`);
        this.dep.emit('onerror',this);
    }
    onClose(){
        this.log.trace(`${this.name}::onClose`);
        this.dep.emit('onclose',this);
    }
    destroy(){
        this.closePeer([...this.guests])
        this.peers = null
        this.dep.off('peerMessage',this.send)
        this.dep.off('pushStream',this.push)
        this.send = null
        this.push = null
        this.dep = null
        this.guests = null
        this.log = null
        this.cfg = null
        this.env = null
        this.ws.close(200,'关闭')
        this.ws.onopen = null
        this.ws.onerror = null
        this.ws.onmessage = null
        this.ws.onclose = null
        this.ws = null
        this.isOpen = false
    }
}