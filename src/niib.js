"use strict";

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "RGB值异常";
    return ((r << 16) | (g << 8) | b).toString(16);
};

function fallbackCopyTextToClipboard (text) {
    var textArea = document.createElement("textarea");
    var result = false;
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        result = successful ? true : false;
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
    return result;
};

function copyTextToClipboard (text) {
    if (!navigator.clipboard) {
        return fallbackCopyTextToClipboard(text);
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
        return true;
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
        return false;
    });
};

var MTLogger = function (desc) {
    var self = this;
    self._desc = desc;
};

MTLogger.prototype.info = function (err_id) {
    var self = this;
    if (err_id in self._desc) {
        console.log("[" + err_id + "] " + self._desc[err_id]["desc"]);
    };
};

MTLogger.prototype.warn = function (err_id) {
    var self = this;
    if (err_id in self._desc) {
        console.log("[" + err_id + "] " + self._desc[err_id]["desc"]);
        alert(self._desc[err_id]["msg"]);
    };
};

var err_codes = {
    "0001": {
        "desc": "此浏览器不支持“FileReader”，建议使用最新版本的浏览器浏览本网页。",
        "msg": "暂不支持此浏览器，请使用最新版本的浏览器浏览本网页。"
    },
    "0002": {
        "desc": "input元素为“file类型时，此浏览器不支持`files`属性，建议使用最新版本的浏览器浏览本网页。",
        "msg": "暂不支持此浏览器，请使用最新版本的浏览器浏览本网页。"
    },
    "0003": {
        "desc": "未选择要加载的文件；请选择需要加载的文件，然后再点击“加载”按钮。",
        "msg": "未选择要加载的文件，请先选择需要加载的文件。"
    },
    "0004": {
        "desc": "此浏览器不支持“URL”，建议使用最新版本的浏览器浏览本网页。",
        "msg": "暂不支持此浏览器，请使用最新版本的浏览器浏览本网页。"
    },
};

var niibLogger = new MTLogger(err_codes);

function generateButton (container, label, callback) {
    var button = document.createElement("button");
    button.innerHTML = label;
    button.onclick = callback;
    container.appendChild(button);
    return button;
};

function generateLabel (container, default_label, class_name) {
    var label = document.createElement("Label");
    label.innerHTML = default_label;
    label.className = class_name;
    container.appendChild(label);
    return label;
};

var MTImageBrowser = function (container_id, options) {
    var self = this;
    var container = document.getElementById(container_id);
    var canvas = document.createElement("canvas");
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.visibility = "hidden";
    input.onchange = function () {
        self.load();
    };
    var menus = document.createElement("div");
    menus.className = "mtib_menu";
    var button_01 = generateButton(menus, "打开", function () {input.click();});
    var button_02 = generateButton(menus, "清除", function () {self.clear();});
    var button_03 = generateButton(menus, "重载", function () {
        self.clear();
        self.load();
    });
    var color_div = document.createElement("div");
    color_div.className = "mtib_color_block";
    color_div.innerHTML = "#FFFFFF"
    menus.appendChild(color_div);
    var label_x = generateLabel(menus, "x: ", "mtib_pos_label");
    var label_y = generateLabel(menus, "y: ", "mtib_pos_label");
    canvas.onmousemove = function(e) {
        if (self._loaded) {
            var zero = self._rulerWidth + self._rulerGap;
            var rect = canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var x_pos = x - zero;
            var y_pos = y - zero;
            if (x_pos >= 0 && y_pos >= 0) {
                label_x.innerHTML = "x: " + x_pos;
                label_y.innerHTML = "y: " + y_pos;
                var p = self._ctx.getImageData(x * self._pixelRatio, y * self._pixelRatio, 1, 1).data;
                var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
                color_div.style.backgroundColor = hex;
                var hex_invert = "#" + ("000000" + rgbToHex(255 - p[0], 255 - p[1], 255 - p[2])).slice(-6);
                color_div.style.color = hex_invert;
                color_div.innerHTML = hex;
                console.log(hex);
            }
        };
    };
    container.appendChild(menus);
    container.appendChild(canvas);
    container.appendChild(input);
    self._rulerWidth = 10;
    self._rulerGap = 5;
    self._container = container;
    self._canvas = canvas;
    self._input = input;
    self._pixelRatio = window.devicePixelRatio;
    self._ctx = self._canvas.getContext("2d");
    self._loaded = false;
    self.setSize(100, 50);
};

