
## JavaScript Basic

```js
null == undefined
```

Eslint 的 `no-case-declarations` 规则，[一般的 switch 写法没有块级作用域](https://segmentfault.com/q/1010000012751143/a-1020000012751604)

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

一个真实的 DOM 元素，或者说 `el`，始终要被创建该元素的 `vnode` 引用。

`vnodes` 之间通过 `children` 表明层级关系，DOM 元素通过标签嵌套表明层级关系，`vnode` 和对应的 DOM 元素通过 `el` 属性连接。