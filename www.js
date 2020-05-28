const koa = require('koa2');
const path = require('path');
const static = require('koa-static');
const KoaBody= require('koa-body');
const router = require('koa-router')();
const webServer = require('nodejs-websocket');
const app = new koa();

let map = new Map();//保存房间对应用户表

const ws = webServer.createServer((conn)=>{
    conn.on('connect',(res)=>{
        console.log('连接成功',res);
    })
    conn.on('binary',data=>{
        console.log(`binary:`,binary)
    })
    conn.on('text',data=>{
        const msg = JSON.parse(data);
        let s_msg;
        switch(msg.type){
            case 'register':
                //添加到map表
                const uid = msg.data.id;
                const roomid = msg.data.roomid;
                conn.id = uid;
                conn.roomid = roomid;
                let uids = map.get(roomid);
                if(!!!uids){
                    uids = new Set();
                }
                if(!uids.has(uid)){
                    uids.add(uid);
                }
                map.set(roomid,uids);
                //////////////////////
               s_msg = {
                    type:'register',
                    data:{
                        error:0,
                        message:'ok'
                    }
                }
                broadcast({type:'enter',id:uid,roomid:roomid});
                conn.send(JSON.stringify(s_msg));//返回注册成功
                break;
            case 'getGuestList':
                const gl = map.get(msg.data.roomid) || [];
                s_msg = {
                    type:'onGuestList',
                    data:{
                        error:0,
                        list:[...gl]
                    }
                }
                conn.send(JSON.stringify(s_msg))
                break;
            case 'peerMessage':
                console.log(msg.data.remoteid);
                const remote = ws.connections.filter(connection=>{
                    return connection.id === msg.data.remoteid;
                })
                if(remote.length>0){
                    remote[0].send(data);
                }
                break;
        }
    });
    conn.on('close',(code,res)=>{
        broadcast({type:'exit',id:conn.id,roomid:conn.roomid});
        //从map删除
        let uids = map.get(conn.roomid);
        if(!!uids){
            uids.delete(conn.id);
        }
        console.log(`close:${code}`,res);
    });
    conn.on('error',(err)=>{
        //从map删除
        let uids = map.get(conn.roomid);
        if(!!uids){
            uids.delete(conn.id)
        }
        console.log(`code:${err}`);
    })
});
const broadcast = function(msg){
    let _sg;
    switch(msg.type){
        case 'enter':
        case 'exit':
            const rid = msg.roomid;
            const uids = map.get(rid);
            ws.connections.forEach(value=>{
                if(uids.has(value.id)&&value.id !== msg.id){
                    _sg = {
                        type:msg.type,
                        data:{
                            error:0,
                            id:msg.id
                        }
                    }
                    value.send(JSON.stringify(_sg));
                }
            })
            break;
    }
   
}
ws.on('close',()=>{
    console.log('close...')
});
const type = [0,1,2];
router.get('/user/:id',async(ctx)=>{
    const uid = ctx.params.id;
   // console.log(ctx.params.id);
    let str = {
        type:2
    }
    if(uid%2 === 0){
        str.type = 1;
    }
    ctx.body = JSON.stringify(str);
})
app.use(router.routes());
app.use(router.allowedMethods())
app.use(static(path.join(__dirname,'public')));
app.use(KoaBody({
    multipart:true,
    encoding:'gzip',
    formidable:{
        uploadDir:path.join(__dirname,'public/uploads'),
        keepExtensions:true,
        maxFieldsSize:10*1024*1024
    }
}))
ws.listen(5001,(res)=>{
    console.log('ws on port 5001',res)
})
app.listen(5000,()=>{
    console.log('port on 5000');
})