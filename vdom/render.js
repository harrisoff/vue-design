import { mount } from "./mount";
import { patch } from "./patch";
import { remove } from "./utils";

// 渲染函数入口
function render(vnode, container) {
  // console.trace(1);
  const prevVNode = container.vnode;
  if (!prevVNode && vnode) {
    // I. 没有旧的，只有新的，mount
    mount(vnode, container);
    // patch 的时候要用
    // TODO: 为啥不写在 mount/patch 里面？
    container.vnode = vnode;
  } else {
    if (vnode) {
      // II. 有旧有新，patch
      patch(prevVNode, vnode, container);
      container.vnode = vnode;
    } else {
      // III. 有旧的，没有新的，remove
      remove(vnode, container);
      container.vnode = null;
    }
  }
}

function notes() {
  // 渲染完成后
  const container = {}; // 1. 容器元素 container
  const vnode = {}; // 2. vnode
  const child = {}; // 3. vnode 渲染出来的根元素 child（不包括其内部结构
  // 这三者有以下层级关系：
  container.children[0] = child; // DOM 树的层级关系
  container.vnode = vnode; // render() 中手动添加的
  vnode.el = child; // vnode 需要引用由它渲染出的 dom 元素
  // 也就是
  container.vnode.el = child;
  // 对于组件，还有
  const instance = {}; // 4. 组件实例
  vnode.children = instance;
}

export { render };
