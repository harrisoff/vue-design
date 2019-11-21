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

const Fragment = Symbol();
const Portal = Symbol();

// 格式化原始数据，生成规定格式的 VNode
// I. 格式化 tag/children 的值
// II. 生成 flags/childrenFlags
// p.s. 文本节点一般不用 h() 函数生成，所以只在 children 部分判断文本节点的情况
function h(tag, data = null, children = null) {
  // 判断 tag 类型
  let flags = null;
  if (typeof tag === "string") {
    // I. 普通 HTML
    flags = tag === "svg" ? ELEMENT_SVG : ELEMENT_HTML;
  } else if (tag === Fragment) {
    // II. Fragement
    flags = FRAGMENT;
  } else if (tag === Portal) {
    // III. Portal
    flags = PORTAL;
    tag = data && data.target; // 需要把挂载目标保存为 tag
  } else {
    // IV. 组件
    // 组件的 tag 为组件实例
    if (tag !== null && typeof tag === "object") {
      // 兼容 Vue2 的对象式组件
      flags = tag.functional
        ? COMPONENT_FUNCTIONAL // 函数式组件
        : COMPONENT_STATEFUL_NORMAL; // 有状态组件
    } else if (typeof tag === "function") {
      // Vue3 类组件
      flags =
        tag.prototype && tag.prorotypebundleRenderer.render
          ? COMPONENT_STATEFUL_NORMAL // 有状态组件
          : COMPONENT_FUNCTIONAL; // 函数式组件
    }
  }

  // 判断 children 类型
  // I.   没有，两种情况
  // II.  单个，两种情况
  // III. 多个
  // IV.  文本
  let childrenFlags = null;
  if (Array.isArray(children)) {
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
      children = normalizeVNodes(children); // 格式化为带 key 的 children
    }
  } else {
    if (!children) {
      // 没有 children
      childrenFlags = NO_CHILDREN;
    } else if (children._isVNode) {
      // 单个
      childrenFlags = SINGLE_VNODE;
    } else {
      // 文本
      childrenFlags = SINGLE_VNODE;
      children = createTextVNode(children); // 文本转文本节点
    }
  }

  const vnode = {
    _isVNode: true,
    flags,
    tag,
    data,
    children,
    childrenFlags,
    el: null
  };

  return vnode;
}

function createTextVNode(text) {
  return {
    _isVNode: true,
    flags: TEXT,
    tag: null,
    data: null,
    children: text,
    childrenFlags: NO_CHILDREN,
    el: null
  };
}

// 为 vnode.children 添加 key
function normalizeVNodes(children) {
  return children.map((child, index) => {
    child.key = child.key || `|${index}`;
    return child;
  });
}

export { h, Fragment, Portal };
