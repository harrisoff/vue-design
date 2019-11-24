import { VNodeFlags, ChildrenFlags } from "./vnode-types";
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
const { NO_CHILDREN, SINGLE_VNODE, MULTIPLE_VNODES } = ChildrenFlags;

import { patchData } from "./utils";

// 挂载
// I. 使用 vnode 提供的数据创建真实的 DOM 元素
// II. vnode.el 引用由自身生成的 DOM 元素
// III. 添加到 container
// 显然，最终都是创建了标准的 DOM 元素
// 即，在递归的最后，都调用了 mountElement() 或 mountText()
export function mount(vnode, container, isSVG) {
  const { flags } = vnode;
  if (flags & ELEMENT) {
    // I. HTML/svg
    mountElement(vnode, container, isSVG);
  } else if (flags & COMPONENT) {
    // II. 组件
    mountComponent(vnode, container, isSVG);
  } else if (flags & TEXT) {
    // III. 纯文本
    mountText(vnode, container);
  } else if (flags & FRAGMENT) {
    // IV. fragment
    mountFragment(vnode, container, isSVG);
  } else if (flags & PORTAL) {
    // V. portal
    mountPortal(vnode, container, isSVG);
  }
}

// html/svg
function mountElement(vnode, container, isSVG) {
  const { tag, data, flags, children, childrenFlags } = vnode;

  // I. 处理 svg 标签
  // svg 标签的所有后代元素也都是 svg
  isSVG = isSVG || flags & ELEMENT_SVG;
  const el = isSVG
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag);

  // II. 引用真实的 DOM element
  // 因为渲染只会执行一次，后续修改是基于第一次渲染生成的 DOM 元素的
  // 所以在渲染之后需要保存这个 DOM 元素的引用
  vnode.el = el;

  // III. 应用 vnode date
  for (const key in data) {
    const val = data[key];
    // 根据 vnodeData 的 key 采取不同的处理
    // 虽然叫 patchX()，实际只是封装了 switch 语句，mount() 和 patch() 都会用到
    patchData(el, key, null, val, isSVG);
  }

  // IV. 挂载 children
  if (childrenFlags & NO_CHILDREN) {
    // 无 children
    // 文本也是 NO_CHILDREN
    // 不过有单独的挂载函数 mountText，所以这里不需要考虑
  } else {
    if (childrenFlags & SINGLE_VNODE) {
      // 单个
      mount(children, el, isSVG);
    } else if (childrenFlags & MULTIPLE_VNODES) {
      // 多个
      children.forEach(child => {
        mount(child, el, isSVG);
      });
    }
  }

  container.appendChild(el);
}

// 纯文本
function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children);
  vnode.el = el;
  container.appendChild(el);
}

// fragment
function mountFragment(vnode, container, isSVG) {
  // 最主要的区别就是没有 tag，只需要挂载 children
  // **但是也因为没有 tag，所以 vnode.el 处理方式也不同**
  // remember，**一个 el 需要被创建它的 vnode 引用**

  // 拿 fragment 和普通组件举个栗子
  // 组件只能有一个根节点，是其他所有子节点的容器
  // 而 fragment 不要求有一个根节点，多个节点时是并列的，没有容器
  // 没有容器，也就是 vnode 没有直接生成对应的 DOM 元素 el
  // 但是为了保持层级关系，只能直接引用 children 渲染出来的 el 了
  const { children, childrenFlags } = vnode;
  switch (childrenFlags) {
    case SINGLE_VNODE:
      // 单个
      mount(children, container, isSVG);
      vnode.el = children.el;
      break;
    case NO_CHILDREN: {
      // 无，创建一个空白文本节点占位
      // patch() 中移动元素时，需要节点的引用
      // 就算 Fragment 没有子节点，也需要一个占位的空文本节点
      const placeholder = document.createTextNode("");
      mountText(placeholder, container);
      vnode.el = placeholder.el;
      break;
    }
    default:
      // 多个
      children.forEach(child => {
        mount(child, container, isSVG);
      });
      vnode.el = children[0].el; // 取第一个子节点
      break;
  }
}

// portal
function mountPortal(vnode, container) {
  // Portal 有 tag，但是跟 Fragment 一样只需要挂载 children
  const { tag, children, childrenFlags } = vnode;
  // 在 h() 里已经把 vnode.data.target 另存为 vnode.tag
  const target = typeof tag === "string" ? document.querySelector(tag) : tag;

  if (childrenFlags & SINGLE_VNODE) {
    mount(children, target);
  } else if (childrenFlags & MULTIPLE_VNODES) {
    children.forEach(child => {
      mount(child, target);
    });
  }

  // 虽然实际元素不在这个位置，但行为仍然与此处的元素一致
  // 比如事件捕获/冒泡等机制
  // 所以需要添加一个占位元素，vnode.el 也指向该占位元素
  const placeholder = document.createTextNode("");
  mountText(placeholder, container, false);
  vnode.el = placeholder.el;
}

// 组件
function mountComponent(vnode, container, isSVG) {
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
  // tag 是一个类的引用，相当于 new MyComponent()
  // 而 instance 就是组件里的 this 了
  const instance = new vnode.tag();

  // II. 渲染 vnode
  // 执行实例方法 render()，获取组件要渲染的 vnode
  // 虽然叫 render()，但是跟上面的 render() 完全不是一回事
  // 反而相当于 h()，因为其返回值是 h() 生成的 vnode
  // 组件已经是一个 vnode 了
  // 组件的 render() 返回了另一个 $vnode
  const $vnode = instance.render();

  // III. 挂载
  // 上面的 $vnode 可能是 DOM 标签，也可能仍然是组件
  // 无论如何，最终将会生成 $vnode 对应的实际 DOM 元素，并且
  // i. 添加为 $vnode.el
  // ii. 添加为 container 的子元素
  mount($vnode, container, isSVG);

  // IV. 引用 el
  // 本着 **一个 el 需要被创建它的 vnode 引用** 的原则
  const $el = $vnode.el;
  // 虽然 $el 不是由 vnode 直接生成的
  // 但是最终只生成了这么一个 $el
  // 所以就引用它了
  vnode.el = $el;

  // V. 把 $vnode 和 $el 也添加到组件实例上
  // 也就是组件的 this.$vnode 和 this.$el 了
  instance.$vnode = $vnode;
  instance.$el = $el;

  // 打印一下看看 🤪
  console.log(vnode);
  console.log($vnode);
  console.log(instance);
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