MTImageBrowser.prototype.setSize = function (width, height) {
    var self = this;
    var menu_min_width = 460;
    var container_width = (width > menu_min_width) ? width : menu_min_width;
    var container_height = height + 40;
    self._container.style.width = container_width + "px";
    self._container.style.height = container_height + "px";
    self._canvas.style.width = width + "px";
    self._canvas.style.height = height + "px";
};

// 加载图片
MTImageBrowser.prototype.load = function () {
    var self = this;
    if (typeof window.FileReader !== "function") {
        niibLogger.warn("0001");
        return;
    } else if (!self._input.files) {
        niibLogger.warn("0002");
    } else if (!self._input.files[0]) {
        niibLogger.warn("0003");
    } else {
        var url = window.URL || window.webkitURL;
        if (url) {
            if (self._loaded) {
                self.clear();
            };
            var img = new Image(), f = self._input.files[0], src = url.createObjectURL(f);
            img.src = src;
            img.onload = function() {
                // 根据图片尺寸调整画布尺寸，并根据屏幕缩放比恢复画布清晰度
                var width = img.width + self._rulerWidth + self._rulerGap, height = img.height + self._rulerWidth + self._rulerGap;
                self._canvas.width = width * self._pixelRatio;
                self._canvas.height = height * self._pixelRatio;
                self.setSize(width, height);
                self._ctx.scale(self._pixelRatio, self._pixelRatio);
                self._ctx.drawImage(img, self._rulerWidth + self._rulerGap, self._rulerWidth + self._rulerGap);
                url.revokeObjectURL(src);
                self._loaded = true;
                // 绘制标尺
                self._ctx.lineWidth= 1;
                self._ctx.strokeStyle = "#000";
                self._ctx.font = "8px Arial";
                // 水平标尺
                self.drawTickMarks("H", false, img.width, 5);
                self.drawTickMarks("H", true, img.width, 50);
                // 垂直标尺
                self.drawTickMarks("V", false, img.width, 5);
                self.drawTickMarks("V", true, img.width, 50);
            };
        } else {
            niibLogger.warn("0004");
        };
    };
};

// 清空画布
MTImageBrowser.prototype.clear = function () {
    var self = this;
    self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);
    self._loaded = false;
};

// 画刻度线
MTImageBrowser.prototype.drawTickMarks = function (direction, longer, width, spacing) {
    var self = this, interval = width / spacing, pos = 5;
    if (longer) {
        pos = 0;
        self.drawTickMarkLabels(direction, width, spacing);
    };
    if ("H" == direction) {
        for (var i = 0; i <= interval; i++) {
            self._ctx.beginPath();
            self._ctx.moveTo(self._rulerWidth + self._rulerGap + i * spacing, self._rulerWidth + self._rulerGap);
            self._ctx.lineTo(self._rulerWidth + self._rulerGap + i * spacing, pos + self._rulerGap);
            self._ctx.stroke();
        };
    } else if ("V" == direction) {
        for (var i = 0; i <= interval; i++) {
            self._ctx.beginPath();
            self._ctx.moveTo(self._rulerWidth + self._rulerGap, self._rulerWidth + self._rulerGap + i * spacing);
            self._ctx.lineTo(pos + self._rulerGap, self._rulerWidth + self._rulerGap + i * spacing);
            self._ctx.stroke();
        };
    };
};

// 画刻度线标签
MTImageBrowser.prototype.drawTickMarkLabels = function (direction, width, spacing) {
    var self = this, interval = width / spacing, label, x, y;
    if ("H" == direction) {
        y = self._rulerGap + self._rulerWidth / 2 - 2;
        for (var i = 0; i <= interval; i++) {
            label = i * spacing;
            x = self._rulerWidth + self._rulerGap + i * spacing + 1;
            self._ctx.fillText(label + "", x, y);
        };
    } else if ("V" == direction) {
        y = self._rulerWidth + 2;
        self._ctx.save();
        self._ctx.translate(self._rulerGap + self._rulerWidth, self._rulerGap + self._rulerWidth);
        self._ctx.rotate(Math.PI / 2);
        self._ctx.textAlign = "left";
        for (var i = 0; i <= interval; i++) {
            label = i * spacing;
            x = i * spacing + 1;
            self._ctx.fillText(label + "", x, y);
        };
        self._ctx.restore();
    };
};