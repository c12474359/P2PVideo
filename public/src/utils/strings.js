export function parseSearch(value){
    const _params = value.split(/\?|&/);
    let _kvs,_obj={};
    _params.forEach(el => {
        if(!!el){
            _kvs = el.split('=');
            _obj[_kvs[0]] = _kvs.length>1?_kvs[1]:_kvs[0];
        }
    });
    return _obj;
}
export function throttle(fn,delay){
    let pre = 0;
    return function(){
        if((Date.now() - pre) >= delay){
            pre = Date.now();
            const value = fn.apply(this,arguments);
        }
    }
}