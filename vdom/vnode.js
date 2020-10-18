// flags
import { VNodeFlags, ChildrenFlags } from "./vnode-types";
const {
  ELEMENT_HTML,
  ELEMENT_SVG,
  TEXT,
  COMPONENT_FUNCTIONAL,
  COMPONENT_STATEFUL_NORMAL,
  FRAGMENT,
  PORTAL
} = VNodeFlags;
const { NO_CHILDREN, KEYED_VNODES, SINGLE_VNODE } = ChildrenFlags;

export const Fragment = Symbol();
export const Portal = Symbol();

// 格式化原始数据，生成规定格式的 VNode
// I. 格式化 tag/children 的值
// II. 生成 flags/childrenFlags
// p.s. 文本节点一般不用 h() 函数生成，所以只在 children 部分判断文本节点的情况
// +===================================================================
// | 对于普通 HTML 元素来说，h() 生成的 VNode 确实就是对真实 DOM 的描述
// | 但是对于组件来说，h() 生成的 VNode 并不是对 DOM 的直接描述
// | 虽然仍然是把 h() 的返回值传给 render()，但是内部逻辑不同
// | 组件 render() 返回的另一个 VNode 才是真正用来描述和渲染 DOM 的
// | 这时传入的 data 参数是传递给组件的数据，而不是用来直接生成 VNode 的数据
// +===================================================================
export function h(tag, data = null, children = null) {
  // 判断 tag 类型，设置 flags
  let flags = null;
  // I. 普通 HTML
  if (typeof tag === "string") {
    flags = tag === "svg" ? ELEMENT_SVG : ELEMENT_HTML;
  }
  // II. Fragement
  else if (tag === Fragment) {
    flags = FRAGMENT;
  }
  // III. Portal
  else if (tag === Portal) {
    flags = PORTAL;
    tag = data && data.target; // 需要把挂载目标保存为 tag
  }
  // IV. 组件
  // 对一个返回原生 html 元素的类组件来说，一共要执行两次 h()
  // 一个是组件的 render() 方法中的
  // 用来格式化真正用来渲染 DOM 的 realVNode
  // 一个是调用渲染函数 render() 时用来格式化类组件的
  // 这样 render() 函数才能知道 vnode 的类型是组件
  // 并执行合适的逻辑取出上面的 realVNode
  else {
    // 兼容 Vue2 的对象式组件，tag 为组件实例
    if (tag !== null && typeof tag === "object") {
      flags = tag.functional
        ? COMPONENT_FUNCTIONAL // 函数式组件
        : COMPONENT_STATEFUL_NORMAL; // 有状态组件
    }
    // Vue3 类组件
    else if (typeof tag === "function") {
      flags =
        tag.prototype && tag.prototype.render
          ? COMPONENT_STATEFUL_NORMAL // 有状态组件
          : COMPONENT_FUNCTIONAL; // 函数式组件
    }
  }

  // 判断 children 类型，设置 childrenFlags
  // I.   没有
  // II.  单个
  // III. 多个
  // IV.  文本
  let childrenFlags = null;
  if (Array.isArray(children)) {
    // children 是数组，可能有 0/1/多个
    const { length } = children;
    if (length === 0) {
      // 没有 children
      childrenFlags = NO_CHILDREN;
    } else if (length === 1) {
      // 单个
      childrenFlags = SINGLE_VNODE;
      children = children[0];
    } else {
      // 多个
      childrenFlags = KEYED_VNODES;
      children = normalizeVNodeKey(children); // 格式化为带 key 的 children
    }
  } else {
    // children 不是数组，可能有 0/1 个，或文本
    // 没有 children
    if (!children) {
      childrenFlags = NO_CHILDREN;
    }
    // 单个
    else if (children._isVNode) {
      childrenFlags = SINGLE_VNODE;
    }
    // 文本
    else {
      childrenFlags = SINGLE_VNODE;
      // 文本转文本节点
      // 文本和文本节点是不同的概念，见 patch.js/patchText()
      children = createTextVNode(children);
    }
  }

  const vnode = {
    // 接受的参数，没有变化的
    data,
    // 接收的参数，（可能）发生变化的
    tag,
    children,
    // 新增属性
    key: data && data.key ? data.key : null,
    _isVNode: true,
    flags,
    childrenFlags,
    el: null
  };

  return vnode;
}

// 创建纯文本节点的 VNode
// 这个 VNode 最终会交给 mountText() 渲染
export function createTextVNode(text) {
  return {
    _isVNode: true,
    flags: TEXT,
    tag: null,
    data: null,
    // 把 children 设置为文本
    // mountText() 渲染时取 children 属性为 document.createTextNode() 的参数
    children: text,
    childrenFlags: NO_CHILDREN,
    el: null
  };
}

// 防止 key 重复
function normalizeVNodeKey(children) {
  return children.map((child, index) => {
    child.key = child.key || `|${index}`;
    return child;
  });
}
