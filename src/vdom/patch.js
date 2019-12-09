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
export function patch(prevVNode, nextVNode, container) {
  const prevFlags = prevVNode.flags;
  const nextFlags = nextVNode.flags;

  // TODO: patch() 时的 isSVG 怎么处理？
  const isSVG = nextFlags & ELEMENT_SVG;

  if (prevFlags !== nextFlags) {
    // 新旧节点类型不同，直接替换
    replaceVNode(prevVNode, nextVNode, container);
  }
  // 节点类型相同时，patch 才有意义
  else if (nextFlags & ELEMENT) {
    patchElement(prevVNode, nextVNode, container, isSVG);
  } else if (nextFlags & COMPONENT) {
    patchComponent(prevVNode, nextVNode, container);
  } else if (nextFlags & FRAGMENT) {
    patchFragment(prevVNode, nextVNode, container);
  } else if (nextFlags & PORTAL) {
    patchPortal(prevVNode, nextVNode, container);
  }
}

function replaceVNode(prevVNode, nextVNode, container) {
  // 删除旧的
  remove(prevVNode, container);
  // 渲染新的
  mount(nextVNode, container);
}

function patchElement(prevVNode, nextVNode, container, isSVG) {
  // 新旧标签不同时，也直接替换
  if (prevVNode.tag !== nextVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container);
  }
  // 标签相同时，比较才有意义
  else {
    const el = prevVNode.el;
    // 新的 vnode 不会重复渲染，继续沿用旧的 el
    nextVNode.el = el;

    // 新旧 vnode 的不同在于两个方面
    // I. data
    // II. children

    // 更新数据
    const prevData = prevVNode.data;
    const nextData = nextVNode.data;
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
    // 新旧都有的 key 已经在 i 的遍历中被覆盖了，不需要再做什么操作了
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
    patchChildren(prevVNode, nextVNode, el);
  }
}

function patchFragment() {}

function patchPortal() {}

function patchComponent() {}

function patchChildren(prevVNode, nextVNode, container) {
  const prevChildren = prevVNode.children;
  const nextChildren = nextVNode.children;
  const prevChildrenFlags = prevVNode.childrenFlags;
  const nextChildrenFlags = nextVNode.childrenFlags;
  // prev 和 next 的 children 都有三种情况：无/一个/多个
  // 因此一共有九种情况需要考虑
  /**
   *      新 |
   * 旧      |   无   |  单个  |  多个
   * -----------------------------------
   *    无   | remove | mount | mount
   *   单个  | remove | patch | remove & mount
   *   多个  |
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
          mount(nextChildren, container);
          break;
        // 注意下面不能写成 case MULTIPLE_VNODES
        // 因为 MULTIPLE_VNODES(12) 是一个派生类型
        // 值来自 KEYED_VNODES(4)|NONE_KEYED_VNODES(8)，不是相等的关系
        default:
          // 3. 无 => 多个
          // 挨个渲染新的
          nextChildren.forEach(child => {
            mount(child, container);
          });
          break;
      }
      break;
    case SINGLE_VNODE:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          // 4. 单个 => 无
          // 移除
          // remove() 会移除 prevChildren.el
          // 那么需要考虑一下 fragment 的情况
          // I. **单个** fragment，即当前的 case 时
          // 没有影响，因为 prevChildren.el 确实引用了这个 DOM 节点
          // 可以参考 ./mount.js 的 mountFragment() 实现
          // II. 但是**多个** fragment 就需要额外操作了
          // 见后面 多个 => 无 的 case
          remove(prevChildren, container);
          break;
        case SINGLE_VNODE:
          // 5. 单个 => 单个
          // 就是比较两个 vnode，递归执行 patch()
          patch(prevChildren, nextChildren, container);
          break;
        default:
          // 6. 单个 => 多个
          // 直接删掉旧的，然后渲染新的
          remove(prevChildren, container);
          nextChildren.forEach(child => {
            mount(child, container);
          });
          break;
      }
      break;
    case MULTIPLE_VNODES:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          // 7. 多个 => 无
          // 全部删除
          // TODO: 当 prevChildren 是 fragment 时
          // prevChildren.el 只引用了这些 fragments 的第一个
          for (let index = 0; index < prevChildren.length; index += 1) {
            remove(prevChildren[index], container);
          }
          break;
        case SINGLE_VNODE:
          // TODO: 8. 多个 => 单个
          // 全部删除，再添加
          for (let index = 0; index < prevChildren.length; index += 1) {
            remove(prevChildren[index], container);
          }
          // TODO: 第三个参数 isSVG
          mount(nextChildren, container);
          break;
        // 跟上面一样，不能写为 case MULTIPLE_VNODES
        default:
          // TODO: 9. 多个 => 多个
          // FIXME: 暂且写为全部删除，再挨个添加
          /**
           * +===========================+
           * |    牛逼闪闪的 diff 算法    |
           * +===========================+
           */
          for (let index = 0; index < prevChildren.length; index += 1) {
            remove(prevChildren[index], container);
          }
          for (let index = 0; index < nextChildren.length; index += 1) {
            mount(nextChildren[index], container);
          }
          break;
      }
      break;
    default:
      break;
  }
}
