import { VNodeFlags, ChildrenFlags } from "./vnode-types";
const {
  TEXT,
  FRAGMENT,
  PORTAL,
  ELEMENT,
  COMPONENT,
  COMPONENT_STATEFUL_NORMAL,
  COMPONENT_FUNCTIONAL,
  ELEMENT_SVG
} = VNodeFlags;
const { NO_CHILDREN, SINGLE_VNODE, MULTIPLE_VNODES } = ChildrenFlags;

import { mount } from "./mount";

// 更新
export function patch(prevVNode, vnode, container) {
  const prevFlags = prevVNode.Flags;
  const nextFlags = vnode.flags;

  if (prevFlags !== nextFlags) {
    // 新旧节点类型不同，直接替换
    replaceVNode(prevVNode, vnode, container);
  }
  // 节点类型相同时，patch 才有意义
  else if (nextFlags & ELEMENT) {
    patchElement(prevVNode, vnode, container);
  } else if (nextFlags & COMPONENT) {
    patchComponent(prevVNode, vnode, container);
  } else if (nextFlags & FRAGMENT) {
    patchFragment(prevVNode, vnode, container);
  } else if (nextFlags & PORTAL) {
    patchPortal(prevVNode, vnode, container);
  }
}

function replaceVNode(prevVNode, vnode, container) {
  container.removeChild(prevVNode.el);
  mount(vnode, container);
}

function patchElement(prevVNode, vnode, container) {
  // 新旧标签不同时，也直接替换
  if (prevVNode.tag !== vnode.tag) {
    replaceVNode(prevVNode, vnode, container);
  }
  // 标签相同时，比较才有意义
  else {
    const el = prevVNode.el;
    // 新的 vnode 不会重复渲染，继续操作旧的 el
    vnode.el = el;

    // 新旧 vnode 的不同在于两个方面
    // I. vnode.data
    const prevData = prevVNode.data;
    const nextData = vnode.data;
    if (nextData) {
      // 像 mount 的时候一样比较根据 key 执行对应的操作
      Object.keys(nextData).forEach(key => {
        const prevValue = prevData[key];
        const nextValue = nextData[key];
        switch (key) {
          case "style":
            // 遍历 && 应用新样式
            Object.keys(nextValue).forEach(styleKey => {
              const style = nextValue[styleKey];
              el.style[key] = style;
            });
            // 遍历 && 判断 && 删除旧样式
            Object.keys(prevValue).forEach(styleKey => {
              if (!nextValue.hasOwnProperty(styleKey)) {
                // 新的 vnode.data.style 里已经没有这个样式了，删除
                el.style[styleKey] = "";
              }
            });
            break;
          default:
            break;
        }
      });
    }
    // II. vnode.children
  }
}

function patchFragment() {}

function patchPortal() {}

function patchComponent() {}
