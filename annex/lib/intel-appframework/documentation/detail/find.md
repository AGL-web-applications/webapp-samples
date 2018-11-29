$().find() takes in a selector and searches through the collection for matching elements.  The selector can be a CSS selector, App Framework collection or an element.  It returns a new App Framework collection.

Consider the following.  We want to find all elements with class "foo" that are nested inside the div "bar"

```html
<div id="bar">
	<ul>
		<li class="foo">Foo</li>
		<li>Bar</li>
	</ul>
	<span class="foo">Foo</span>
	<span>Bar</span>
</div>
```

Staring with the div "bar", we will find everything with class "foo"

```js
$("#bar").find(".foo"); 
```
