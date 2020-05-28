import log from '../utils/logproxy'
import dep from '../utils/dep'
import {RTC,SDP} from '../utils/env';

export default class Peer{
    constructor(options){
        this.defaultOptions={
            stun:['stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
               'stun:stun4.l.google.com:19302',
                'stun:23.21.150.121',
                'stun:stun01.sipphone.com',
                'stun:stun.ekiga.net',
                'stun:stun.fwdnet.net',
                'stun:stun.ideasip.com',
                'stun:stun.iptel.org',
                'stun:stun.rixtelecom.se',
                'stun:stun.schlund.de',
                'stun:stunserver.org',
                'stun:stun.softjoys.com',
                'stun:stun.voiparound.com',
                'stun:stun.voipbuster.com',
                'stun:stun.voipstunt.com',
                'stun:stun.voxgratia.org',
                'stun:stun.xten.com'],
            remoteid:null,// 对方id
            server:0,//0主动，1被动
            ice:null,
            channel:null,
            connectState:null,
            stream:null
        }
        this.options = Object.assign(this.defaultOptions,options||{});
        this.name =  this.__proto__.constructor.name;
        this.peer = null;
        this.log = log.getInstance();
        this.dep = dep.getInstance();
        this.iceOptions = null;
        this.iceServers = null;
        this.init();
    }
    init(){
        this.log.trace(`${this.name}::init->remoteId(${this.options.remoteid})`)
        this.iceServers = [];
        let i = 2,pos;
        while(i--){
            pos = Math.floor(Math.random()*this.options.stun.length);
            this.iceServers.push({
                url:`${this.options.stun[pos]}?transport=udp`
            })
        }
        this.iceOptions = {
            'optional':[]
        }
        this.offerOptions = {
            offerToReceiveAudio:true,
            offerToReceiveVideo:true
        }
    }
    connect(){
        this.log.trace(`${this.name}::connect,server(${this.options.server})`);
        this.peer = new RTC({
            iceServers:this.iceServers
        },this.iceOptions)
        //检查是否符合推流
        this.dep.on('openLocalStream',(data)=>{this.addStream(data)});
        this.dep.on('closeLocalStream',(data)=>{this.removeStream(data)});
        this.dep.emit('pushStream',{remoteid:this.options.remoteid});
        //增加事件
        this.peer.onnegotiationneeded = ()=>{this.onReNegotiation();}
        this.peer.onicecandidate = (evt)=>{this.onPeerIceCandidate(evt);}
        this.peer.onaddstream = (evt) =>{this.onAddStream(evt)}
        this.peer.onremovestream = (evt) => {this.onRemoveStream(evt)}
        this.peer.ontrack = (evt) =>{this.onAddTrack(evt);}
        //this.peer.ondatachannel = (evt) =>{this.onDataChannel(evt)}
        this.peer.oniceconnectionstatechange =  (evt) =>{this.onIceConnectionStateChange(evt)}
        this.peer.onsignalingstatechange = (evt)=>{this.onSignalingChange(evt)}
        if(this.options.server === 0){
            // this.options.channel = this.peer.createDataChannel('channel');
            // this.options.channel.onopen = evt=>{this.onChannelOpen(evt)};
            // this.options.channel.onmessage = evt=> {this.onChannelMessage(evt)};
            // this.options.channel.onerror = evt=>{this.onChannelError(evt)};
            // this.options.channel.onclose = evt=>{ this.onChannelClose(evt)};
            this.createOffer();
        }else{
            this.createAnswer();
        }
    }
    createOffer(offerOptions){
        if(this.options.remoteOffer){
            this.peer.setRemoteDescription(this.options.remoteOffer);
        }
        const ops = offerOptions || this.offerOptions;
        this.peer.createOffer(ops).then(offer=>{
            this.log.trace(`${this.name}::createOffer-> ok`)
            this.peer.setLocalDescription(offer);
            this.options.offer = offer;
            this.sendTransit({action:'connRequest'});
        }).catch(err=>{
            this.log.error(`${this.name}::createOffer fail!`)
        })
    }
    createAnswer(offerOptions){
        if(this.options.remoteOffer){
            this.log.trace(`${this.name}::createAnswer->signalingState(${this.options.signalingState})`)
            this.peer.setRemoteDescription(this.options.remoteOffer);
        }
        this.peer.createAnswer(offerOptions).then(answer=>{
            this.log.trace(`${this.name}::createAnswer-> local(${this.options.id}) ok`)
            this.peer.setLocalDescription(answer);
            this.options.offer = answer;
            this.sendTransit({action:'connResponse'});
        }).catch(err=>{
            this.log.error(`${this.name}::createAnswer fail!`,err)
        })
    }
    acceptAnswerOrOffer(data){
        this.log.trace(`${this.name}::acceptAnswer local(${this.options.id}),remote(${this.options.remoteid})`);
        this.peer.setRemoteDescription(data.remoteOffer) 
    }
    addStream(data){
        console.log(this);
        this.log.trace(`${this.name}::addStream`,data);
        if(this.options.signalingState === 'closed'){
            this.peer.restartIce();
            return;
        }
        if(data){
            this.peer.addStream(data.stream);
        }
    }
    removeStream(data){
        this.log.trace(`${this.name}::removeStream`)
        this.peer.removeStream(data.stream);
    }
    // addTrack(stream){
    //     this.log.trace(`${this.name}::addTrack`)
    //     const tracks = stream.getTracks();
    //     tracks.forEach(track=>{
    //         stream.addTrack(track);
    //         this.peer.addTrack(track,stream);
    //     })
       
