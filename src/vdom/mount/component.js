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
export function mountComponent(vnode, container, isSVG) {
  // 两种组件其实都是执行函数 vnode 然后 mount，没有多余的步骤
  // 至于生命周期，那是组件实现的逻辑了，跟这里关系不大
  if (vnode.flags & COMPONENT_FUNCTIONAL) {
    // I. 函数式组件，就是一个返回 vnode 的函数
    mountFunctionalComponent(vnode, container, isSVG);
  } else {
    // II. 有状态组件是一个类，但是通过实例方法也返回一个 vnode
    mountStatefulComponent(vnode, container, isSVG);
  }
  // 即两种组件的内部都调用了 h() 函数
  // p.s. vnode.tag 保存了组件的引用
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
  // vnode 需要引用一下 instance，以便能够通过 vnode 访问到
  // 普通 html 元素的 vnode，其 children 是用来保存子元素的
  // 但是组件的子元素是通过插槽提供的，而且单独保存为 slot 字段
  // 所以 children 属性就可以拿出来保存 instance 了
  vnode.children = instance;
  // babel 里没装可选链
  instance.props = vnode && vnode.data && vnode.data.chlidProps;

  // 封装一下，初次渲染和后续更新的时候可以直接复用
  instance._render = () => {
    // 未挂载，说明是初次渲染
    if (!instance._mounted) {
      // II. 渲染 vnode
      // 执行实例方法 render()，获取组件要渲染的 vnode
      // 虽然叫 render()，但是跟上面的 render() 完全不是一回事
      // 反而相当于 h()，因为本质上就是调用了 h()
      // 上面已经有一个 vnode 了，是组件所在的对象
      // 组件的 render() 返回了另一个真正用来渲染的 realVNode
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
      // 也就是组件的 this.$vnode 和 this.$el 了
      // 这是组件独有的了，其他的 vnode 没有 insatnce
      instance.$vnode = realVNode;
      instance.$el = el;

      // 渲染完成后，调用 mounted() 钩子
      instance.mounted && instance.mounted();
      instance._mounted = true;
    }
    // 已经挂载过了，获取新旧两个 vnode 并调用 patch
    else {
      instance.beforeUpdate && instance.beforeUpdate();

      const prevRealVNode = instance.$vnode;
      const nextRealVNode = instance.render();
      // TODO: 这里传进来的是 realVNode，但是 render() 里调用 patch() 的时候传的可是组件的 vnode 啊！
      // 注意了，_render() 作为一个私有方法，只有一种调用的场景
      // 那就是在组件内部被调用，当组件内部数据变化时
      // 所以这里调用 patch() 之后，只是 patch 了数据
      patch(prevRealVNode, nextRealVNode, container);

      // 更新 vnode 和 instance 上的值
      const el = nextRealVNode.$el;
      vnode.el = el;
      instance.$vnode = vnode;
      instance.$el = el;

      instance.updated && instance.updated();
    }
  };

  instance._render();
}

// 函数式组件
function mountFunctionalComponent(vnode, container, isSVG) {
  // 获取返回值，即 vnode
  const $vnode = vnode.tag();
  // 挂载
  mount($vnode, container, isSVG);
  // 引用
  vnode.el = $vnode.el;

  console.log(vnode);
  console.log($vnode);
}
