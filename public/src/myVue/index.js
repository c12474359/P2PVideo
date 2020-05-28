import { stateMixin } from "vue/src/core/instance/state";
import { eventsMixin } from "vue/src/core/instance/events";
import { lifecycleMixin } from "vue/src/core/instance/lifecycle";
import { renderMixin } from "vue/src/core/instance/render";

function MyVue(options){
    if(!(this instanceof MyVue)){
        throw new Error('MyVue is an constructor and should be called with the `new` keyword.')
    }
    this._init(options);
}
initMixin(MyVue);
stateMixin(MyVue);
eventsMixin(MyVue);
lifecycleMixin(MyVue);
renderMixin(MyVue);

export default MyVue