import { h } from "./vnode";

// 基类
export class Component {
  render() {
    throw "未实现 render()";
  }
}

// 组件类
export class MyComponent extends Component {
  render() {
    return h("div");
  }
}
