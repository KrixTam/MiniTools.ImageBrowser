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
        if (result) {
            niibLogger.warn("0005");
        } else {
            niibLogger.warn("0006");
        };
    } catch (err) {
        niibLogger.warn("0006", {"异常信息": err});
    };

    document.body.removeChild(textArea);
    return result;
};

function copyTextToClipboard (text) {
    if (!navigator.clipboard) {
        return fallbackCopyTextToClipboard(text);
    }
    navigator.clipboard.writeText(text).then(function () {
        niibLogger.warn("0007");
        return true;
    }, function (err) {
        niibLogger.warn("0008", {"异常信息": err});
        return false;
    });
};

var MTLogger = function (desc) {
    var self = this;
    self._desc = desc;
};

MTLogger.prototype.info = function (err_id, err_infos = {}) {
    var self = this;
    if (err_id in self._desc) {
        console.log("[" + err_id + "] " + self._desc[err_id]["desc"]);
        if (Object.keys(err_infos).length > 0) {
            console.log(err_infos);
        };
    };
};

MTLogger.prototype.warn = function (err_id, err_infos = {}) {
    var self = this;
    if (err_id in self._desc) {
        console.log("[" + err_id + "] " + self._desc[err_id]["desc"]);
        if (Object.keys(err_infos).length > 0) {
            console.log(err_infos);
        };
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
    "0005": {
        "desc": "Fallback：取色成功，信息已拷贝到剪贴板。",
        "msg": "取色成功，信息已拷贝到剪贴板。"
    },
    "0006": {
        "desc": "Fallback：取色成功，信息拷贝到剪贴板失败。",
        "msg": "取色成功，信息拷贝到剪贴板时出现异常。"
    },
    "0007": {
        "desc": "Async：取色成功，信息已拷贝到剪贴板。",
        "msg": "取色成功，信息已拷贝到剪贴板。"
    },
    "0008": {
        "desc": "Async：取色成功，信息拷贝到剪贴板失败。",
        "msg": "取色成功，信息拷贝到剪贴板时出现异常。"
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

var MTImageBrowser = function (container_id, options={}) {
    var self = this;
    self._guidelines = new Array();
    self._menu_min_width = 650;
    var container = document.getElementById(container_id);
    var canvas = document.createElement("canvas");
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.visibility = "hidden";
    input.onchange = function () {
        self.load(0);
    };
    var menus = document.createElement("div");
    menus.className = "mtib_menu";
    var button_01 = generateButton(menus, "打开", function () {input.click();});
    var button_02 = generateButton(menus, "重置", function () {
        self.load(0);
    });
    var button_03 = generateButton(menus, "保存", function () {self.download();});
    var label_range = generateLabel(menus, "100%", "mtib_range_label");
    var range = document.createElement("input");
    range.type = "range";
    range.min = 10;
    range.max = 100;
    range.value = 100;
    range.step = 10;
    range.onchange = function () {
        label_range.innerHTML = self._range.value + "%";
        if (self._loaded) {
            self.load(self._range.value, true);
        };
    };
    menus.appendChild(range);
    self._range = range;
    self._label_range = label_range;
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    menus.appendChild(checkbox);
    var color_div = document.createElement("div");
    color_div.className = "mtib_color_block";
    color_div.innerHTML = "#FFFFFF"
    menus.appendChild(color_div);
    var label_x = generateLabel(menus, "x: ", "mtib_pos_label");
    var label_y = generateLabel(menus, "y: ", "mtib_pos_label");
    canvas.onclick = function (e) {
        if (self._loaded) {
            var x_real = Math.ceil(label_x.innerHTML.replace("x: ", ""));
            var y_real = Math.ceil(label_y.innerHTML.replace("y: ", ""));
            var x_pos = Math.ceil(x_real * self._scale_ratio), y_pos = Math.ceil(y_real * self._scale_ratio);
            if (x_pos >= 0 && y_pos >= 0 && x_pos <= self._image_width && y_pos <= self._image_height) {
                if (checkbox.checked) {
                    copyTextToClipboard(color_div.innerHTML);
                } else {
                    self.drawGuideLine(x_pos, y_pos);
                };
            };
        };
    };
    canvas.onmousemove = function (e) {
        if (self._loaded) {
            var rect = canvas.getBoundingClientRect();
            var x = e.clientX - rect.left, y = e.clientY - rect.top;
            var x_pos = x - self._zero, y_pos = y - self._zero;
            var x_real = Math.ceil(x_pos / self._scale_ratio), y_real = Math.ceil(y_pos / self._scale_ratio);
            if (x_pos >= 0 && y_pos >= 0 && x_pos <= self._image_width && y_pos <= self._image_height) {
                label_x.innerHTML = "x: " + x_real;
                label_y.innerHTML = "y: " + y_real;
                var p = self._ctx.getImageData(x * self._pixelRatio, y * self._pixelRatio, 1, 1).data;
                var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
                color_div.style.backgroundColor = hex;
                var hex_invert = "#" + ("000000" + rgbToHex(255 - p[0], 255 - p[1], 255 - p[2])).slice(-6);
                color_div.style.color = hex_invert;
                color_div.innerHTML = hex;
            } else {
                label_x.innerHTML = "x: ";
                label_y.innerHTML = "y: ";
            };
        };
    };
    container.appendChild(menus);
    container.appendChild(canvas);
    container.appendChild(input);
    var download_link = document.createElement('a');
    download_link.setAttribute('download', 'image_snapped.png');
    download_link.style.visibility = "hidden";
    container.appendChild(download_link);
    self._max_x = 0;
    self._max_y = 0;
    self._rulerWidth = 10;
    self._rulerGap = 5;
    self._zero = self._rulerWidth + self._rulerGap;
    self._container = container;
    self._canvas = canvas;
    self._input = input;
    self._download_link = download_link;
    self._pixelRatio = window.devicePixelRatio;
    self._ctx = self._canvas.getContext("2d");
    self._loaded = false;
    self._scale_ratio = 1;
    self._image_width = 100;
    self._image_height = 50;
    self._image_real_width = 100;
    self._image_real_height = 50;
    self._tick_mark_unit_min = 10;
    self._tick_mark_unit = 100;
    self.setSize(100, 50);
};

MTImageBrowser.prototype.setSize = function (width, height) {
    var self = this, space = 10, menu_height = 40, min_width = self._menu_min_width + space;
    var canvas_width = width + space, canvas_height = height + space;
    var container_width = (canvas_width > min_width) ? canvas_width : min_width;
    var container_height = height + menu_height + space;
    self._canvas.width = canvas_width * self._pixelRatio;
    self._canvas.height = canvas_height * self._pixelRatio;
    self._ctx.scale(self._pixelRatio, self._pixelRatio);
    self._container.style.width = container_width + "px";
    self._container.style.height = container_height + "px";
    self._canvas.style.width = canvas_width + "px";
    self._canvas.style.height = canvas_height + "px";
    self._max_x = width;
    self._max_y = height;
};

// 加载图片
MTImageBrowser.prototype.load = function (percentage=100, restore_flag=false) {
    var self = this, scale_ratio = percentage / 100;
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
                self.clear(restore_flag);
            };
            var img = new Image(), f = self._input.files[0], src = url.createObjectURL(f);
            img.src = src;
            img.onload = function() {
                // 根据图片尺寸调整画布尺寸，并根据屏幕缩放比恢复画布清晰度
                self._image_real_width = img.width;
                self._image_real_height = img.height;
                if (0 == percentage) {
                    scale_ratio = Math.round(self._menu_min_width / img.width * 10) * 10;
                    if (scale_ratio > 100) {
                        scale_ratio = 1;
                    } else {
                        self._range.value = scale_ratio;
                        self._label_range.innerHTML = self._range.value + "%";
                        scale_ratio = scale_ratio / 100;
                    };
                };
                if (img.width > 200) {
                    var min_range = Math.round(200 / img.width * 10) * 10;
                    self._range.min = min_range;
                } else {
                    self._range.min = 100;
                };
                self._image_width = Math.ceil(img.width * scale_ratio);
                self._image_height = Math.ceil(img.height * scale_ratio);
                var width = self._image_width + self._zero * 2, height = self._image_height + self._zero * 2;
                self.setSize(width, height);
                self._ctx.drawImage(img, self._zero, self._zero, self._image_width, self._image_height);
                url.revokeObjectURL(src);
                self._loaded = true;
                self._scale_ratio = scale_ratio;
                // 绘制标尺
                var stroke_color = self._ctx.strokeStyle, fill_color = self._ctx.fillStyle;
                self._ctx.lineWidth= 1;
                self._ctx.strokeStyle = "#000";
                self._ctx.fillStyle = "#000";
                self._ctx.font = "8px Arial";
                // 水平标尺
                self.drawTickMarks("H", false, self._image_width, self._tick_mark_unit_min);
                self.drawTickMarks("H", true, self._image_width, self._tick_mark_unit);
                // 垂直标尺
                self.drawTickMarks("V", false, self._image_height, self._tick_mark_unit_min);
                self.drawTickMarks("V", true, self._image_height, self._tick_mark_unit);
                // 绘制右下角角标
                var x_pos_rb = self._image_width + self._zero, y_pos_rb = self._image_height + self._zero, offset = self._rulerGap + self._rulerWidth / 2 - 2;
                self._ctx.beginPath();
                self._ctx.moveTo(x_pos_rb, y_pos_rb);
                self._ctx.lineTo(x_pos_rb + self._rulerWidth, y_pos_rb);
                self._ctx.stroke();
                self._ctx.fillText(self._image_real_width + "", x_pos_rb + 2, self._max_y - self._rulerGap / 2 + 2);
                self._ctx.beginPath();
                self._ctx.moveTo(x_pos_rb, y_pos_rb);
                self._ctx.lineTo(x_pos_rb, y_pos_rb + self._rulerWidth);
                self._ctx.stroke();
                self._ctx.save();
                self._ctx.translate(self._zero, self._zero);
                self._ctx.rotate(- Math.PI / 2);
                self._ctx.textAlign = "left";
                self._ctx.fillText(self._image_real_height + "", 2 - self._image_height, self._max_x - self._zero);
                self._ctx.restore();
                // 恢复现场
                self._ctx.strokeStyle = stroke_color;
                self._ctx.fillStyle = fill_color;
                if (restore_flag) {
                    for (var i = 0; i < self._guidelines.length; i++) {
                        self.drawGuideLine(self._guidelines[i][0], self._guidelines[i][1], true);
                    };
                };
            };
        } else {
            niibLogger.warn("0004");
        };
    };
};

