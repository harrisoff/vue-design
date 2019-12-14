// VNode

// 基本类型
const VNodeFlags = {
  // html
  ELEMENT_HTML: 1,
  // svg
  ELEMENT_SVG: 1 << 1,

  // 普通有状态组件
  COMPONENT_STATEFUL_NORMAL: 1 << 2,
  // 需要被 keep alive 的有状态组件
  COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
  // 已经被 keep alive 的有状态组件
  COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 4,
  // 函数式组件
  COMPONENT_FUNCTIONAL: 1 << 5,

  // 纯文本
  TEXT: 1 << 6, // 64
  // fragment
  FRAGMENT: 1 << 7,
  // portal
  PORTAL: 1 << 8
};
// 派生类型
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG;
VNodeFlags.COMPONENT_STATEFUL =
  VNodeFlags.COMPONENT_STATEFUL_NORMAL |
  VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE |
  VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE;
VNodeFlags.COMPONENT =
  VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL;

// VNode.children

// 基本类型
const ChildrenFlags = {
  UNKNOWN_CHILDREN: 0,
  NO_CHILDREN: 1,
  SINGLE_VNODE: 1 << 1, // 2
  KEYED_VNODES: 1 << 2, // 4
  NONE_KEYED_VNODES: 1 << 3 // 8
};
// 派生类型
ChildrenFlags.MULTIPLE_VNODES =
  ChildrenFlags.KEYED_VNODES | ChildrenFlags.NONE_KEYED_VNODES;

export { VNodeFlags, ChildrenFlags };
