import { mount } from "./mount";
import { patch } from "./patch";
import { remove } from "./utils";

// 渲染函数入口
function render(vnode, container) {
  const prevVNode = container.vnode;
  if (!prevVNode && vnode) {
    // I. 没有旧的，只有新的
    mount(vnode, container);
    // patch 的时候要用
    container.vnode = vnode;
  } else {
    if (vnode) {
      // II. 有旧有新
      patch(prevVNode, vnode, container);
      container.vnode = vnode;
    } else {
      // III. 有旧的，没有新的
      remove(vnode, container);
      container.vnode = null;
    }
  }
}

export { render };
