import { VNodeFlags, ChildrenFlags } from "./vnode-types";
const {
  TEXT,
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
// nextVNode 是手动传递进来的
// prevVNode 是从 container 取的 container.vnode
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
  // patch 流程：
  // 1. nextVNode 继承 prevVNode 的 el
  // 2. 比较两者的 data/children
  else if (nextFlags & ELEMENT) {
    patchElement(prevVNode, nextVNode, container, isSVG);
  } else if (nextFlags & COMPONENT) {
    patchComponent(prevVNode, nextVNode, container);
  } else if (nextFlags & FRAGMENT) {
    patchFragment(prevVNode, nextVNode, container);
  } else if (nextFlags & PORTAL) {
    patchPortal(prevVNode, nextVNode);
  } else if (nextFlags & TEXT) {
    // **并不需要传递 container 参数**
    // 原因见 patchText()
    patchText(prevVNode, nextVNode, container);
  }
}

function replaceVNode(prevVNode, nextVNode, container) {
  // 删除旧的
  remove(prevVNode, container);
  // 如果是 prevVNode 是组件，那么需要触发一下 unmount() 钩子
  if (prevVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
    const instance = prevVNode.children;
    instance.unmounted && instance.unmounted();
  }
  // 渲染新的
  mount(nextVNode, container);
}

