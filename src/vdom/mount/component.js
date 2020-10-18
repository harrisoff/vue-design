import { patch } from "../patch";
import { mount } from "./index";

import { VNodeFlags, ChildrenFlags } from "../vnode-types";
const {
  TEXT,
  FRAGMENT,
  PORTAL,
  ELEMENT,
  COMPONENT,
  // COMPONENT_STATEFUL_NORMAL,
  COMPONENT_FUNCTIONAL,
  ELEMENT_SVG
} = VNodeFlags;

// 组件
// 像前面说的，组件的 vnode 不是用来渲染 DOM 的
// 其内部的另一个 realVNode 才是
// 到这一步时，参数 vnode 仍然是组件的 vnode
// +====================================================+
// | **注意！！！！！！！！！！********
// | 这里的 realVNode 变量**不一定真的是用来渲染的**
// | 因为可能是嵌套组件，这时 realVNode 是子组件的 vnode
// | 可能子组件才返回渲染 DOM 用的 realVNode，也可能继续嵌套
// | 不要忘了嵌套组件的情况！！！！！
// +====================================================+
export function mountComponent(vnode, container, isSVG) {
  console.log("mountComponent", vnode);
  // 注了个意
  // 虽然是挂载函数，但不只有**挂载**的逻辑，还包括**更新**的部分逻辑
  // 因为更新将会由组件发起，所以需要组件向外部暴露一个 API _update()
  // 那么这部分代码在组件初始化的时候就需要准备好
  // 逻辑很简单，就是获取新旧 vnode 调用 patch，然后更新一下引用

  if (vnode.flags & COMPONENT_FUNCTIONAL) {
    mountFunctionalComponent(vnode, container, isSVG);
  } else {
    mountStatefulComponent(vnode, container, isSVG);
  }
}

