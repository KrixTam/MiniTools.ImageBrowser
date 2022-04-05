# MiniTools.ImageBrowser

图片浏览器，看看尺寸，取取颜色，随便用用

## 如何使用

在*head*中增加相关引用
```html
<link rel="stylesheet" href="./niib.css">
<script type="text/javascript" src="./niib.js"></script>
```
或者
```html
<link rel="stylesheet" href="./niib.min.css">
<script type="text/javascript" src="./niib.min.js"></script>
```
然后选择一个*div*作为容器，通过下面的js代码生成**ImageBrowser**（下面例子中*ic*为容器*div*的*id*）
```javascript
var ib = new MTImageBrowser('ic');
```

## 浏览图片

点击"打开"按钮，选择要打开的图片文件，**ImageBrowser**将根据图片尺寸选择合适的缩放比例进行投影。

![浏览图片](http://krixtam.com/img/language/mt/ib/v0.0.1/open.png)

图片右下角为图片的尺寸大小，标尺位于上侧和左侧；鼠标在图片上滑动时，右上角会显示鼠标所在的坐标以及该位置像素的颜色。

## 添加导航线

打开图片后，菜单栏的*checkbox*默认不打钩的情况下，在图片上单击鼠标即可添加导航线。

![添加导航线](http://krixtam.com/img/language/mt/ib/v0.0.1/guideline.png)

## 取色

当菜单栏的*checkbox*打钩时，在图片上单击鼠标不会添加导航线，而是复制鼠标所在位置像素的颜色。

![取色](http://krixtam.com/img/language/mt/ib/v0.0.1/get_color.png)

## 缩放

图片加载后，**ImageBrowser**会根据其尺寸给出最小可缩放比例，你可以通过调整其缩放比例进行图像缩放（如果有导航线的话，也会保留一起进行缩放处理）

![缩放](http://krixtam.com/img/language/mt/ib/v0.0.1/range.png)

## 重置

点击”重置“按钮后，图片将重新加载，如果之前有设置过导航线的话，重新加载时会消除之前的导航线。

## 保存

点击”保存"按钮，将缩放的图像（包含标尺和导航线）下载保存为文件。
