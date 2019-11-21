export interface VNodeData {
  style: object | null;
  class: object | string | string[] | null;
  type: string | null;
  // ...
}

export interface VNode {
  _isVNode: true; // 用于区分普通对象和 vnode
  el: Element | null; // 由自身生成的真实 DOM 元素
  flags: VNodeFlags; // vnode 类型
  tag: string | FunctionalComponent | ComponentClass | null;
  data: VNodeData | null;
  children: VNodeChildren;
  chilldFlags: ChildrenFlags;
}