function patchElement(prevVNode, nextVNode, container, isSVG) {
  // 新旧标签不同时，也直接替换
  if (prevVNode.tag !== nextVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container);
  }
  // 标签相同时，比较才有意义
  // 新旧 vnode 的不同在于两个方面
  // I. data
  // II. children
  else {
    const el = prevVNode.el;
    // 新的 vnode 不会重复渲染，继续沿用旧的 el，只不过需要修改
    nextVNode.el = el;

    // I. 更新数据
    const prevData = prevVNode.data;
    const nextData = nextVNode.data;
    // i. 根据新的数据遍历
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
    // 其实就是把旧的删除
    if (prevData) {
      for (const key in prevData) {
        const prevValue = prevData[key];
        if (!nextData.hasOwnProperty(key)) {
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

    // II. 更新子节点
    patchChildren(prevVNode, nextVNode, el);
  }
}

function patchText(prevVNode, nextVNode, container) {
  // **文本节点 !== 文本**
  // **文本节点 !== 文本**
  // **文本节点 !== 文本**
  // 文本节点是节点，文本是其 nodeValue 属性
  // 比如，对于 <p>asd</p>，看上去只有一个 DOM 节点 p
  // 其实还有 p 内部的文本节点，其中的 asd **不是文本**，而**是文本节点**
  // 三者的关系是这样的：
  // container: { el/textNode: { nodeValue: '文本' } }
  // patchText() 替换的不是节点，而只是节点内部的文本
  const oldText = prevVNode.chlidren;
  const newText = nextVNode.children;
  if (oldText !== newText) {
    nextVNode.el = prevVNode.el; // 复制 el
    nextVNode.el.nodeValue = newText; // 替换 textNode 的文本
  }
}

function patchFragment(prevVNode, nextVNode, container) {
  // 类比一下 patchElement 的时候，先比较 vnode，再比较 vnode.children
  // 而 fragement，因为没有 vonde.data，相当于直接比较 vnode.chlidren

  // 不同的一点是，这里需要先 patch 再设置 el
  // 因为 patchElement 的时候是有 vnode.data 的
  // vnode.data 会在 mount 的时候渲染一次 el
  // 后面所有的 patch 都在 el 这个 container 上进行
  // 而 fragment 的 el 是先渲染 children，然后从里面选出来的
  // 所以需要先 patchChildren 生成 el
  // 然后再像 mountFragment 一样重新设置 nextVNode 的 el

  // 对比 children
  patchChildren(prevVNode, nextVNode, container);

  // 设置 el
  switch (prevVNode.childrenFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      nextVNode.el = nextVNode.children.el;
      break;
    case ChildrenFlags.NO_CHILDREN:
      nextVNode.el = prevVNode.el; // 空文本节点，直接用之前的
      break;
    default:
      nextVNode.el = nextVNode.children[0].el;
      break;
  }
}

function patchPortal(prevVNode, nextVNode) {
  // portal 与 fragement 类似，然后有以下区别：
  // portal 的 container 不是固定的
  // portal 的 el 是固定的，是一个用来占位的空文本节点

  // 一步一步来
  // 首先，container 仍然用旧的，只比较 children 的变化
  patchChildren(prevVNode, nextVNode);
  nextVNode.el = prevVNode.el; // 直接用旧的空文本节点

  // 这时，vnode 和 el 已经更新，但是 el 还在旧的 container 上
  // 如果 container 变了，就把 el 移动到新的上面去
  // tag 是 container 的 selector
  if (prevVNode.tag !== nextVNode.tag) {
    const container = document.querySelector(nextVNode.tag);
    switch (nextVNode.childrenFlags) {
      case NO_CHILDREN:
        // 新的 portal 没有 children，即被删除了
        break;
      case SINGLE_VNODE:
        // 关于 element.appencChild(child) 这个 API
        // 如果 child 已经在 DOM 中了，会**移动**到新的位置上
        container.appendChild(nextVNode.children.el);
        break;
      default:
        for (let i = 0; i < nextVNode.children.length; i++) {
          container.appendChild(nextVNode.children[i].el);
        }
        break;
    }
  }
}

function patchComponent(prevVNode, nextVNode, container) {
  // patch() 里已经判断过了，所以 prev/next 都是组件类型

  // 不过这两个 vnode 有两种可能性，分别对应代码执行到这里的两种场景
  // 1. 有可能是组件 vnode，当多次 render() 不同组件，在组件之间 patch 时
  // 2. 可能是组件返回的 realVNode，当单个组件更新内部数据时，由 instance._render() 触发的
  // p.s. 内部数据也包括嵌套的子组件，见 mount/component.js 的 _render()

  // 1. 外部 patch
  // 新旧 vnode 不是同一个组件，直接替换
  if (nextVNode.tag !== prevVNode.tag) {
    replaceVNode(prevVNode, nextVNode, container);
  }
  // 2. 同组件内部 patch
  else {
    // 2.1. 有状态组件
    if (nextVNode.flags & VNodeFlags.COMPONENT_STATEFUL_NORMAL) {
      // 执行到这里，只可能是由 instance._render() 触发的
      // 这时 prevVNode 和 nextVNode 都是 realVNode，而不是组件的 vnode
      // 不过没啥关系，因为用不到

      // instance 直接用之前的
      const instance = prevVNode.children;
      nextVNode.children = instance;
      // 更新 props
      instance.props = nextVNode && nextVNode.data && nextVNode.data.chlidProps;
      // 重新渲染
      instance._render();
    }
    // 2.2. 函数式组件
    else {
      //
    }
  }
}

function patchStatefulComponent() {
  // 有状态组件的更新有两种情况
  // 1. 主动更新，组件内部数据变化
  // 2. 被动更新，组件接受的数据变化
}

function patchFunctionalComponent() {}

// 判断 children 的个数，最后调用了 mount/patch/remove
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
    // 无 =>
    case NO_CHILDREN:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          console.log("0 -> 0");
          // 1. 无 => 无
          break;
        case SINGLE_VNODE:
          console.log("0 -> 1");
          // 2. 无 => 单个
          // 渲染新的
          mount(nextChildren, container);
          break;
        default:
          console.log("0 -> 2");
          // 3. 无 => 多个
          // 挨个渲染新的
          nextChildren.forEach(child => {
            mount(child, container);
          });
          break;
      }
      break;
    // 单个 =>
    case SINGLE_VNODE:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          console.log("1 -> 0");
          // 4. 单个 => 无
          // 移除
          // remove() 会移除 prevChildren.el
          // 单个 fragment 时没有影响，因为 prevChildren.el 确实引用了这个 DOM 节点
          // 但是多个 fragment 时引用的只是第一个 child，见后面 多个 => 无 的 case
          // 可以参考 ./mount.js 的 mountFragment() 实现
          remove(prevChildren, container);
          break;
        case SINGLE_VNODE:
          console.log("1 -> 1");
          // 5. 单个 => 单个
          // 就是比较两个 vnode，递归执行 patch()
          patch(prevChildren, nextChildren, container);
          break;
        default:
          console.log("1 -> 2");
          // 6. 单个 => 多个
          // 直接删掉旧的，然后渲染新的
          remove(prevChildren, container);
          nextChildren.forEach(child => {
            mount(child, container);
          });
          break;
      }
      break;
    // 多个 =>
    default:
      switch (nextChildrenFlags) {
        case NO_CHILDREN:
          console.log("2 -> 0");
          // 7. 多个 => 无
          // 全部删除
          // TODO: 当 prevChildren 是 fragment 时
          // prevChildren.el 只引用了这些 fragments 的第一个
          for (let index = 0; index < prevChildren.length; index += 1) {
            remove(prevChildren[index], container);
          }
          break;
        case SINGLE_VNODE:
          console.log("2 -> 1");
          // 8. 多个 => 单个
          // TODO: 当 prevChildren 是 fragment 时
          // 全部删除，再添加
          for (let index = 0; index < prevChildren.length; index += 1) {
            remove(prevChildren[index], container);
          }
          // TODO: 第三个参数 isSVG
          mount(nextChildren, container);
          break;
        // 跟上面一样，不能写为 case MULTIPLE_VNODES
        default:
          console.log("2 -> 2");
          // TODO: 9. 多个 => 多个
          // 多个 children 的 patch 才是 diff 算法
          // 即 DOM 树的比较
          /**
           * +===========================+
           * |    牛逼闪闪的 diff 算法    |
           * +===========================+
           */
          console.log(container);
          for (let index = 0; index < prevChildren.length; index += 1) {
            remove(prevChildren[index], container);
          }
          for (let index = 0; index < nextChildren.length; index += 1) {
            mount(nextChildren[index], container);
          }
          break;
      }
      break;
  }
}