// 清空画布
MTImageBrowser.prototype.clear = function (restore_flag=false) {
    var self = this;
    self._ctx.clearRect(0, 0, self._canvas.width, self._canvas.height);
    self._loaded = false;
    if (restore_flag) {
        ;
    } else {
        self._guidelines = new Array();
    }
};

// 画刻度线
MTImageBrowser.prototype.drawTickMarks = function (direction, longer, width, spacing) {
    var self = this, interval = width / self._scale_ratio / spacing, pos = 5, tmp;
    if (longer) {
        pos = 0;
        self.drawTickMarkLabels(direction, width, spacing);
    };
    if ("H" == direction) {
        for (var i = 0; i <= interval; i++) {
            self._ctx.beginPath();
            tmp = Math.ceil(self._zero + i * spacing * self._scale_ratio);
            self._ctx.moveTo(tmp, self._zero);
            self._ctx.lineTo(tmp, pos + self._rulerGap);
            self._ctx.stroke();
        };
    } else if ("V" == direction) {
        for (var i = 0; i <= interval; i++) {
            self._ctx.beginPath();
            tmp = Math.ceil(self._zero + i * spacing * self._scale_ratio);
            self._ctx.moveTo(self._zero, tmp);
            self._ctx.lineTo(pos + self._rulerGap, tmp);
            self._ctx.stroke();
        };
    };
};

