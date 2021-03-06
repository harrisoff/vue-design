const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/;

// string/array/object 类型的 class 转为 string
export function formatElementClass(rawClass) {
  let classString;
  if (typeof rawClass === "string") {
    classString = rawClass;
  } else if (Array.isArray(rawClass)) {
    classString = rawClass
      .toString()
      .split(",")
      .join(" ");
  } else {
    const isObject = rawClass && typeof rawClass === "object";
    if (isObject) {
      const trueClasses = Object.keys(rawClass).filter(className => {
        return rawClass[className];
      });
      classString = trueClasses
        .toString()
        .split(",")
        .join(" ");
    }
  }
  return classString;
}

// mount() 和 patch() 里都会用到这个函数
// 比较了 style/class/onX/attribute/prop 五类
export function patchData(el, key, prevValue, nextValue, isSVG) {
  // mount 时 prevValue 为 null，不过 for in 不会报错
  switch (key) {
    case "style":
      // 对于 patch() 的过程，跟 patchElement() 类似
      // 先遍历新的 key，再遍历旧的有新的没的 key
      // +新
      for (const styleKey in nextValue) {
        el.style[styleKey] = nextValue[styleKey];
      }
      // -旧
      for (const styleKey in prevValue) {
        if (!nextValue.hasOwnProperty(styleKey)) {
          el.style[styleKey] = "";
        }
      }
      break;
    case "class": {
      // 1. 普通字符串
      // 2. 数组
      // 3. 对象
      const classString = formatElementClass(nextValue);
      // 对于 patch()，直接赋值就已经覆盖掉旧属性了
      if (isSVG) {
        el.setAttribute("class", classString);
      } else {
        el.className = classString;
      }
      break;
    }
    default:
      if (key.indexOf("on") === 0) {
        // key 为 onxxx，前两字母为 on 的判定为事件处理函数
        // prevValue/nextValue 可能的情况：
        // I. 新增回调，null -> function
        // II. 删掉了回调, function -> null
        // III. 修改回调，function -> function
        // 不管哪种情况，只要有旧的就删掉，只要有新的就加上
        if (prevValue) {
          el.removeEventListener(key.slice(2), prevValue);
        }
        if (nextValue) {
          el.addEventListener(key.slice(2), nextValue);
        }
      }
      // DOM prop，不能通过 setAttribute() 修改的属性
      else if (domPropsRE.test(key)) {
        el[key] = nextValue;
      }
      // 可以 setAttribute() 修改的属性
      else {
        el.setAttribute(key, nextValue);
      }
      break;
  }
}

// 删除
export function remove(vnode, container) {
  // 浏览器环境
  container.removeChild(vnode.el);
}
