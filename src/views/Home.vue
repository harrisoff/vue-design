<template>
  <div class="home" id="home">
    <div class="float" id="float"></div>
    <div id="div1"></div>
    <div id="div2"></div>
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
    // this.patchEvent();
    // this.patchChildren();
    // this.patchFragment();
    // this.patchPortal();
    // this.patchStatefulComponent();
    this.patchComponent(); // 两个组件先后渲染
    // this.patchComponentData(); // 单个组件内部数据变化
    // this.patchComponentNest(); // 嵌套组件
  },
  beforeUpdate() {},
  methods: {
    // ===== mount =====
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
        // FIXME: 不支持多个 children 里有纯文本节点
        // "asdsadasdas",
        h("p", { style: { backgroundColor: "aqua" } }, "p标签"),
        h("span", {}, "span标签")
      ];
      // II. 格式化为 vnode
      const vnode = h(tag, data, children);
      console.log(vnode);
      // III. render
      render(vnode, document.getElementById("home"));
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
      const portal = h(Portal, { target: "#float" }, h("span", {}, "asdasd"));
      const children = h(Fragment, {}, [
        h("span", {}, "frag1"),
        h("span", {}, "frag2"),
        portal
      ]);

      const vnode = h(tag, data, children);

      render(vnode, document.getElementById("home"));
    },
    mountPortal() {
      // .
    },
    mountStatefulComponent() {
      // 组件的话，原始数据就是组件类/函数
      const MyComponent = this.createStatefulComponent();
      // 格式化为 vnode
      const componentVNode = h(MyComponent);
      // 渲染
      render(componentVNode, document.getElementById("home"));
    },
    mountFunctionalComponent() {
      const functionalComponent = this.createFunctionalComponent();
      const functionalComponentVNode = h(functionalComponent);
      render(functionalComponentVNode, document.getElementById("home"));
    },
    // ===== patch =====
    patchReplace() {
      const app = document.getElementById("home");

      const prevVNode = h("div", {}, "previous vnode");

      const functionalComponent = () => h("h1", {}, "next vnode");
      const nextVNode = functionalComponent();

      this.renderTwice(prevVNode, nextVNode, app);
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

      this.renderTwice(prevVNode, nextVNode, app);
    },
    patchChildren() {
      const app = document.getElementById("home");

      const functionalComponent = this.createFunctionalComponent();
      const statefulComponent = this.createStatefulComponent();

      // TODO: 缺少 fragment 和 portal 的测试用例
      let prevVNode = null;
      let nextVNode = null;
      // 无 -> 无
      prevVNode = h("div", {
        style: { border: "1px solid black", width: "100px", height: "50px" }
      });
      nextVNode = h("div", {
        style: { border: "1px solid red", width: "100px", height: "50px" }
      });

      // 无 -> 单个
      prevVNode = h("div", {
        style: { border: "1px solid black" }
      });
      nextVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        // h("p", {}, "children p") // 单个普通元素
        // h(Portal, { target: "#float" }, h("p", {}, "children portal p")) // 单个 Portal
        h(functionalComponent) // 单个函数式组件
        // h(statefulComponent) // 单个有状态组件
      );

      // 无 -> 多个
      prevVNode = h("div", {
        style: { border: "1px solid black" }
      });
      nextVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        [h("p", {}, "children p"), h(statefulComponent), h(functionalComponent)]
      );

      // 单个 -> 无
      prevVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        h("p", {}, "children p")
      );
      nextVNode = h("div", {
        style: { border: "1px solid black" }
      });

      // 单个 -> 单个
      prevVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        // h("p", {}, "children p")
        "旧文本"
      );
      nextVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        // h("span", {}, "children span")
        "新文本miloscardio"
      );

      // 单个 -> 多个
      prevVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        h("p", {}, "children p")
      );
      nextVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        [
          h("span", {}, "children span"),
          h("p", {}, "children p"),
          h("h1", {}, "children h1")
        ]
      );
      console.log(prevVNode, nextVNode);
      this.renderTwice(prevVNode, nextVNode, app);

      // 多个 -> 无
      prevVNode = h(
        "div",
        {
          style: { border: "1px solid black" }
        },
        [
          h("span", {}, "children span"),
          h("p", {}, "children p"),
          h("h1", {}, "children h1")
        ]
      );
      nextVNode = h("div", {
        style: { border: "1px solid black" }
      });

      // 多个 -> 单个

      // 多个 -> 多个
    },
    patchFragment() {
      const app = document.getElementById("home");
      const prevVNode = h(Fragment, null, [
        h("p", { style: { color: "red" } }, "previous p1"),
        h("p", { style: { color: "blue" } }, "previous p2")
      ]);
      const nextVNode = h(Fragment, null, [
        h("p", { style: { color: "green" } }, "later p1"),
        h("p", { style: { color: "pink" } }, "later p2")
      ]);
      console.log(prevVNode, nextVNode);
      this.renderTwice(prevVNode, nextVNode, app);
    },
    patchPortal() {
      const app = document.getElementById("home");
      const prevVNode = h(
        Portal,
        { target: "#div1" },
        h("p", { style: { color: "red" } }, "previous p1")
      );
      const nextVNode = h(
        Portal,
        { target: "#div2" },
        h("p", { style: { color: "green" } }, "later p1")
      );
      this.renderTwice(prevVNode, nextVNode, app);
    },
    patchStatefulComponent() {
      const AutoUpdatedComponent = this.createAutoUpdatedComponent();
      const componentVNode = h(AutoUpdatedComponent);
      render(componentVNode, document.getElementById("home"));
    },
    patchComponent() {
      const normalVNode = h("div", {}, "JUST A DIV");
      class Component1 extends Component {
        render() {
          return h("div", null, "component ONE");
        }
      }
      class Component2 extends Component {
        render() {
          return h("div", null, "component TWOOOOO");
        }
      }
      this.renderTwice(
        normalVNode,
        // h(Component2),
        h(Component1),
        document.getElementById("home")
      );
    },
    patchComponentData() {
      class Parent extends Component {
        chlidProps = {
          text: "child text from parent"
        };
        data = {
          text: "init data"
        };

        mounted() {
          setTimeout(() => {
            this.data.text = "AFTER DATA!!!!!!";
            this._render();
          }, 2000);
        }

        render() {
          return h("div", null, this.data.text);
        }
      }
      const parentVNode = h(Parent);
      render(parentVNode, document.getElementById("home"));
    },
    patchComponentNest() {
      class Child extends Component {
        render() {
          return h("div", { style: { color: "blue" } }, this.props.text);
        }
      }
      class Parent extends Component {
        chlidProps = {
          text: "child text from parent"
        };

        mounted() {
          setTimeout(() => {
            this.chlidProps.text = "CHILD TEXT FROM PARENT";
            this._render();
          }, 2000);
        }

        render() {
          return h(Child, {
            chlidProps: this.chlidProps
          });
        }
      }
      const parentVNode = h(Parent);
      render(parentVNode, document.getElementById("home"));
    },
    // utils
    renderTwice(prevVNode, nextVNode, container) {
      // console.log(prevVNode, nextVNode);
      render(prevVNode, container);
      setTimeout(() => {
        render(nextVNode, container);
      }, 2000);
    },
    // 组件的话，原始数据就是组件类/函数
    createStatefulComponent() {
      return class MyComponent extends Component {
        render() {
          return h(
            "div",
            {
              style: {
                width: "100px",
                height: "100px"
              }
            },
            [
              h(
                "span",
                { style: { backgroundColor: "blue", color: "white" } },
                "statefulComponent/div/span"
              )
            ]
          );
        }
      };
    },
    createFunctionalComponent() {
      return () => {
        return h(
          "div",
          { style: { backgroundColor: "green", color: "white" } },
          [h("p", {}, "functionalComponent/div/p"), h("span", {}, "div/span")]
        );
      };
    },
    createAutoUpdatedComponent() {
      return class AutoUpdatedComponent extends Component {
        state = {
          text: "init text"
        };

        mounted() {
          setTimeout(() => {
            this.state.text = "after text";
            this._render();
          }, 2000);
        }

        render() {
          return h("div", null, this.state.text);
        }
      };
    }
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
#div1 {
  width: 400px;
  height: 200px;
  border: 1px solid green;
}
#div2 {
  width: 400px;
  height: 200px;
  border: 1px solid red;
}
</style>