// 有状态组件
function mountStatefulComponent(vnode, container, isSVG) {
  // I. 创建组件实例
  // 在 h() 的时候把类保存到了 tag 里
  const Constructor = vnode.tag;
  // 组件外叫 instance，组件内叫 this
  // 内外可以通过实例方法和属性传值，这样就实现了：
  // 1. 在外部执行内部定义的生命周期钩子函数
  // 2. 在内部获取外部传入的 props 等属性
  const instance = new Constructor();
  // 为了能够通过 vnode 访问到 instance，需要引用一下
  // 普通 html 元素的 vnode 的 children 是用来保存子元素的
  // TODO: 但是组件的子元素是通过插槽提供的，而且单独保存为 slot 字段
  // TODO: 那 realVNode 的 children 是干啥的？？
  // 所以 children 属性就可以拿出来保存 instance 了
  vnode.children = instance;
  // babel 里没装可选链
  instance.props = vnode.data && vnode.data.chlidProps;

  instance._mount = () => {
    instance.beforeMount && instance.beforeMount();

    // II. 渲染 vnode
    // 执行实例方法 render()，获取组件要渲染的 vnode
    // 虽然叫 render()，但是跟上面的 render() 完全不是一回事
    // 反而相当于 h()，因为本质上就是调用了 h()
    // 上面已经有一个 vnode 了，是组件所在的对象
    // 组件的 render() 返回了另一个真正用来渲染的 realVNode（或子组件的 vnode
    const realVNode = instance.render();

    // III. 挂载
    // 上面的 realVNode 可能是 DOM 标签，也可能仍然是组件
    // 这里就不用管了，直接递归就完了
    // 无论如何，最终将会生成 realVNode 对应的实际 DOM 元素
    mount(realVNode, container, isSVG);

    // IV. 引用 el
    // 本着 **一个 el 需要被创建它的 vnode 引用** 的原则
    // 虽然 el 不是由 vnode 直接生成的
    // 而是 (new vnode.tag()).render() 生成的
    // 但是最终只生成了这么一个 el，所以就引用它了
    const el = realVNode.el;
    vnode.el = el;
    // 为什么不是 realVNode.el = el 呢
    // 虽然实际生成 el 的是 realVNode 而不是 vnode
    // 但是，我们关注的不是**代码层面**上，el 是由谁生成的
    // 而是**组件层面**上，el 是由谁生成的
    // 所以就抛开实现细节，直接认为 el 是由组件这个整体生成的
    // 并且，是 vnode 的嵌套保持了整个 vnode 树的结构，而不是 vnode 返回的另一个 realVNode

    // V. 把 realVNode 和 el 也添加到组件实例上
    // 也就是在组件里通过 this 访问到的一些属性
    // 这是有状态组件独有的了，其他的 vnode 没有 instance
    instance.$vnode = realVNode; // 组件的 this.$vnode
    instance.$el = el; // 组件的 this.$el
    // 其实只要把 instance 和 realVNode 联系上就够了
    // 因为 el 本来就跟 realVNode 有关联

    // 一共涉及了以下 5 个对象
    // 1. vnode               // 组件的 vnode
    // 2. class Component     // 组件类
    // 3. instance            // 组件实例
    // 4. realVNode           // 实际渲染用的 vnode
    // 5. element             // 渲染生成的 DOM
    // 其中 vnode 没有跟 realVNode 产生直接关联
    // p.s. 函数式组件里，vnode.children = realVNode

    // 渲染完成后，调用 mounted() 钩子
    instance.mounted && instance.mounted();
  };
  instance._mount();

  // 更新有两种情况：主动/被动
  // 1. 主动更新，组件内部的数据变化时触发，比如 data
  // 2. 被动更新，传入组件的数据变化时触发，比如 props
  // **注意**
  // 所谓的**被动更新**，指的是子组件被动，而不是本组件被动
  // p.s. 目前为止，主动和被动都是在数据变化时手动调用 instance._update() 触发的
  instance._update = () => {
    console.trace("_update", instance);
    instance.beforeUpdate && instance.beforeUpdate();

    const prevRealVNode = instance.$vnode;
    const nextRealVNode = instance.render(); // 获取新的 realVNode
    // 假设组件只是简单地渲染一个 div
    // 这里的两个 vnode 不是组件本身的 vnode，而是组件返回的 realVNode
    // 把这种情景称为 i
    // 那么有这么一个问题
    // render() 函数里也会调用 patch()，并且这时两个 vnode 有可能是组件的 vnode
    // 比如在同一个 container 上先后渲染两个组件时，这种情景称为 ii
    // 为什么 patch() 可以接受两种 vnode 呢？
    // 因为
    // 情景 ii 是组件之间的 patch
    // 情景 i 是组件内部的 patch
    // patch 一个只是渲染 div 的组件，跟 patch 普通的 DOM 元素一样
    patch(prevRealVNode, nextRealVNode, prevRealVNode.el.parentNode);
    // 如果是嵌套组件，那么这里的 nextRealVNode 还是组件的 vnode
    // patch() 之后会进入 patchComponent() 的有状态组件的逻辑
    // 会递归调用 instance._update() 更新子组件

    // 更新 vnode 和 instance 上的值
    const el = nextRealVNode.$el;
    vnode.el = el;
    instance.$el = el;
    instance.$vnode = nextRealVNode;

    instance.updated && instance.updated();
  };
}

// 函数式组件
function mountFunctionalComponent(vnode, container, isSVG) {
  // 函数式组件内容比较少，只有 props 和插槽

  // 有状态组件封装了一个 render() 承担渲染和更新的逻辑
  // 并把 render() 添加到 instance 上，这样就能随时拿到函数的引用
  // 函数式组件也有同样的需求，但是没有 instance/this
  // 所以只能在 vnode 上再添加一个属性了，还能顺便做一些别的事
  vnode.handler = {
    container,
    // prev/next 用来在组件更新时保存旧/新两个组件的 vnode
    // prev/next 的赋值在 patchComponent 中进行
    prev: null,
    next: vnode,
    mount() {
      console.log("handler.mount");
      const childProps = (vnode.data && vnode.data.props) || {};
      // tag 保存的是普通函数，不需要 new，直接执行获取 vnode-types
      // 因此也没有 instance，只能通过函数传参的方式向组件内传递数据
      // 在 h(FunctionalComponent, data) 时作为第二个参数传入
      const realVNode = vnode.tag({ props: childProps });
      // 挂载
      mount(realVNode, container, isSVG);
      // 更新的时候会用到
      vnode.children = realVNode;
      // 引用
      vnode.el = realVNode.el;
    },
    // TODO: 函数式组件 update 什么情况下会触发？
    update() {}
  };

  vnode.handler.mount();
}