    //     // this.peer.addStream(stream);
    // }
    onAddStream(data){
        this.log.trace(`${this.name}::onAddStream`,data)
        this.options.stream = data.stream;
        this.dep.emit('addStream',{
            id:this.options.remoteid,
            stream:data.stream,
            remoteid:this.options.remoteid
        });
    }
    onRemoveStream(data){
        this.log.trace(`${this.name}::onremoveStream`,data,this.peer);
        this.dep.emit('closeStream',{
            id:this.options.remoteid,
            remoteid:this.options.remoteid
        })
    }
    onAddTrack(data){
        return;
        this.log.trace(`${this.name}::onAddTrack`,data);
        this.options.stream = this.options.stream || data.streams[0];
        // this.options.stream.addTrack(data.track);
        this.dep.emit('addStream',{
            id:this.options.remoteid,
            stream:this.options.stream,
            type:1
        });
    }
    onReNegotiation(){
        this.log.trace(`${this.name}::onReNegotiation connectState(${this.options.connectState}),signalingState(${this.options.signalingState})`);
        if(this.options.connectState === 'connected' && this.options.signalingState === 'stable'){
            //重新握手前需要删掉baocun sdp；
            this.options.remoteOffer = null;
            if(this.options.server === 0){
                this.createOffer({iceRestart:true});
            }else{
                this.sendTransit({action:'reshake'});
            }
        }
    }
    onPeerIceCandidate(evt){
        if(evt.candidate){
            this.options.ice = evt.candidate;
            this.sendTransit({action:'ice'});
        }
    }
    onDataChannel(evt){
        this.log.trace(`${this.name}::onDataChannel`);
        if(!!!this.options.channel) this.options.channel = evt.dataChannel;
    }
    onIceConnectionStateChange(evt){
        this.options.connectState = this.peer.iceConnectionState;
        this.log.trace(`${this.name}::onIceConnectionStateChange->(${this.options.remoteid})${this.options.connectState}`);
        switch(this.options.connectState){
            case 'connected':
            break;
            case 'checking':
            break;
            case 'disconnected':
            break;
            case 'failed':
            case 'closed':
                break;
        }   
    }
    onSignalingChange(evt){
        this.options.signalingState = this.peer.signalingState;
        this.log.trace(`${this.name}::onSignalingChange->${this.options.signalingState}`);
    }
    /**
     * channel
     */
    onChannelOpen(evt){
        this.log.trace(`${this.name}::onDataOpen`);
    }
    onChannelMessage(evt){
        this.log.trace(`${this.name}::onDataMessage`);
    }
    onChannelError(evt){
        this.log.trace(`${this.name}::onDataError`);
    }
    onChannelClose(evt){
        this.log.trace(`${this.name}::onDataClose`);
    }
    sendTransit(data){
        const defaultData = {
            error:0,
            action:data.action,
            ice:this.options.ice,
            remoteOffer:this.options.offer,
            remoteid:this.options.remoteid,
            id:this.options.id
        }
        const msg = Object.assign(defaultData,data);
        this.dep.emit('peerMessage',{type:'peerMessage',data:msg});
    }
    close(){
        this.options = null;
        this.name =  null;
        this.peer.onnegotiationneeded = null;
        this.peer.onicecandidate = null;
        this.peer.onaddstream = null;
        //this.peer.ondatachannel = (evt) =>{this.onDataChannel(evt)}
        this.peer.oniceconnectionstatechange = null;
        this.peer.onsignalingchange = null;
        this.peer = null;
        this.log = null;
        this.dep.off('openLocalStream');
        this.dep.off('closeLocalStream');
        this.dep = null;
        this.iceOptions = null;
        this.iceServers = null;
    }
}