"use strict";

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

var niib = function (container_id, options) {
    var self = this;
    var container = document.getElementById(container_id);
    var canvas = document.createElement("canvas");
    var input = document.createElement("input");
    // TODO：input待隐藏并提供API进行文件浏览器操作
    input.type = "file";
    input.accept = "image/*";
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
};

// 加载图片
niib.prototype.load = function (img_file) {
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
                self._container.style.width = width + 'px';
                self._container.style.height = height + 'px';
                self._canvas.style.width = width + 'px';
                self._canvas.style.height = height + 'px';
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
niib.prototype.clear = function () {
    var self = this;
    self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);
    self._loaded = false;
};

// 画刻度线
niib.prototype.drawTickMarks = function (direction, longer, width, spacing) {
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
niib.prototype.drawTickMarkLabels = function (direction, width, spacing) {
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