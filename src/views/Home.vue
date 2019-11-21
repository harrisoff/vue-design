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
    const vnode = h(
      // tag
      "div",
      // data
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
        h(Portal, { target: "#float" }, h("span", {}, "asdasd"))
      ])
    );
    console.log(vnode);
    render(vnode, document.getElementById("home"));
  },
  beforeUpdate() {},
  methods: {}
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