// 画刻度线标签
MTImageBrowser.prototype.drawTickMarkLabels = function (direction, width, spacing) {
    var self = this, interval = width / self._scale_ratio / spacing, label, x, y;
    if ("H" == direction) {
        y = self._rulerGap + self._rulerWidth / 2 - 2;
        for (var i = 0; i <= interval; i++) {
            label = i * spacing;
            x = self._zero + Math.ceil(label * self._scale_ratio) + 1;
            self._ctx.fillText(label + "", x, y);
        };
    } else if ("V" == direction) {
        y = self._rulerWidth + 2;
        self._ctx.save();
        self._ctx.translate(self._zero, self._zero);
        self._ctx.rotate(Math.PI / 2);
        self._ctx.textAlign = "left";
        for (var i = 0; i <= interval; i++) {
            label = i * spacing;
            x = Math.ceil(label * self._scale_ratio) + 1;
            self._ctx.fillText(label + "", x, y);
        };
        self._ctx.restore();
    };
};

// 画刻GuideLine
MTImageBrowser.prototype.drawGuideLine = function (x_pos, y_pos, restore_flag = false) {
    var self = this, stroke_color = self._ctx.strokeStyle, fill_color = self._ctx.fillStyle, offset = self._rulerGap + self._rulerWidth / 2 - 2;
    var x = x_pos + self._zero, y = y_pos + self._zero;
    var x_real = Math.ceil(x_pos / self._scale_ratio), y_real = Math.ceil(y_pos / self._scale_ratio);
    if (restore_flag) {
        x = Math.ceil(x_pos * self._scale_ratio) + self._zero;
        y = Math.ceil(y_pos * self._scale_ratio) + self._zero;
        x_real = x_pos;
        y_real = y_pos;
    };
    self._ctx.strokeStyle = "#169FE6";
    self._ctx.fillStyle = "#169FE6";
    self._ctx.beginPath();
    self._ctx.moveTo(x, self._zero);
    self._ctx.lineTo(x, self._max_y - self._zero);
    self._ctx.moveTo(self._zero, y);
    self._ctx.lineTo(self._max_x - self._zero, y);
    self._ctx.stroke();
    // 画标签
    self._ctx.fillText(x_real + "", x, self._max_y - self._zero + offset);
    self._ctx.save();
    self._ctx.translate(self._zero, self._zero);
    self._ctx.rotate(- Math.PI / 2);
    self._ctx.textAlign = "left";
    self._ctx.fillText(y_real + "", self._zero - y, self._max_x - self._zero - self._rulerWidth + 2);
    self._ctx.restore();
    // 恢复现场
    self._ctx.strokeStyle = stroke_color;
    self._ctx.fillStyle = fill_color;
    if (restore_flag) {
        ;
    } else {
        // 保存导航线
        self._guidelines.push([x_real, y_real]);
    }
};

// 保存图片
MTImageBrowser.prototype.download = function () {
    var self = this;
    self._canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        self._download_link.setAttribute('href', url);
        self._download_link.click();
    });
};