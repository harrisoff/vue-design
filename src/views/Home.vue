<template>
  <div class="home" id="home">
    <div class="float" id="float"></div>
  </div>
</template>

<script>
/**
 * http://hcysun.me/vue-design/zh/
 *
 * TIPS: 代码注意大小写
 */

import { h, Fragment, Portal } from "../vdom/vnode";
import { render } from "../vdom/render";
import { Component } from "../vdom/Component";

export default {
  name: "home",
  components: {},
  filters: {},
  mixins: [],
  props: [],
  data() {
    return {};
  },
  computed: {},
  watch: {},
  beforeCreate() {},
  created() {},
  mounted() {
    // console.log("Home", this);

    // this.mountHTML();
    // this.mountFragment();
    // this.mountStatefulComponent();
    // this.mountFunctionalComponent();

    // this.patchReplace();
    this.patchEvent();
  },
  beforeUpdate() {},
  methods: {
    // mount
    mountHTML() {
      // I. 原始数据
      const tag = "div";
      const data = {
        style: {
          width: "120px",
          height: "20px",
          backgroundColor: "silver"
        },
        // class: "class-a class-b"
        // class: ["class-a", "class-b"]
        class: { "class-a": true, "class-b": false },
        onclick(e) {
          console.log(e);
        }
      };
      const children = [
        h("p", { style: { backgroundColor: "aqua" } }, "p标签"),
        h("span", {}, "span标签")
      ];
      // II. 格式化为 vnode
      const vnode = h(tag, data, children);
      // III. render，两种情况：
      // i. mount，首次渲染
      render(vnode, document.getElementById("home"));
      // ii. patch，修改旧元素
      setTimeout(() => {
        render(vnode, document.getElementById("home"));
      }, 2000);
    },
    mountFragment() {
      const tag = "div";
      const data = {
        style: {
          width: "120px",
          height: "20px",
          backgroundColor: "silver"
        },
        // class: "class-a class-b"
        // class: ["class-a", "class-b"]
        class: { "class-a": true, "class-b": false },
        onclick(e) {
          console.log(e);
        }
      };
      const children = h(Fragment, {}, [
        h("span", {}, "frag1"),
        h("span", {}, "frag2"),
        // FIXME: 界面上出现了一个 undefined
        h(Portal, { target: "#float" }, h("span", {}, "asdasd"))
      ]);

      const vnode = h(tag, data, children);

      render(vnode, document.getElementById("home"));
    },
    mountPortal() {
      // .
    },
    mountStatefulComponent() {
      // 组件的话，原始数据就是组件类/函数
      class MyComponent extends Component {
        render() {
          return h(
            "div",
            {
              style: {
                width: "100px",
                height: "100px"
              }
            },
            [h("span", {}, "component/div/span")]
          );
        }
      }
      // 格式化为 vnode
      const componentVNode = h(MyComponent);
      // 渲染
      render(componentVNode, document.getElementById("home"));
    },
    mountFunctionalComponent() {
      const functionalComponent = () => {
        return h("div", {}, [h("p", {}, "div/p"), h("span", {}, "div/span")]);
      };
      const functionalComponentVNode = h(functionalComponent);
      render(functionalComponentVNode, document.getElementById("home"));
    },
    // patch
    patchReplace() {
      const app = document.getElementById("home");

      const prevVNode = h("div", {}, "previous vnode");

      const functionalComponent = () => h("h1", {}, "next vnode");
      const nextVNode = functionalComponent();

      render(prevVNode, app);
      setTimeout(() => {
        render(nextVNode, app);
      }, 2000);
    },
    patchEvent() {
      const app = document.getElementById("home");

      const prevVNode = h(
        "div",
        {
          style: { color: "red", backgroundColor: "green", fontSize: "20px" },
          // 删除的事件
          onmouseover(e) {
            console.log("previous mouseover");
          },
          // 修改的事件
          onclick(e) {
            console.log("previous click");
          }
        },
        "previous vnode"
      );
      const nextVNode = h(
        "div",
        {
          style: { backgroundColor: "blue", fontSize: "12px", padding: "20px" },
          onclick(e) {
            console.log("next click");
          },
          // 新增的事件
          onmouseleave(e) {
            console.log("next mouseleave");
          }
        },
        "next vnode"
      );

      render(prevVNode, app);
      setTimeout(() => {
        render(nextVNode, app);
      }, 2000);
    },
    patchChildren() {}
  }
};
</script>

<style lang="scss">
.class-a {
  border: 1px solid blue;
}
.class-b {
  box-shadow: 2px 2px black;
}
.float {
  position: fixed;
  right: 0;
  width: 50px;
  height: 50px;
  background-color: silver;
}
</style>
