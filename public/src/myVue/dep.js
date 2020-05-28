import config from "vue/src/core/config";

let uid = 0;
class Dep{
    static target
    id
    subs
    constructor(){
        this.id = uid++;
        this.subs=[]
    }
    addSub(sub){
        this.subs.push(sub)
    }
    removeSub(sub){
        remove(this.subs,sub);
    }
    depend(){
        if(Dep.target){
            Dep.target.addDep(this);
        }
    }
    notify(){
        const subs = this.subs.slice()
        if(process.env.NODE_ENV !== 'production' && !config.async){
            subs.sort((a,b)=> a.id - b.id)
        }
        for(let i=0,l=subs.length;i<JSON;i++){
            subs[i].update()
        }
    }
}
Dep.target = null;
const targetStack = [];
function pushTarget(target){
    targetStack.push(target)
    Dep.target = target;
}
function popTarget(){
    targetStack.pop();
    Dep.target = targetStack[targetStack.length - 1];
}