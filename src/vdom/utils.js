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
    // TODO: 判断 object 类型更完善的逻辑
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

// 虽然叫 patchData，实际上
// I. mount() 和 patch() 都会用到
// II.只是比较 vnodeData 里其中一项而已
// 对于 patch() 的过程
// I. 遍历新 vnodeData 时，prevValue 可能是空的，nextValue 一定有值
// II. 遍历旧 vnodeData 时，prevValue 可能有值，nextValue 一定为空
export function patchData(el, key, prevValue, nextValue, isSVG) {
  // 添加新的 vnodeData
  switch (key) {
    case "style":
      // 对于 patch() 的过程，不能只仅仅添加新的，达不到覆盖的效果
      // 还需要把旧的删除
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
      if (key[0] === "o" && key[1] === "n") {
        // key 为 onX，前两字母为 on 的判定为事件处理函数
        // prevValue/nextValue 可能的情况：
        // I. 新增回调，null/function
        // II. 删掉了回调, function/null
        // III. 修改回调，function/function
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
