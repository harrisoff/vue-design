## ATTENTION

务必注意大小写。很多变量和常量名是类似的。

## JavaScript Basic

```js
null == undefined
```

Eslint 的 `no-case-declarations` 规则，[一般的 switch 写法没有块级作用域](https://segmentfault.com/q/1010000012751143/a-1020000012751604)

曾经我天真地以为 `Object.keys()` 是万能的，没想到还是 `for in` 更方便。   
当迭代对象为 `null` 的时候，`Object.keys()` 会报错，而 `for in` 不会。

## DOM Basic

DOM 的属性：
- `attribute`，指 HTML 标签的属性，如 `<body id="main"></body>`
- `property`，指 DOM 对象的属性，如 `const id = document.body.id`

如果是标准属性，那么可以通过 `element[attrName]` 获取，而自定义属性不可以。

但是 `element.setAttribute(name, value)` 使得添加的自定义属性可以通过 `element[attrName]` 的方式获取。

注意：
- `setAttribute()` 会把值转成字符串
- 有些属性一旦出现即认为是 `true`，删除后才为 `false`

因此，有些属性可以通过 `setAttribute()` 设置，而有些只能直接设置 `element[attrName] = 'value'`

## VNode

执行 `mount()` 的过程中，`vnode` 一定要引用由它创建的真实 DOM 元素。因为之后执行 `patch()` 时不会重复渲染，需要继续在这个 DOM 元素上操作。
