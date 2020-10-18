import { mount } from "./mount";
import { patch } from "./patch";

// +================================================
// |                关于 diff
// | 通常会用画图的方式帮助理解，比如画新旧两个集合对照
// | 但是注意，实际并不同时存在新旧两个集合
// | 只存在一个不断变化的旧集合
// | 元素不是在两个集合间移动
// | 而是以新集合为目标，对旧集合做修改
// +================================================

// react 使用的 diff 算法
function reactDiff(prevChildren, nextChildren, container) {
  // 1. 对于 key 相同的元素是可以复用的
  // 首先是 patch，然后就是位置可能变了
  // 那么是移动后移了的元素，还是移动前移了的元素？
  // 现在制定以下规则：
  // 不操作位置变得靠前了的元素，只操作位置变得靠后了的元素
  // 2. 不能复用的元素，无非就是新增的或删掉的
  // 只要简单地挂载或删除即可

  // 要实现这种只操作靠前了的元素的算法
  // 不能直接比较一个元素在新旧集合中的索引大小
  // **新旧索引的值相同并不代表元素不需要移动**
  // 比如元素 e 前面删掉了一个元素并拿 e 后面的一个元素填坑
  // 因为向前移动是不需要操作的，所以 e 要执行向后的移动
  // 不如说，正因为 e 执行了向后移动的操作，才使得索引值没有变化

  // 算法简介
  // p.s. 下面说的*元素*，特指 key 相同、可复用的元素
  // 虽然规定**移动的是那些跑到后面去了的元素**
  // 但是遍历的是新集合，所以先遇到的元素是向前移动了的那一些
  // 而一个元素是否向后移动，是以最近的一个向前移动的元素为参考的
  // 所以需要保存**最近的向前移动的元素**的索引 lastIndex
  // 在遍历每个元素时比较其索引与 lastIndex 的大小
  // 就可以判断当前元素是不是需要移动了
  let lastIndex = 0;
  // 遍历新的元素，可以：
  // 1. 找到可复用元素并 patch
  // 2. 找到新增加的元素并 mount
  for (let i = 0; i < nextChildren.length; i++) {
    const nextVNode = nextChildren[i];
    let found = false;
    for (let j = 0; j < prevChildren.length; j++) {
      const prevVNode = prevChildren[j];
      // 找到该元素在旧 chlidren 中的位置
      if (nextVNode.key === prevVNode.key) {
        found = true;
        // 先 patch 一下
        patch(prevVNode, nextVNode, container);
        // 再判断是否要移动
        if (j >= lastIndex) {
          lastIndex = j;
        } else {
          // 整体逻辑是遍历新集合，根据新集合的顺序操作原集合
          // 或者说，按照新集合的顺序，从原集合中找到元素看怎么移动才能填坑
          // 所以当需要移动的时候，只有一种情况
          // 就是把旧集合的元素移动到当前的位置
          // 当前位置，也就是前一个元素的后面
          // 不过 DOM API 只有一个 insertBefore
          // 所以还需要先找到前一个元素的后一个兄弟节点
          const refNode = nextChildren[i - 1].el.nextSibling;
          container.insertBefore(prevVNode.el, refNode);
          // TODO: 如果 nextChildren[i - 1] 是最后一个节点，那么 nextSibling 为 null
        }
        break;
      }
    }
    // 旧集合没有对应节点，新增的节点，挂载
    if (!found) {
      // 挂载也要按照基本法🐸
      // mount 的基本实现是，直接把 vnode 生成的 el 添加到 container 结尾
      // 但是这里要求添加到指定元素的后面
      // 考虑到用的是 insertBefore，应该说是添加到指定元素（的 nextSibling）的前面
      const refNode =
        i - 1 < 0 ? prevChildren[0].el : nextChildren[i - 1].el.nextSibling;
      mount(nextVNode, container, false, refNode);
    }
  }
  // 还需要再遍历一次 prevChildren
  // 找到已删除的元素并 remove
  for (let i = 0; i < prevChildren.length; i++) {
    const prevVNode = prevChildren[i];
    const keep = nextChildren.find(
      nextVNode => nextVNode.key === prevVNode.key
    );
    // 新集合中没有
    if (!keep) {
      container.removeChild(prevVNode.el);
    }
  }
  // TODO: diff 完之后，prevChildren 怎么样了？
  // 还存在被引用吗？不会有性能问题吗？
}

// 双端比较
function twoWayDiff(prevChildren, nextChildren, container) {
  let oldStartIdx = 0;
  let oldEndIdx = prevChildren.length - 1;
  let newStartIdx = 0;
  let newEndIdx = nextChildren.length - 1;
  // 首位各有一个指针，只操作该区间内的首位两个元素
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    const oldStartVNode = prevChildren[oldStartIdx];
    const oldEndVNode = prevChildren[oldEndIdx];
    const newStartVNode = nextChildren[newStartIdx];
    const newEndVNode = nextChildren[newEndIdx];
    // 1. 先判断两种不需要移动的情况
    // 1.1. 旧头 -> 新头
    if (oldStartVNode.key === newStartVNode.key) {
      patch(oldStartVNode, newStartVNode, container);
      oldStartIdx++;
      newStartIdx++;
    }
    // 1.2. 旧尾 -> 新尾
    else if (oldEndVNode.key === newEndVNode.key) {
      patch(oldEndVNode, newEndVNode, container);
      oldEndIdx--;
      newEndIdx--;
    }
    // 2. 再判断需要移动的情况
    // 2.1. 旧头 -> 新尾
    else if (oldStartVNode.key === newEndVNode.key) {
      oldStartIdx++;
      newEndIdx--;
    }
    // 2.2. 旧尾 -> 新头
    else if (oldEndVNode.key === newStartVNode.key) {
      // patch
      // oldEndVNode 移动到首位
      oldEndIdx--;
      newStartIdx++;
    }
    // 无匹配
    else {
      //
    }
  }
}
