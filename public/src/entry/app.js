import config from '../utils/config'
import Manager from '../webrtc/manager'
import {parseSearch} from '../utils/strings'
import {Loader} from '../utils/loader'
import dep from '../utils/dep'


require('../css/app.scss');


const container = document.getElementById('app');
const width = document.body.clientWidth ? document.body.clientWidth
            : window.screen.width ? window.screen.width
            : 800;
const height = document.body.scrollHeight ? document.body.scrollHeight 
            : document.body.clientHeight ? document.body.clientHeight
            : window.screen.availHeigh ? window.screen.availHeigh
            : window.screen.height ? window.screen.height
            : 600;
//判断用户是否有权限
const params = parseSearch(window.location.search);
const cfg = config.getInstance();
cfg.initParams(params);
if(!!params.roomid){
    const loader =  new Loader({
        baseUrl:'',
        path:`/user/${params.uid}`
    })
    const d = dep.getInstance();
    d.on('complete',link);
    loader.load();
}
function link(loader){
    let data;
    try{
        data = JSON.parse(loader.options.response);
    }catch(e){
       console.log(e)
    }
    const manager = new Manager({
        container:container,
        width:width,
        height:height,
        window:window,
        roomId:params.roomid,
        uid:params.uid
    })
}
// const u_options = window.sessionStorage.getItem('room')
if(module.hot){
    module.hot.accept('../webrtc/stream',()=>{
        console.log('热加载！')
    })
}
