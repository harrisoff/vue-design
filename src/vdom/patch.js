import { VNodeFlags, ChildrenFlags } from "./vnode-types";
const {
  // TEXT,
  FRAGMENT,
  PORTAL,
  ELEMENT,
  COMPONENT,
  // COMPONENT_STATEFUL_NORMAL,
  // COMPONENT_FUNCTIONAL,
  ELEMENT_SVG
} = VNodeFlags;
const { NO_CHILDREN, SINGLE_VNODE, MULTIPLE_VNODES } = ChildrenFlags;

import { patchData, remove } from "./utils";
import { mount } from "./mount";

// 更新
export function patch(prevVNode, vnode, container) {
  const prevFlags = prevVNode.Flags;
  const nextFlags = vnode.flags;

  // TODO: patch() 时的 isSVG 怎么处理？
  const isSVG = nextFlags & ELEMENT_SVG;

  if (prevFlags !== nextFlags) {
    // 新旧节点类型不同，直接替换
    replaceVNode(prevVNode, vnode, container);
  }
  // 节点类型相同时，patch 才有意义
  else if (nextFlags & ELEMENT) {
    patchElement(prevVNode, vnode, container, isSVG);
  } else if (nextFlags & COMPONENT) {
    patchComponent(prevVNode, vnode, container);
  } else if (nextFlags & FRAGMENT) {
    patchFragment(prevVNode, vnode, container);
  } else if (nextFlags & PORTAL) {
    patchPortal(prevVNode, vnode, container);
  }
}

function replaceVNode(prevVNode, vnode, container) {
  // 删除旧的
  remove(prevVNode, container);
  // 渲染新的
  mount(vnode, container);
}

function patchElement(prevVNode, vnode, container, isSVG) {
  // 新旧标签不同时，也直接替换
  if (prevVNode.tag !== vnode.tag) {
    replaceVNode(prevVNode, vnode, container);
  }
  // 标签相同时，比较才有意义
  else {
    const el = prevVNode.el;
    // 新的 vnode 不会重复渲染，继续沿用旧的 el
    vnode.el = el;

    // 新旧 vnode 的不同在于两个方面
    // I. data
    // II. children

    // 更新数据
    const prevData = prevVNode.data;
    const nextData = vnode.data;
    // i. 添加新数据
    // 这里遍历新的 vnodeData 的 key
    // 所以落下了一些*旧的有但是新的没有*的 key
    if (nextData) {
      for (const key in nextData) {
        const prevValue = prevData[key];
        const nextValue = nextData[key];
        // 像 mount 的时候一样，根据 key 执行对应的操作
        patchData(el, key, prevValue, nextValue, isSVG);
      }
    }
    // ii. 删除旧数据
    // 这里再遍历旧的 vnodeData
    // 挑出上面落下的*旧的有新的没有*的 key，再执行 patchData()
    if (prevData) {
      for (const key in prevData) {
        const prevValue = prevData[key];
        if (!prevData.hasOwnProperty(key)) {
          patchData(
            el,
            key,
            prevValue, // 有旧的值
            null, // 但是莫得新值
            isSVG
          );
        }
      }
    }

    // 更新子节点
    patchChildren(prevVNode.children, vnode.children, el);
  }
}

function patchFragment() {}

function patchPortal() {}

function patchComponent() {}

function patchChildren(prevChildren, children, container) {
  const prevChildrenFlags = prevChildren.ChildrenFlags;
  const nextChildrenFlags = children.ChildrenFlags;
  // prev 和 next 的 children 都有三种情况：无/一个/多个
  // 因此一共有九种情况需要考虑
  /**
   *      新 |
   * 旧      |   无   |  单个  |  多个
   * -----------------------------------
   *    无   | remove |
   *   单个  | remove |
   *   多个  | remove |
   */
  switch (prevChildrenFlags) {
    case NO_CHILDREN:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          // 1. 无 => 无
          break;
        case SINGLE_VNODE:
          // 2. 无 => 单个
          // 渲染新的
          mount(children, container);
          break;
        case MULTIPLE_VNODES:
          // 3. 无 => 多个
          // 挨个渲染新的
          children.forEach(child => {
            mount(child, container);
          });
          break;
        default:
          break;
      }
      break;
    case SINGLE_VNODE:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          // 4. 单个 => 无
          // 移除
          // TODO: 要额外考虑 fragment 的情况
          remove(prevChildren, container);
          break;
        case SINGLE_VNODE:
          // 5. 单个 => 单个
          // 就是比较两个 vnode，递归执行 patch()
          patch(prevChildren, children, container);
          break;
        case MULTIPLE_VNODES:
          // 6. 单个 => 多个
          // 直接删掉旧的，然后渲染新的
          break;
        default:
          break;
      }
      break;
    case MULTIPLE_VNODES:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          // 7. 多个 => 无
          break;
        case SINGLE_VNODE:
          // 8. 多个 => 单个
          break;
        case MULTIPLE_VNODES:
          // 9. 多个 => 多个
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
}
