/* @flow */
import Log  from '../utils/logproxy'
import LocalStream from './stream';
import env from '../utils/env'
import Dep from '../utils/dep'
import {VideoEvent} from '../webrtc/VideoEvents.js'
import {throttle} from '../utils/strings'

export default class Room{
    env:env
    dep:Dep
    name:String
    stream:?LocalStream
    mediaStream:?Object
    mediaContainer:?Map
    options:?Object
    push:Function
    remove:Function

    constructor(options?:?Object){
        this.defaultoptions = {
            id:null,
            maxAllowlink:2,
            container:null,
            mainScreen:null,
            child:null,
            width:400,
            height:300,
            window:null,
        }
        this.options = Object.assign({},this.defaultoptions,options||{});
        this.name = this.__proto__.constructor.name;
        this.log = Log.getInstance();
        this.env = env.getInstance();
        this.dep = Dep.getInstance();
        this.push = data => this.addMedia(data)
        this.remove = data => this.removeMedia(data)
        this.stream = null;
        this.mediaStream = null;
        this.mediaContainer = new Map();//包含id,video
        this.init();
    }
    init(){
        //初始化
        this.stream = new LocalStream({
            window:this.options.window
        });
        //注册视频事件监听
        this.dep.on('addStream',this.push)
        this.dep.on('closeStream',this.remove)
        VideoEvent.forEach(item=>{
            this.dep.on(item,this.events)
        })
        //初始化容器
        const wid = this.options.width || 400;
        const hei = this.options.height || 300;
        this.log.info(`初始化room.并构建.main和.child container_size(${wid}*${hei})`);
        const doc = this.options.window.document;
        const main =  this.options.mainScreen = doc.createElement('div');
        main.setAttribute('class','main');
        const child = this.options.child = doc.createElement('div');
        child.setAttribute('class','child');
        const container = this.options.container;

        if(!!container){
            container.style.height = `${hei}px`;
            container.appendChild(main);
            container.appendChild(child);
            this.createToolBar(container)
            return;
        }
        this.log.error(`初始化room失败，请传入[container].`);
    }
    createToolBar(container:?Node){
        this.log.trace(`${this.name}::createToolBar->`);
        const doc = this.options.window?this.options.window.document:'';
        if(!!doc){
            const toolBar = doc.createElement('div');
            toolBar.setAttribute('class','toolBar');
            ///创建标题栏目
            const top = doc.createElement('top');
            top.setAttribute('class','top');
            toolBar.appendChild(top);
            const main = doc.createElement('div');
            main.setAttribute('class','main');
            top.appendChild(main);
            const blank = doc.createElement('div');
            blank.setAttribute('class','blank');
            top.appendChild(blank);

            const title = doc.createElement('div');
            title.setAttribute('class','title');
            title.innerText = `房间ID:${this.options.id}`
            main.appendChild(title);
            const tools = doc.createElement('div');
            tools.setAttribute('class','tools');
            main.appendChild(tools);

            const on = throttle((evt)=>this.onClick(evt),2000);
            const tb = [
                {text:'视频',class:'videoButton',click:on},
                {text:'桌面',class:'shareButton',click:on}
            ];
            this.pf = this.env.getPlatForm();
            if(this.pf === 'iphone' 
                || this.pf === 'android' 
                // || this.pf === 'mac'
            ){
                tb.push(
                    {text:'LOG',class:'logButton',click:on}
                )
                const log = doc.createElement('div');
                log.setAttribute('class','log');
                toolBar.appendChild(log);
                this.log.logBar = log;
            }
            let bt;
            ///增加视频和桌面两个按钮
            for(let i=0;i<tb.length;i++){
                bt = doc.createElement('button');
                bt.setAttribute('class',tb[i].class);
                bt.id = i;
                bt.innerText = tb[i].text;
                bt.addEventListener('click',tb[i].click);
                tools.appendChild(bt);
            }
            container.appendChild(toolBar);
        }
    }
    onClick(evt:MouseEvent){
        const target = evt.currentTarget
        let media;
        this.log.trace(`${this.name}::onClick->id(${target.id}),text(${target.innerText})`)
        switch(target.id){
            case '0':
                this.closeTrack();
                if(target.innerText === '视频'){
                        target.innerText = '关闭';
                        media =  this.stream.getUserMedia();            
                }else{
                        target.innerText = '视频';
                        this.dep.emit('closeLocalStream',this.mediaStream);
                        this.mediaStream = null;
                }
                break;
            case '1':
                this.closeTrack();
                media = this.stream.getDesktop();
                break;
            case '2':
                const log = this.log.logBar;
                if(log.style.display !== 'none'){
                    log.style.display = 'none';
                }else{
                    log.style.display = 'block';
                }
                break;
        }
       media&&media.then(value=>{
           this.mediaStream = {
               id:this.options.id,
               stream:value.stream
            }
            this.dep.emit('openLocalStream',this.mediaStream);
            this.addMedia(this.mediaStream);
        });
    }
    /**
     * 添加一个流到容器中
     */
    addMedia(stream:Object){
        if(!!!this.options.videos){
            this.options.videos = new Map();
        }
        //检查流是否存在，存在删除原来流
        let us={};
        if(this.options.mainScreen.childNodes.length === 0){//添加到主流视频窗
            us.type = 0;
        }else{
            us.type = 1;
        }
        if(!!this.mediaContainer.get(stream.id)){
            us = this.mediaContainer.get(stream.id);
            this.closeTrack(us);
            if(us.type === 0){//添加到主流视频窗
                this.options.mainScreen.removeChild(us.video);
            }else{
                this.options.child.removeChild(us.video);
            }
        }
        us = Object.assign(us,stream);
        if(!!!us.video){
            us.video = this.createVideo(us.id);
        }
        this.mediaContainer.set(stream.id,us);

        if(us.type === 0){//主流
            this.options.mainScreen.appendChild(us.video);
        }else{
            us.video.setAttribute('class','childVideo');
            this.options.child.appendChild(us.video);
        }
        us.video.srcObject = us.stream;
    }
    get getMediaStream():Object{
        return this.mediaStream;
    }
    removeMedia(data:Object){
        const us = this.mediaContainer.get(data.id);
        if(us){
            this.log.trace(`${this.name}::removeMedia`);
            this.closeTrack(us);
            if(us.type === 0){//主流appendChild();
                this.options.mainScreen.removeChild(us.video);
            }else{
                this.options.child.removeChild(us.video);
            }
            this.mediaContainer.delete(data.id);
        }
    }
    closeTrack(value:Object){
        if(!!!value){
            value = this.mediaContainer.get(this.options.id);
        }
        if(value&&value.video&&value.video.srcObject){
            const _stream = value.video.srcObject;
            const _track = _stream.getTracks();
            if(_track){
                _track.forEach(track => track.stop());
            }
            value.video.srcObject = null;
        }
    }
    createVideo(id:String):Node{
        const doc = this.options.window.document;
        let video = doc.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.setAttribute('id',id);
        video.setAttribute('autoplay','autoplay');
        video.setAttribute('muted',true);
        video.setAttribute('controls',true);
        for(let i=0;i<VideoEvent.length;i++){
            video.addEventListener(VideoEvent[i],(evt)=>{this.dep.emit(VideoEvent[i],evt)});
        }
        return video;
    }
    events(evt:VideoEvent){
        const video = evt.currentTarget;
        switch(evt.type){
            case 'canplay':
                video.setAttribute('muted',true);
                video.play();
        }
    }
    /**
     * 销毁
     */
    destroy(){
        this.dep.off('addStream',this.push)
        this.dep.off('closeStream',this.remove)
        VideoEvent.forEach(item=>{
            this.dep.off(item,this.events)
        })
        this.dep = null
        this.log = null
        this.env = null
        this.stream.destroy()
        this.stream = null
        this.mediaStream = null
        this.mediaContainer = null
    }
}