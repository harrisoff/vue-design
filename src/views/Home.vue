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
    // this.mounteFragment();
    this.mountStatefulComponent();
  },
  beforeUpdate() {},
  methods: {
    mountHTML() {
      const vnode = h(
        "div",
        {
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
        },
        [
          h("p", { style: { backgroundColor: "aqua" } }, "p标签"),
          h("span", {}, "span标签")
        ]
      );
      render(vnode, document.getElementById("home"));
    },
    mounteFragment() {
      const vnode = h(
        "div",
        {
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
        },
        h(Fragment, {}, [
          h("span", {}, "frag1"),
          h("span", {}, "frag2"),
          // FIXME: 界面上出现了一个 undefined
          h(Portal, { target: "#float" }, h("span", {}, "asdasd"))
        ])
      );
      render(vnode, document.getElementById("home"));
    },
    mountPortal() {},
    mountStatefulComponent() {
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
      const componentVNode = h(MyComponent);
      render(componentVNode, document.getElementById("home"));
    },
    mountFunctionalComponent() {}
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
