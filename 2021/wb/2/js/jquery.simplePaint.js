/**
 * jquery.simplePaint.js
 * Ver. : 1.0.0
 * last update: 08/03/2019
 * Author: meshesha , https://meshesha.js.org/
 * LICENSE: MIT
 * url:https://meshesha.github.io/simplePaint
 */
(function ($) {
    $.fn.simplePaint = function (options) {
        var settings = $.extend({
            // These are the defaults.
            width: "500",
            height: "450",
            buttons: ["pen", "line", "triangle", "rect", "circle", "text", "eraser", "undo", "redo", "clear", "image", "save"],
            canvasBgColor: "rgb(224, 239, 253)"
        }, options);
        if (settings.width.indexOf("px") > -1) {
            settings.width = retInt(settings.width, "px");
        }
        if (settings.height.indexOf("px") > -1) {
            settings.height = retInt(settings.height, "px");
        }
        var divWidth = settings.width + "px";
        var divHeight = settings.height + "px";
        var canvasBgColor = settings.canvasBgColor;
        $(this).css({
            "width": divWidth,
            "height": divHeight
        })
        $(this).addClass("simple-paint-wrapper");
        $("<div class='simple-paint-top-tools' />").appendTo(this);
        $("<div class='simple-paint-canvas-wrapper' />").appendTo(this);
        function retInt(str, suffix) {
            if (typeof str == 'number')
                return str;
            var result = str.indexOf(suffix);
            return parseInt(str.substring(0, (result != -1) ? result : str.length))
        }
        var method = {
            penColor: "#000000",
            penSize: 1,
            erasePenSize: 3,
            erasePenColor: "",
            savedPenColor: "#000000",
            savedPenSize: 1,
            selectedShapeType: "pen", /* pen,line,triangle,rect,circle,text */
            selectedFillColor: "transparent",
            selectColorFor: "transparent",
            isShowColorTbl: false,
            isShowWidthTbl: false,
            readOnly: false,
            strokes: [],
            _currentStroke: { /**stroke.fontFamly, stroke.isItalic, stroke.isBold */
                color: null,
                bgColor: null,
                size: null,
                fontSize: null,
                fontFamly: null,
                isItalic: false,
                isBold: false,
                shape: null,
                lines: [],
            },
            undoHistory: [],
            _sketching: false,
            canvas: $(".simple-paint-canvas")[0],
            tmpCanvas: null,
            inputText: null,
            isInputText: false,
            textPos: null,
            fontSize: "9",
            fontFamly: "Georgia, serif",
            isItalic: false,
            isBold: false,
            ToolTipDelay: 400,
            ToolTipTimer: null,
            _cursorPosition: function (event) {
                event = event || window.event;
                if (method.selectedShapeType == "pen" || method.selectedShapeType == "erase" || method.selectedShapeType == "text") {
                    return {
                        x: event.pageX - method.canvas.offsetLeft,
                        y: event.pageY - method.canvas.offsetTop
                    };
                } else {
                    return {
                        x: event.pageX - method.tmpCanvas.offsetLeft,
                        y: event.pageY - method.tmpCanvas.offsetTop
                    };
                }
            },
            _draw: function (shape, start, end, color, fillColor, size, fontFamly, isItalic, isBold, objIndex) {
                if (shape == "pen" || shape == "erase" || shape == "line") {
                    method._stroke(start, end, color, size);
                } else if (shape == "rect") {
                    method._rect(start, end, color, fillColor, size);
                } else if (shape == "circle") {
                    method._circle(start, end, color, fillColor, size);
                } else if (shape == "triangle") {
                    method._triangle(start, end, color, fillColor, size);
                } else if (shape == "text") {
                    //end = text
                    method.createTxt(start, end, color, fillColor, size, fontFamly, isItalic, isBold, objIndex)
                } else if (shape == "image") {
                    method._drawImage(start, end, color, size, fontFamly, isItalic, isBold, objIndex)
                } else if (shape == "canvasBgColor" || shape == "canvasBgColorClear") {
                    method.canvasBgColor("redraw", objIndex);
                }
            },
            _stroke: function (start, end, color, size) {
                method.context.save();
                method.context.lineJoin = 'round';
                method.context.lineCap = 'round';
                method.context.strokeStyle = color;
                method.context.lineWidth = size;
                method.context.beginPath();
                method.context.moveTo(start.x, start.y);
                method.context.lineTo(end.x, end.y);
                method.context.closePath();
                method.context.stroke();
                method.context.restore();
            },
            _triangle: function (start, end, color, fill, size) {
                //type = triangle types
                method.context.save();
                method.context.strokeStyle = color;
                method.context.lineWidth = size;
                method.context.beginPath();
                var Ax = (end.x + start.x) / 2;
                var Ay = start.y;
                method.context.moveTo(Ax, Ay);
                method.context.lineTo(end.x, end.y);
                method.context.lineTo(start.x, end.y);
                method.context.lineTo(Ax, Ay);
                method.context.closePath();
                method.context.fillStyle = fill;
                method.context.fill();
                method.context.stroke();
                method.context.restore();
            },
            _rect: function (start, end, color, fill, size) {
                method.context.save();
                method.context.beginPath();
                method.context.strokeStyle = color;
                method.context.lineWidth = size;
                var x = Math.min(end.x, start.x),
                    y = Math.min(end.y, start.y),
                    w = Math.abs(end.x - start.x),
                    h = Math.abs(end.y - start.y);
                method.context.rect(x, y, w, h);
                method.context.fillStyle = fill;
                method.context.fill();
                method.context.stroke();
                method.context.restore();
            },
            _circle: function (start, end, color, fill, size) {
                method.context.save();
                method.context.beginPath();
                method.context.strokeStyle = color;
                method.context.lineWidth = size;

                method.context.moveTo(start.x, start.y + (end.y - start.y) / 2);
                method.context.bezierCurveTo(start.x, start.y, end.x, start.y, end.x, start.y + (end.y - start.y) / 2);
                method.context.bezierCurveTo(end.x, end.y, start.x, end.y, start.x, start.y + (end.y - start.y) / 2);
                method.context.fillStyle = fill;
                method.context.fill();
                method.context.closePath();

                method.context.stroke();
                method.context.restore();
            },
            _drawImage: function (start, end, color, size, fontFamly, isItalic, isBold, objIndex) {
                //imgData : end
                //x, y : start
                //w, h: size{w:,h:}
                //type: fontFamly
                var x = start.x, y = start.y, w = size.w, h = size.h;
                //method.setBgImage(end, x, y, w, h, fontFamly, "redraw");
                var img = new Image();
                img.onload = function () {
                    method.context.drawImage(img, x, y, w, h);
                    if (objIndex !== undefined) { //undo
                        for (i = objIndex + 1; i < method.strokes.length; i++) {
                            if (method.strokes[i].shape != "image") {
                                method.drawStroke(method.strokes[i]);
                            }
                        }
                    }
                }
                img.src = end;
            },
            _mouseDown: function (event) {
                method._lastPosition = method._cursorPosition(event);
                method._sketching = true;
                method._currentStroke.shape = method.selectedShapeType;
                method._currentStroke.bgColor = method.selectedFillColor;
                method._currentStroke.lines = [];
                if (method.selectedShapeType == "pen" || method.selectedShapeType == "erase") {
                    method._currentStroke.color = (method.selectedShapeType == "erase") ? method.erasePenColor : method.penColor;
                    method._currentStroke.size = (method.selectedShapeType == "erase") ? method.erasePenSize : method.penSize;
                    method.canvas.addEventListener('mousemove', method._mouseMove);
                } else if (method.selectedShapeType == "text") {
                    method.createTextInput(method._lastPosition);
                } else {
                    method._currentStroke.color = method.penColor;
                    method._currentStroke.size = method.penSize;
                    method.tmpCanvas.addEventListener('mousemove', method._mouseMove);
                }
            },
            _mouseMove: function (event) {
                var currentPosition = method._cursorPosition(event);
                if (method.selectedShapeType == "pen" || method.selectedShapeType == "erase") {
                    var pcolor = (method.selectedShapeType == "erase") ? method.erasePenColor : method.penColor;
                    var psize = (method.selectedShapeType == "erase") ? method.erasePenSize : method.penSize;
                    method._draw(method.selectedShapeType, method._lastPosition, currentPosition, pcolor, "", psize);
                    method._currentStroke.lines.push({
                        start: $.extend(true, {}, method._lastPosition),
                        end: $.extend(true, {}, currentPosition),
                    });
                    method._lastPosition = currentPosition;

                } else if (method.selectedShapeType == "line") {
                    method.line_move(method._lastPosition, currentPosition);
                } else if (method.selectedShapeType == "rect") {
                    method.rect_move(method._lastPosition, currentPosition)
                } else if (method.selectedShapeType == "circle") {
                    method.circle_move(method._lastPosition, currentPosition)
                } else if (method.selectedShapeType == "triangle") {
                    method.triangle_move(method._lastPosition, currentPosition)
                }
            },
            _mouseUp: function (event) {
                if (method._sketching) {
                    if (method.selectedShapeType == "pen" || method.selectedShapeType == "erase") {
                        method.strokes.push($.extend(true, {}, method._currentStroke));
                        if (method.undoHistory.length > 0) {
                            method.undoHistory = [];
                        }
                    } else if (method.selectedShapeType == "line") {
                        method.line_up(event);
                    } else if (method.selectedShapeType == "rect") {
                        method.rect_up(event);
                    } else if (method.selectedShapeType == "circle") {
                        method.circle_up(event);
                    } else if (method.selectedShapeType == "triangle") {
                        method.triangle_up(event);
                    }
                    method._sketching = false;
                    method.undoRedoBtnColor();
                }
                if (method.selectedShapeType == "pen" || method.selectedShapeType == "text" || method.selectedShapeType == "erase") {
                    method.canvas.removeEventListener('mousemove', method._mouseMove);
                } else {
                    method.tmpCanvas.removeEventListener('mousemove', method._mouseMove)
                }
            },
            canvasBgColor: function (type) {
                method.context.fillStyle = canvasBgColor;
                method.context.fillRect(0, 0, method.canvas.width, method.canvas.height);
                if (type == "new" || type == "clear") {
                    //canvasBgColor;
                    //canvasBgColorClear
                    var shapeName = (type == "new") ? "canvasBgColor" : "canvasBgColorClear";
                    method._currentStroke.shape = shapeName;
                    method._currentStroke.lines.push({
                        start: 0,
                        end: 0
                    });
                    method.strokes.push($.extend(true, {}, method._currentStroke));
                    if (method.undoHistory.length > 0) {
                        method.undoHistory = [];
                    }
                }
            },
            createTextInput: function (start) {
                if (!method.isInputText) {
                    method.textPos = start;
                    method.inputText.style.top = (start.y - 10) + 'px';
                    method.inputText.style.left = start.x + 'px';
                    method.inputText.style.color = method.penColor;
                    method.inputText.size = 5;
                    method.inputText.style.fontSize = method.fontSize + "px";
                    method.inputText.style.fontFamily = method.fontFamly;
                    method.inputText.style.fontStyle = (method.isItalic) ? "italic" : "normal";
                    method.inputText.style.fontWeight = (method.isBold) ? "bold" : "normal";
                    method.isInputText = true;
                    method.inputText.value = "";
                    $(method.inputText).show()
                    setTimeout(function () {
                        $(method.inputText).focus();
                    }, 1)
                    $(method.inputText).on("keyup", function () {
                        if (!this.savesize) this.savesize = this.size;
                        this.size = Math.max(this.savesize, this.value.length);
                    })
                } else {
                    method.isInputText = false;
                    $(".class-temp-input-text").hide();
                    if (method.inputText.value != "") {
                        //draw text into canvas
                        method.createTxt(method.textPos, method.inputText.value, method.penColor, method.selectedFillColor, method.fontSize, method.fontFamly, method.isItalic, method.isBold);
                        method._currentStroke.color = method.penColor;
                        method._currentStroke.size = method.penSize;

                        method._currentStroke.fontSize = method.fontSize;
                        method._currentStroke.fontFamly = method.fontFamly;
                        method._currentStroke.isItalic = method.isItalic;
                        method._currentStroke.isBold = method.isBold;
                        method._currentStroke.lines.push({
                            start: method.textPos,
                            end: method.inputText.value
                        });

                        method.strokes.push($.extend(true, {}, method._currentStroke));
                        if (method.undoHistory.length > 0) {
                            method.undoHistory = [];
                        }
                    }
                }
            },
            canvasCursor: function (cursorType) {
                $(method.canvas).css({ cursor: cursorType });
                $(method.tmpCanvas).css({ cursor: cursorType });
            },
            pen: function () {
                method.selectedShapeType = "pen";
                $(".simple-paint-buttons").removeClass("simple-paint-buttons-selected");
                $(this).addClass("simple-paint-buttons-selected");
                method.reset();
                method.canvasCursor("crosshair");
            },
            line: function () {
                method.selectedShapeType = "line";
                $(".simple-paint-buttons").removeClass("simple-paint-buttons-selected");
                $(this).addClass("simple-paint-buttons-selected");
                method.reset();
                method.canvasCursor("crosshair");
            },
            triangle: function () {
                method.selectedShapeType = "triangle";
                $(".simple-paint-buttons").removeClass("simple-paint-buttons-selected");
                $(this).addClass("simple-paint-buttons-selected");
                method.reset();
                method.canvasCursor("crosshair");
            },
            rect: function () {
                method.selectedShapeType = "rect";
                $(".simple-paint-buttons").removeClass("simple-paint-buttons-selected");
                $(this).addClass("simple-paint-buttons-selected");
                method.reset();
                method.canvasCursor("crosshair");
            },
            circle: function () {
                method.selectedShapeType = "circle";
                $(".simple-paint-buttons").removeClass("simple-paint-buttons-selected");
                $(this).addClass("simple-paint-buttons-selected");
                method.reset();
                method.canvasCursor("crosshair");
            },
            eraser: function () {
                method.selectedShapeType = "erase";
                method.erasePenColor = canvasBgColor;
                $(".simple-paint-buttons").removeClass("simple-paint-buttons-selected");
                $(this).addClass("simple-paint-buttons-selected");
                method.reset();
                method.canvasCursor("cell");
            },
            text: function () {
                method.selectedShapeType = "text";
                $(".simple-paint-buttons").removeClass("simple-paint-buttons-selected");
                $(this).addClass("simple-paint-buttons-selected");
                method.reset();
                method.canvasCursor("crosshair");
            },
            line_move: function (start, end) {
                if (!method._sketching) {
                    return;
                }
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);
                // Begin the line.
                method.tmpContext.lineJoin = 'round';
                method.tmpContext.lineCap = 'round';
                method.tmpContext.strokeStyle = method.penColor;// Default line color.
                method.tmpContext.lineWidth = method.penSize;// Default stroke weight.
                method.tmpContext.beginPath();
                method.tmpContext.moveTo(start.x, start.y);
                method.tmpContext.lineTo(end.x, end.y);
                method.tmpContext.stroke();
                method.tmpContext.closePath();
            },
            line_up: function (e) {
                //do save and draw to canvas
                var currentPosition = method._cursorPosition(e);
                method._draw(method.selectedShapeType, method._lastPosition, currentPosition, method.penColor, "", method.penSize);
                method._currentStroke.lines.push({
                    start: $.extend(true, {}, method._lastPosition),
                    end: $.extend(true, {}, currentPosition),
                });
                method.strokes.push($.extend(true, {}, method._currentStroke));
                if (method.undoHistory.length > 0) {
                    method.undoHistory = [];
                }
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);
            },
            triangle_move: function (start, end) {
                if (!method._sketching) {
                    return;
                }
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);
                // Begin the line.
                method.tmpContext.strokeStyle = method.penColor;// Default line color.
                method.tmpContext.lineWidth = method.penSize;// Default stroke weight.
                method.tmpContext.beginPath();

                var Ax = (end.x + start.x) / 2;
                var Ay = start.y;
                method.tmpContext.moveTo(Ax, Ay);
                method.tmpContext.lineTo(end.x, end.y);
                method.tmpContext.lineTo(start.x, end.y);
                method.tmpContext.lineTo(Ax, Ay);
                method.tmpContext.fillStyle = method.selectedFillColor;
                method.tmpContext.fill();
                method.tmpContext.stroke();
                method.tmpContext.closePath();

            },
            triangle_up: function (e) {
                //do save and draw to canvas
                var end = method._cursorPosition(e);
                var start = method._lastPosition;
                method._draw(method.selectedShapeType, start, end, method.penColor, method.selectedFillColor, method.penSize);
                method._currentStroke.lines.push({
                    start: $.extend(true, {}, start),
                    end: $.extend(true, {}, end),
                });

                method.strokes.push($.extend(true, {}, method._currentStroke));
                if (method.undoHistory.length > 0) {
                    method.undoHistory = [];
                }
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);

            },
            rect_move: function (start, end) {
                if (!method._sketching) {
                    return;
                }
                // This creates a rectangle on the canvas.
                var x = Math.min(end.x, start.x),
                    y = Math.min(end.y, start.y),
                    w = Math.abs(end.x - start.x),
                    h = Math.abs(end.y - start.y);
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);// Clears the rectangle onload.

                if (!w || !h) {
                    return;
                }
                method.tmpContext.beginPath();
                method.tmpContext.strokeStyle = method.penColor;// Default line color.
                method.tmpContext.lineWidth = method.penSize;// Default stroke weight.
                method.tmpContext.rect(x, y, w, h);
                method.tmpContext.fillStyle = method.selectedFillColor;
                method.tmpContext.fill();
                method.tmpContext.stroke();
                method.tmpContext.closePath();
            },
            rect_up: function (e) {
                var currentPosition = method._cursorPosition(e);
                method._draw(method.selectedShapeType, method._lastPosition, currentPosition, method.penColor, method.selectedFillColor, method.penSize);
                method._currentStroke.lines.push({
                    start: $.extend(true, {}, method._lastPosition),
                    end: $.extend(true, {}, currentPosition),
                });
                method.strokes.push($.extend(true, {}, method._currentStroke));
                if (method.undoHistory.length > 0) {
                    method.undoHistory = [];
                }
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);

            },
            circle_move: function (start, end) {
                if (!method._sketching) {
                    return;
                }
                method.tmpContext.strokeStyle = method.penColor;// Default line color.
                method.tmpContext.lineWidth = method.penSize;// Default stroke weight.
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);
                method.tmpContext.beginPath();
                method.tmpContext.moveTo(start.x, start.y + (end.y - start.y) / 2);
                method.tmpContext.bezierCurveTo(start.x, start.y, end.x, start.y, end.x, start.y + (end.y - start.y) / 2);
                method.tmpContext.bezierCurveTo(end.x, end.y, start.x, end.y, start.x, start.y + (end.y - start.y) / 2);
                method.tmpContext.fillStyle = method.selectedFillColor;
                method.tmpContext.fill();
                method.tmpContext.stroke();
                method.tmpContext.closePath();
            },
            circle_up: function (e) {
                var currentPosition = method._cursorPosition(e);
                method._draw(method.selectedShapeType, method._lastPosition, currentPosition, method.penColor, method.selectedFillColor, method.penSize);
                method._currentStroke.lines.push({
                    start: $.extend(true, {}, method._lastPosition),
                    end: $.extend(true, {}, currentPosition),
                });
                method.strokes.push($.extend(true, {}, method._currentStroke));
                if (method.undoHistory.length > 0) {
                    method.undoHistory = [];
                }
                method.tmpContext.clearRect(0, 0, method.tmpCanvas.width, method.tmpCanvas.height);
            },
            createTxt: function (pos, text, color, fill, size, fontFamly, isItalic, isBold) {
                method.context.save();
                var x = pos.x, y = pos.y;
                //method.context.translate(x, y);
                //context.font="italic  bold 12px arial";
                var italic = (isItalic) ? "italic" : "normal", bold = (isBold) ? "bold" : "normal";
                method.context.font = italic + " " + bold + " " + size + 'px ' + fontFamly;
                method.context.textBaseline = "middle";
                method.context.fillStyle = color;
                method.context.fillText(text, x, y);
                method.context.restore();
            },
            setBgImage: function (imgData, x, y, w, h, type, imageOrgin) {
                var img = new Image();
                img.onload = function () {
                    method.context.save();
                    method.context.drawImage(img, x, y, w, h);
                    method.context.restore();
                    var imgSize = { w: w, h: h };
                    var imgPos = { x: x, y: y };
                    method._currentStroke.color = "";//method.penColor;
                    method._currentStroke.size = imgSize; //method.penSize;
                    method._currentStroke.shape = "image";//method.selectedShapeType;
                    method._currentStroke.lines = [];
                    method._currentStroke.fontSize = "";//method.fontSize;
                    method._currentStroke.fontFamly = type;//method.fontFamly;
                    method._currentStroke.isItalic = "";//method.isItalic;
                    method._currentStroke.isBold = "";//method.isBold;
                    method._currentStroke.lines.push({
                        start: imgPos,
                        end: imgData
                    });

                    method.strokes.push($.extend(true, {}, method._currentStroke));
                    if (method.undoHistory.length > 0) {
                        method.undoHistory = [];
                    }
                    method.undoRedoBtnColor();
                }
                img.src = imgData;
            },
            reset: function () {
                method.undoRedoBtnColor();
                method.redraw(method.strokes);
                if (method.readOnly) {
                    return;
                }
                if ($(".simple-paint-color").length == 0) {
                    for (i = 0; i < method.colorPalette.length; i++) {
                        var colorDiv = $("<div class='simple-paint-color'/>");
                        colorDiv.appendTo($(".simple-paint-color-table"));
                        if (method.colorPalette[i] == "transparent") {
                            var trnsltImg = method.translateImg();
                            colorDiv.css({
                                "background-image": trnsltImg,
                                "background-size": "contain"
                            });
                        } else {
                            colorDiv.css({
                                "backgroundColor": method.colorPalette[i]
                            });
                        }
                    };
                    $(".simple-paint-pen-color").on("click", function (e) {
                        method.selectColorFor = "penColor";
                        if (method.isShowColorTbl) {
                            $(".simple-paint-color-table").hide();
                            method.isShowColorTbl = false;
                        } else {
                            method.isShowColorTbl = true;
                            $(".simple-paint-color-table").show();
                        }
                    });
                    $(".simple-paint-fill-color").on("click", function (e) {
                        method.selectColorFor = "bgColor";
                        if (method.isShowColorTbl) {
                            $(".simple-paint-color-table").hide();
                            method.isShowColorTbl = false;
                        } else {
                            $(".simple-paint-color-table").show();
                            method.isShowColorTbl = true;
                        }

                    });
                    $(".simple-paint-color").on("click", function (e) {
                        var rgbColor = $(e.target).css("backgroundColor");
                        if (method.selectColorFor == "penColor") {
                            method.penColor = rgbColor;
                            $(".simple-paint-pen-color").css("backgroundColor", rgbColor);
                        } else if (method.selectColorFor == "bgColor") {
                            method.selectedFillColor = rgbColor;
                            $(".simple-paint-fill-color").css("backgroundColor", rgbColor);
                        }
                        $(".simple-paint-color-table").hide();
                        method.isShowColorTbl = false;
                    })

                    $(".simple-paint-pen-width").on("click", function (e) {
                        if (method.isShowWidthTbl) {
                            $(".simple-paint-width-table").hide();
                            method.isShowWidthTbl = false;
                        } else {
                            $(".simple-paint-width-table").show();
                            method.isShowWidthTbl = true;
                        }
                    });

                    $(".simple-paint-width").on("click", function (e) {
                        var penSize = $(e.target).data("width");
                        method.penSize = Number(penSize);
                        method.erasePenSize = Number(penSize) + 2;
                        if (penSize > 11) {
                            $(".simple-paint-pen-width").css("padding-top", "2px")
                            $(".simple-paint-pen-width").css("height", "21px")
                        } else {
                            $(".simple-paint-pen-width").css("padding-top", "7px")
                        }
                        $(".simple-paint-pen-width div").css({
                            "height": (penSize > 7) ? (penSize - 2) : penSize + "px"
                        })
                        $(".simple-paint-width-table").hide();
                        method.isShowWidthTbl = false;
                    });

                }
                if (method.selectedShapeType != "pen" && method.selectedShapeType != "erase") {
                    if (method.selectedShapeType != "text") {

                        method.isInputText = false;
                        $(".class-temp-input-text").hide();

                        // Build the temporary canvas.
                        method.tmpCanvas = document.createElement('canvas');
                        method.tmpCanvas.id = 'temp-canvas';
                        method.tmpCanvas.classList.add("class-temp-canvas");
                        method.tmpCanvas.width = method.canvas.width;
                        method.tmpCanvas.height = method.canvas.height;
                        $(method.tmpCanvas).appendTo($(".simple-paint-canvas-wrapper"));
                        method.tmpContext = method.tmpCanvas.getContext('2d');

                        //hide font style 
                        $(".simple-paint-font-stayle").hide();
                        // Mouse
                        method.tmpCanvas.addEventListener('mousedown', method._mouseDown);
                        method.tmpCanvas.addEventListener('mouseout', method._mouseUp);
                        method.tmpCanvas.addEventListener('mouseup', method._mouseUp);
                    } else {
                        //Build the temporary text input.
                        if ($(method.inputText).length == 0) {
                            method.inputText = document.createElement('input');
                            method.inputText.id = 'temp-input-text';
                            method.inputText.type = 'text';
                            method.inputText.style.display = "none";
                            method.inputText.classList.add("class-temp-input-text");
                            $(method.inputText).appendTo($(".simple-paint-canvas-wrapper"));
                        }
                        //show font style 
                        $(".simple-paint-font-stayle").show();
                    }
                } else {

                    method.isInputText = false;
                    $(".class-temp-input-text").hide();

                    //remove temp cancas
                    if ($(method.tmpCanvas).length > 0) {
                        $(".class-temp-canvas").remove();
                    }
                    //remove temp text input
                    if ($(method.inputText).length > 0) {
                        $(".class-temp-input-text").remove();
                    }
                    //hide font style 
                    $(".simple-paint-font-stayle").hide();
                }
                // Mouse
                method.canvas.addEventListener('mousedown', method._mouseDown);
                method.canvas.addEventListener('mouseout', method._mouseUp);
                method.canvas.addEventListener('mouseup', method._mouseUp);
            },
            init: function () {
                $("<div class='simple-paint-color-table' />").appendTo(".simple-paint-top-tools");
                $("<div class='simple-paint-side-tools' />").appendTo(".simple-paint-canvas-wrapper");
                $("<canvas class='simple-paint-canvas' />").appendTo(".simple-paint-canvas-wrapper");

                $("<div class='simple-paint-colors' />").appendTo(".simple-paint-side-tools");
                $("<div class='simple-paint-font-stayle' />").appendTo(".simple-paint-side-tools");

                $("<span class='simple-paint-labels simple-paint-pen-color-label'>Color:</span>").appendTo(".simple-paint-colors");
                $("<div class='simple-paint-tooltip simple-paint-pen-color' title='Select line color' />").appendTo(".simple-paint-colors");
                $("<span class='simple-paint-labels simple-paint-fill-color-label'>Fill:</span>").appendTo(".simple-paint-colors");
                $("<div class='simple-paint-tooltip simple-paint-fill-color' title='Select fill color' />").appendTo(".simple-paint-colors");
                $("<span class='simple-paint-labels simple-paint-pen-width-label'>Thick:</span>").appendTo(".simple-paint-colors");
                $("<div class='simple-paint-tooltip simple-paint-pen-width' title='Select line thickness'><div></div></div>").appendTo(".simple-paint-colors");

                $("<div class='simple-paint-width-table' />").appendTo(".simple-paint-top-tools");
                $("<div class='simple-paint-width simple-paint-width-1' data-width='1'><hr data-width='1'></div>").appendTo(".simple-paint-width-table");
                $("<div class='simple-paint-width simple-paint-width-2' data-width='3'><hr data-width='3'></div>").appendTo(".simple-paint-width-table");
                $("<div class='simple-paint-width simple-paint-width-3' data-width='7'><hr data-width='7'></div>").appendTo(".simple-paint-width-table");
                $("<div class='simple-paint-width simple-paint-width-4' data-width='10'><hr data-width='10'></div>").appendTo(".simple-paint-width-table");
                $("<div class='simple-paint-width simple-paint-width-5' data-width='15'><hr data-width='15'></div>").appendTo(".simple-paint-width-table");
                $("<div class='simple-paint-width simple-paint-width-6' data-width='20'><hr data-width='20'></div>").appendTo(".simple-paint-width-table");


                $("<span class='simple-paint-labels simple-paint-font-famly-label'>Font:</span>").appendTo(".simple-paint-font-stayle");
                $("<select class='simple-paint-font-selects simple-paint-font-famaly-select' title='select text font family'><option value='1'>font famaly Arial</select>").appendTo(".simple-paint-font-stayle");

                $("<span class='simple-paint-labels simple-paint-font-size-label'>Size:</span>").appendTo(".simple-paint-font-stayle");
                $("<select class='simple-paint-font-selects simple-paint-font-size-select' title='select text font size'><option value='1'>8px</select>").appendTo(".simple-paint-font-stayle");
                $("<input class='simple-paint-font-italic-checkbox' type='checkbox' value='1'/><span class='simple-paint-font-italic'>italic</span>").appendTo(".simple-paint-font-stayle");
                $("<input class='simple-paint-font-bold-checkbox' type='checkbox' value='1'/><span class='simple-paint-font-bold'>bold</span>").appendTo(".simple-paint-font-stayle");

                $("<div class='simple-paint-file-input-warrper'><span>Background image:</span><input type='file' class='simple-paint-file-input' accept='image/x-png,image/gif,image/jpeg'/></div>").appendTo(".simple-paint-top-tools");

                method.canvas = $(".simple-paint-canvas")[0];
                method.canvas.width = 0.9 * settings.width; //90%
                method.canvas.height = 0.9 * settings.height;
                method.context = method.canvas.getContext('2d');
                method.canvasBgColor("new");
                var ffOptions = "";
                $.each(method.fontFamalyPalette, function (i, f) {
                    ffOptions += "<option style = 'font-size:8px;' value='" + f.val + "'>" + f.name + "</option>"
                });
                $(".simple-paint-font-famaly-select").html(ffOptions);
                var fontSizeArray = [9, 10, 12, 14, 18, 24, 36, 48];
                var fSize = "";
                $.each(fontSizeArray, function (i, size) {
                    fSize += "<option class = 'simple-paint-font-options' value='" + size + "'>" + size + "px</option>"
                });
                $(".simple-paint-font-size-select").html(fSize);
                //font style select events
                $(".simple-paint-font-famaly-select").on("change", function () {
                    method.fontFamly = $(this).val();
                });
                $(".simple-paint-font-size-select").on("change", function () {
                    method.fontSize = $(this).val();
                });
                //simple-paint-font-italic-checkbox , method.isItalic
                $('.simple-paint-font-italic-checkbox').on('change', function () {
                    if (this.checked) {
                        method.isItalic = true;
                    } else {
                        method.isItalic = false;
                    }
                });
                //simple-paint-font-bold-checkbox , method.isBold 
                $('.simple-paint-font-bold-checkbox').on('change', function () {
                    if (this.checked) {
                        method.isBold = true;
                    } else {
                        method.isBold = false;
                    }
                });

                $('.simple-paint-file-input').change(function () {
                    var imgPosX = 0;
                    var imgPosY = 0;
                    var deployType = "";
                    var imgW = method.canvas.width;
                    var imgH = method.canvas.height;
                    var file = this.files[0];
                    var reader = new FileReader();
                    reader.onloadend = function (event) {
                        method.setBgImage(event.target.result, imgPosX, imgPosY, imgW, imgH, deployType, "input");
                    }
                    if (file) {
                        reader.readAsDataURL(file);
                    }
                    $(".simple-paint-file-input-warrper").hide();
                });

                $("body").on("mouseup", function (e) {
                    e.preventDefault();
                    if (e.target.className !== "simple-paint-width-table") {
                        $(".simple-paint-width-table").hide();
                        method.isShowWidthTbl = false;
                    }
                    if (e.target.className !== "simple-paint-color-table") {
                        $(".simple-paint-color-table").hide();
                        method.isShowColorTbl = false;
                    }
                    if (e.target.className !== "simple-paint-file-input-warrper" && e.target.className !== "simple-paint-file-input") {
                        $(".simple-paint-file-input-warrper").hide();
                    }
                });

                //init tooltip 
                method.toolTip();

                if (!method.readOnly) {
                    $(method.canvas).css({ cursor: 'crosshair' });
                    $(method.tmpCanvas).css({ cursor: 'crosshair' });
                }
            },
            style: function () {
                var browser = method.getBrowser();
                //|| browser == "Chrome"
                console.log("browser: ", browser)
                if (browser == "IE") {
                    $(".simple-paint-color-table").css({
                        "margin-left": "calc(5% - 6px)",
                        "left": "calc(29%)",
                        "top": "calc(45%)"
                    });
                    $(".simple-paint-width-table").css({
                        "left": "34%",
                        "top": "70%"
                    });
                    $(".simple-paint-file-input-warrper").css({
                        "left": "55%",
                        "top": "40%"
                    });
                } else if (browser == "Chrome") {
                    $(".simple-paint-color-table").css({
                        "margin-left": "60px",
                        "margin-top": "90px"
                    });

                    $(".simple-paint-width-table").css({
                        "margin-left": "55px",
                        "margin-top": "220px"
                    });
                    $(".simple-paint-file-input-warrper").css({
                        "margin-left": "290px",
                        "margin-top": "50px"
                    });

                } else {
                    $(".simple-paint-color-table").css({
                        "margin-left": "calc(5% - 6px)",
                        "margin-top": "calc(15% + 1px)"
                    });

                    $(".simple-paint-width-table").css({
                        "margin-left": "50px",
                        "margin-top": "calc(10% + 220px)"
                    });
                    $(".simple-paint-file-input-warrper").css({
                        "margin-left": "calc(20% - 1px)",
                        "margin-top": "calc(8% - 1px)"
                    });
                }
            },
            toolTip: function () {
                //method.ToolTipDelay = 400, method.ToolTipTimer;
                $('.simple-paint-tooltip').hover(function (e) {
                    var title = $(this).attr('title');
                    $(this).data('ToolTipText', title).removeAttr('title');
                    $('<div class="sp-tooltip sp-tooltip-hide"></div>').text(title).appendTo('body');
                    method.ToolTipTimer = setTimeout(function (e) {
                        $('.sp-tooltip').removeClass('sp-tooltip-hide').fadeIn('fast');
                    }, method.ToolTipDelay);
                }, function () {
                    clearTimeout(method.ToolTipTimer);
                    $(this).attr('title', $(this).data('ToolTipText'));
                    $('.sp-tooltip').remove();
                }).mousemove(function (e) {
                    var pLeft;
                    var pTop;
                    var offset = 10;
                    var CursorX = e.pageX;
                    var CursorY = e.pageY;
                    var WindowWidth = $(window).width();
                    var WindowHeight = $(window).height();
                    var toolTip = $('.sp-tooltip');
                    var TTWidth = toolTip.width();
                    var TTHeight = toolTip.height();
                    if (CursorX - offset >= (WindowWidth / 4) * 3) {
                        pLeft = CursorX - TTWidth - offset;
                    } else {
                        pLeft = CursorX + offset;
                    }
                    if (CursorY - offset >= (WindowHeight / 4) * 3) {
                        pTop = CursorY - TTHeight - offset;
                    } else {
                        pTop = CursorY + offset;
                    }
                    $('.sp-tooltip').css({ top: pTop, left: pLeft })
                });

            },
            drawStroke: function (stroke, objIndex) {
                for (var j = 0; j < stroke.lines.length; j++) {
                    var line = stroke.lines[j];
                    var size = (stroke.shape == "text") ? stroke.fontSize : stroke.size;
                    method._draw(stroke.shape, line.start, line.end, stroke.color, stroke.bgColor, size, stroke.fontFamly, stroke.isItalic, stroke.isBold, objIndex);
                }
            },
            redraw: function (strokes) {
                for (var i = 0; i < strokes.length; i++) {
                    method.drawStroke(strokes[i], i);
                }
            },
            clear: function () {
                method.canvasBgColor("clear");
            },
            undo: function () {
                if (method.strokes.length > 1) {
                    var stroke = method.strokes.pop();
                    //console.log(stroke)
                    if (stroke) {
                        if (stroke.shape != "canvasBgColor") {
                            method.undoHistory.push(stroke);
                            method.redraw(method.strokes);
                        }
                    }
                    method.undoRedoBtnColor();
                }
            },
            redo: function () {
                var stroke = method.undoHistory.pop();
                if (stroke) {
                    method.strokes.push(stroke);
                    method.drawStroke(stroke);
                }
                method.undoRedoBtnColor();
            },
            undoRedoBtnColor: function () {
                if (method.strokes.length > 1) {
                    $(".simple-paint-undo-btn").removeClass("simple-paint-buttons-gray")
                } else {
                    $(".simple-paint-undo-btn").addClass("simple-paint-buttons-gray")
                }
                if (method.undoHistory.length == 0) {
                    $(".simple-paint-redo-btn").addClass("simple-paint-buttons-gray")
                } else {
                    $(".simple-paint-redo-btn").removeClass("simple-paint-buttons-gray")
                }

            },
            fontFamalyPalette: [
                {
                    name: 'serif',
                    val: 'Georgia, serif'
                },
                {
                    name: 'Palatino',
                    val: '"Palatino Linotype", "Book Antiqua", Palatino, serif'
                },
                {
                    name: 'Times',
                    val: '"Times New Roman", Times, serif'
                },
                {
                    name: 'Arial',
                    val: 'Arial, Helvetica, sans-serif'
                },
                {
                    name: 'Arial Black',
                    val: '"Arial Black", Gadget, sans-serif'
                },
                {
                    name: 'Comic Sans MS',
                    val: '"Comic Sans MS", cursive, sans-serif'
                },
                {
                    name: 'Impact',
                    val: 'Impact, Charcoal, sans-serif'
                },
                {
                    name: 'Lucida Grande',
                    val: '"Lucida Sans Unicode", "Lucida Grande", sans-serif'
                },
                {
                    name: 'Tahoma',
                    val: 'Tahoma, Geneva, sans-serif'
                },
                {
                    name: 'Trebuchet MS',
                    val: '"Trebuchet MS", Helvetica, sans-serif'
                },
                {
                    name: 'Verdana',
                    val: 'Verdana, Geneva, sans-serif'
                },
                {
                    name: 'Courier New',
                    val: '"Courier New", Courier, monospace'
                },
                {
                    name: 'Lucida Console',
                    val: '"Lucida Console", Monaco, monospace'
                }
            ],
            colorPalette: [ //array of color table hex color codes. 
                "#000000", "#000000", "transparent", "#000000", "#003300", "#006600", "#009900", "#00CC00", "#00FF00", "#330000", "#333300", "#336600", "#339900", "#33CC00", "#33FF00", "#660000", "#663300", "#666600", "#669900", "#66CC00", "#66FF00",
                "#000000", "#333333", "transparent", "#000033", "#003333", "#006633", "#009933", "#00CC33", "#00FF33", "#330033", "#333333", "#336633", "#339933", "#33CC33", "#33FF33", "#660033", "#663333", "#666633", "#669933", "#66CC33", "#66FF33",
                "#000000", "#666666", "transparent", "#000066", "#003366", "#006666", "#009966", "#00CC66", "#00FF66", "#330066", "#333366", "#336666", "#339966", "#33CC66", "#33FF66", "#660066", "#663366", "#666666", "#669966", "#66CC66", "#66FF66",
                "#000000", "#999999", "transparent", "#000099", "#003399", "#006699", "#009999", "#00CC99", "#00FF99", "#330099", "#333399", "#336699", "#339999", "#33CC99", "#33FF99", "#660099", "#663399", "#666699", "#669999", "#66CC99", "#66FF99",
                "#000000", "#CCCCCC", "transparent", "#0000CC", "#0033CC", "#0066CC", "#0099CC", "#00CCCC", "#00FFCC", "#3300CC", "#3333CC", "#3366CC", "#3399CC", "#33CCCC", "#33FFCC", "#6600CC", "#6633CC", "#6666CC", "#6699CC", "#66CCCC", "#66FFCC",
                "#000000", "#FFFFFF", "transparent", "#0000FF", "#0033FF", "#0066FF", "#0099FF", "#00CCFF", "#00FFFF", "#3300FF", "#3333FF", "#3366FF", "#3399FF", "#33CCFF", "#33FFFF", "#6600FF", "#6633FF", "#6666FF", "#6699FF", "#66CCFF", "#66FFFF",
                "#000000", "#FF0000", "transparent", "#990000", "#993300", "#996600", "#999900", "#99CC00", "#99FF00", "#CC0000", "#CC3300", "#CC6600", "#CC9900", "#CCCC00", "#CCFF00", "#FF0000", "#FF3300", "#FF6600", "#FF9900", "#FFCC00", "#FFFF00",
                "#000000", "#00FF00", "transparent", "#990033", "#993333", "#996633", "#999933", "#99CC33", "#99FF33", "#CC0033", "#CC3333", "#CC6633", "#CC9933", "#CCCC33", "#CCFF33", "#FF0033", "#FF3333", "#FF6633", "#FF9933", "#FFCC33", "#FFFF33",
                "#000000", "#0000FF", "transparent", "#990066", "#993366", "#996666", "#999966", "#99CC66", "#99FF66", "#CC0066", "#CC3366", "#CC6666", "#CC9966", "#CCCC66", "#CCFF66", "#FF0066", "#FF3366", "#FF6666", "#FF9966", "#FFCC66", "#FFFF66",
                "#000000", "#FFFF00", "transparent", "#990099", "#993399", "#996699", "#999999", "#99CC99", "#99FF99", "#CC0099", "#CC3399", "#CC6699", "#CC9999", "#CCCC99", "#CCFF99", "#FF0099", "#FF3399", "#FF6699", "#FF9999", "#FFCC99", "#FFFF99",
                "#000000", "#00FFFF", "transparent", "#9900CC", "#9933CC", "#9966CC", "#9999CC", "#99CCCC", "#99FFCC", "#CC00CC", "#CC33CC", "#CC66CC", "#CC99CC", "#CCCCCC", "#CCFFCC", "#FF00CC", "#FF33CC", "#FF66CC", "#FF99CC", "#FFCCCC", "#FFFFCC",
                "#000000", "#FF00FF", "transparent", "#9900FF", "#9933FF", "#9966FF", "#9999FF", "#99CCFF", "#99FFFF", "#CC00FF", "#CC33FF", "#CC66FF", "#CC99FF", "#CCCCFF", "#CCFFFF", "#FF00FF", "#FF33FF", "#FF66FF", "#FF99FF", "#FFCCFF", "#FFFFFF"
            ],
            translateImg: function () {
                return "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALEoAACxKAXd6dE0AAAEMSURBVGhD7dLBbYQAEARByD8o4IEOIiAbbEvXAcxj+mFpK4HWaHfxrOv64yMmed+XjoaShIiJkoSIiZKEiImShIiJkoSIiZKEiImShIiJkoSIiZKEiImShIiJkoSIiZKEiImShIiJkoSIiZKEiImShIiJkoSIiZKEiImShIiJkoSIiZKEiImShIiJkoSIiZKEiImShIiJkoSIiZKEiImS5Lqu+74/jvM8n+eh9I+9gr/L7vtOwPb9pLrjOAjYCLZt20bARrBtBsQIts2AGMG2GRAj2DYDYgTbZkCMYNsMiBFsmwExgm0zIEawbQbECLbNgBjBthkQI9g2A2IE22ZAjGDbDIgRbJsBmWX5BaEx75c1Qv+vAAAAAElFTkSuQmCC')";
            },
            hexc: function (colorval) {
                var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                delete (parts[0]);
                for (var i = 1; i <= 3; ++i) {
                    parts[i] = parseInt(parts[i]).toString(16);
                    if (parts[i].length == 1) parts[i] = '0' + parts[i];
                }
                return '#' + parts.join('');
            },
            getBrowser: function () {
                if (navigator.userAgent.indexOf("Edge") > -1) {
                    return 'Edge';
                } else if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
                    return 'Opera';
                } else if (navigator.userAgent.indexOf("Chrome") != -1) {
                    return 'Chrome';
                } else if (navigator.userAgent.indexOf("Safari") != -1) {
                    return 'Safari';
                } else if (navigator.userAgent.indexOf("Firefox") != -1) {
                    return 'Firefox';
                } else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) {
                    return 'IE';
                } else {
                    return 'unknown';
                }
            },
            clearBtn: function () {
                var clearBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAADdAAAA3QFwU6IHAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAADZQTFRF////jo6O6hUV4xwcmpqaysrKsLCwzMzMubm54hsbzc3Nv7+/4hsb4xsbzMzMwcHBmZmZ4hsb7F3a/wAAABB0Uk5TAAkMEjAwV2iEl5irw87Q2ZznxWsAAACgSURBVDhPldJbEoMgDAVQhIggKGb/m9WG2BZjG7k/OHOPw9NsFDAiUBvzEIRJJDQgzSKpb4o/ACAkgEGCAcAXeP05zbKtGVcaTuCirR82ujvgFswkbMbFSXD0SOLokUUDIiIJ6hGjAFxkHqxcA4uv/rqLj+D+Ct7i7LuBNoW2SHWb6kGpR61eln7dNyGgPjn10T4EfhTxDSirSOmb4jfYAZ0OGLGmACHtAAAAAElFTkSuQmCC" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-clear-btn' title='clear canvas' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-clear-btn").html(clearBtn).on("click", method.clear);
            },
            eraserBtn: function () {
                var eraserBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA3QAAAN0BcFOiBwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAUkSURBVFiFrZd7UFRVHMe/5152gV2WXe4+WlYYHhpKgULDRNqY4yw+xsC0chif+RgsMmfSUREtJStLS2todNSiHDXTmGwUYsQyLWXA1GR85GogmCgosO6CC+zz1x+wKMrjLnBnzj97Hp/P/Z7f2XsviAiD0QAoeZm6DECyT/MGDR4cWsWNXES8XGPzRWJQ4P4h4be4pHcpfL2NjDllJJGrLGIlOAzgYowpgw0xlfrho8NkNUVIEMzQDEvGuFVHlRK5qpgxltznIgO582BDTMOo9I9ow29Oei93HwlhMZSWe4vS9xGlfCAuiYHBZ2yglb846cKdNjp/u61fEj5vgTf2yDGz1BPnZ2NstB01TS54iDBn5gxkLF+Dks1GtJhroB7a93b4JMAYU/LBoeXweNSxaVlICneAsfa+ugduNLS4kZ05F2+vWidaQrSAF05xGRGSqPEo+WIaiq8ArU7WOeZ+qwc1TS6syJgpWkKUQCc8/s2IIROymDFzJ+S6aBzb9CqOXu4qUXXf6ZNEnwJd4Ckr2ehhMjCOIWHuNlESi5Zl9yrBOqpaPJw9MoAI5XuXwHbvBiZmHcLkOCBQ8nA9pT8Hq92DE0cOYnfuJry46jhkQhgaK8/gj82TrU6bZRKfk5PTP3j7IOhHToG5shSmYztAMemI1DBI+PZuu7tdJmp4HFQqFQq2Lkboc9OhHPIMbPeq+OZaU2y3CYiCP3r1kYT38iahGzXVUXnimwpni2XMEzXgM7wjid5qwu124av330Fs4vMY8Wwcqv78rsrZYhlDRFau6zqM+QVpSmjYa5FC8kI21FHWN7wPCbfbhc+Wz4fb6cSJgny6fK602t7cmExEVuCxUxCpEybuX5BiUFXne8xV53G7ygTzjbMiDbqX+Hn3Dkj9A6ANi6LC77++2dRYm+CFdxEQFPJMf54rNI6MD9mzfg6TnFzqrnRGwnQqHw/uVvRbgo16C4JhKBX9kPcEHOg4hoJCnqlTyHJPLpvtp5/9BkDNKCwqptez9nick/bygikXL2XmQSIPES/SUZi1F38FR65ay93q2MfhAMB1gY9PAGwVgFSJ1NRUlr9pHicpnus2x6/G759Ph8fl8CkJabDB0dbc8E9PcADgiaisPGuBnz55BKBVtf/a1ggECBieNIElPGVnP21f62lN2c2ptXooAnr+8yS3C/8ey4UQlYSrBZ84TEVbKrzV3tMcPlDqt25j2jgOoQIQFPiwx24BAgTEJI5tl9iW7alWGDlBre1WgtwulG6bCYfNgqbbV0TBgb6eBfXlgKMZqWmvsIMbZ3GSI1Pdp89eQq3F1S2c95cjSBctGg4AvFIeuEQtD5AnRhoAnerJES11gMOKEdEGFh+tZoe2r+mSRCdcKoNC/7RPcADgW+yOfX/9VzdfcHtkiTo1oFX2OLg7iUt5s8FJ/BEcGuMzHOg4howxvV6luPRx6ljNwhlGIDa810mHj5+j9DX7Pc6pR/i44Hp4as84rhVt9RneKQDAJ4mL127CdOMOzcvJ97iip/Gcab/JaTO/4CsceKQIiaiuztIcv7bwVMO3+ceBq7e6nVB64TpezvgUoVoV+3J56t/s2oEr/YV7wY+/cuv1KkV93pwpRIe3EF3/sbOdPvAhGXQhVLBzNUUYNE1qpdyIjhT723p6H+h2O06fN+G+1YalG/Ka683WFbZWx65+3XVvCfSWRG3JLoowaJpkAZLFA/2mFPVlBECvVQbdDQqQugL9pXaJH+8YTDgR4X8rFyPbPpYukQAAAABJRU5ErkJggg==" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-eraser-btn' title='Eraser' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-eraser-btn").html(eraserBtn).on("click", method.eraser);
            },
            undoBtn: function () {
                var undoBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAsQAAALEBxi1JjQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAM0SURBVFiF5ZZbaBRXHMa/c+a+M7vZa/aSW+O6kcSgmxoll0YjVSwtKrgWioZEKWKiIlLF1gtVUfOiUAIqkoiPolVoQQKSllbBOza0oboBSaFNUQM17W6STbI7O9OHGNGybHZzW0q+tzPn/Of7zf8cvjkEM6NCQkmPYGDj0BCHDj3RotGRmMDOEACcvqzYhms1fH1hKesRlYRr/K7mATpTAKlqbgNs21P9IKMAWRYpmlGA00e+r5nbZ+B/DWADkJ0pgHJR4YIACmYbgBgt4kGT03BXMvO26TBPB8Boy1V+tPqMxxu/WcPleSzh2QTwG63S74Vr3CsOXF1Lm5YuAQXRJqjhUgVI+jc0GLhPGYU9u+pEmdC4sQLFppQ6b8pySO3eDzycV7HAKRgmBSBb3fI12S2tDrRUMvVLFsPOS68neZ4KssJ3UErVG527ju/cdDnQ0/1XCQDEYnGptq5E3Li/nLxnzwNDSFKARLMlJofhZtHaHEfD4Wp8mOsFR9/eqaHBKNRYfOxzzSIiQ7HXY0IITGYxqem4/K7mgbc6IIpcAyPR1ppDC/ntdZXwm50JC2WFTzpOR+MAgsUtXxDM3CeBM9Xs1go/sifYu+kSC8Cb5ZBuvVPr9Gw+VkXWFxRBYJikRXYaQFi/jajeNyVzLa5Ryglsk07hLtviJbU5BROaA8Cg3glVn1oUHP2sfVjT9MeMFtc6qEaDweu9634zDLIunxkeKfElclwimQcVIegYnZR58xc3Rq5c7OwOh0ZWMgCgqvEn0Yj6dV/n34Ffe14oQplC5pvMYEjinIri+ZTML7U9CoZDw8sBDL7Z75ejEfVctD9Weu/bp75QKaVFLhtkNuVQS9scSJwDMChcIyOyLe+f9PONH1ei5D8J2PrV7VjwlxfD6Zj3PRsgXT/9GQyHRlYCiIw/TxZTi0wO6YfiQL6t7vMqfJQzD+yrQFpXdb7/54e9pwD0pAMBoP1N81RktLrl7/LL7eq+O+v1rsiX+h/qSd2/LO8lgKVpmk9eik3abbSL0Q1tVXpH/97ZB3ild0126Z+KHQs03zJXJBMAAGC1euT7hBA9UwDA2MHdD6BsOl72L66W7mfxNp4oAAAAAElFTkSuQmCC" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-undo-btn' title='Undo' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-undo-btn").html(undoBtn).on("click", method.undo);
            },
            redoBtn: function () {
                var redoBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAsQAAALEBxi1JjQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANUSURBVFiF7ZZdaBxVGIaf+d3Z2Z3dzC5p4qY2DUFQqD9LtaYQrdWqbS1Gaq1EIti0tDfGQkBvxNqbFkGlWKWCP0Wo1lYk1QtJqakGaQ2iYq2aWDBUURGN3ZCd2dmdTHbHi3alTbeZpInphXlhYOZ873m/5xyGwxFkVXJkVVQoUcKnRAWNumNKqeTfDXxaqT4dyZIsKO19K+V7axtImzUVTY+s3Dt8rGdwpnsDIP4nqXMAcwBzAP9HAB2ov5IAEUkR+yVJWnelAFB1OWTWR941a/VXAXnWATRDKa59r1m+ednCx+JV4a+A1EwDKEEGOSSx7bU12lM77rneiId+AO4KBHhhoO1okGldWzoWNbS9THJVj25ZIh7s2VRVk4p9YMS1nUywUPGlhw+ngwLXtqWlZ19cXaNp8k9GTBsa/0QNdUARReEmcx6GrAKwKJ3ik++2Rhc3LeiIxcPHgOpK2UJIl72NX6ya8D5Qlp11KRYr3lkQRQEjrl007vs+r+86PrZ7R+9IdiTfAhw/vz7pvxUgGgtNxQ6AIAhs7myWm5Y1JDe07OvOZd2XHWf0GTh7+5q1k/CGxXX0fPuEceOSuq1xM3wUMP8FKBX9aYWLhKkR2wN9ZlLnwMcbIx1PL18aNUIDQJMUnxdeOvT9SGPitoRwbVUSRbycTfEpkmOMM4FOQRBY2JiUu7v6pVzOrZbylneglCvecvqbvxr9W8OXBSEgExauweXXQO+JL3/joTvesDJDuecKea9DAvy87R30ndI0IEqBzX3f583dn3tPbjqUGc44azyv+A6AVK5PH+LSsrMuW9bvt7rePnHSyhZuB34s14RxXimRinwUrdNXXNVQ5adUPS8iXvSHbu5sHvl5MKMc+bBfL48lUxHt8e3L1aisIp8HfvLr32lv2Wc5trvLtke3AxfkjQeAs7tyPxOfEZ8BCWDRue+YOT+yp7X7TrV1wXXUR+IAvPVK39jz23qyVrbwINBbKahSkyJwaILmZf0JDJx7rwb2lAu25dK54X2nr/f0KStbuA/441IhUzoJJ6NfTp2hdX2Xlfnb2e/YbgfgzXSPSqo250fcFTvTfiyhWZIkrZ6NphcACILgm7X6IHD1VCZKwZZJSQeUgu09AAxPZeI/22wTlLDHDKMAAAAASUVORK5CYII=" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-redo-btn' title='Redo' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-redo-btn").html(redoBtn).on("click", method.redo);
            },
            penBtn: function () {
                var penBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAeCAAAHggFwQHG1AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAJxQTFRF////46FezkpK46Nx45kA45YA6bc99O685JgAykpK5JUA5ZcAqpqGy0tNzEpN36Rx36JwzEtM7NCr68Nf7NWul5SS4KNv4aBN4KNwzExM6qxK45cA9c5r9c9r8uy/zEtM45cA45cA45cAzEtM558JzU5O8uy/zEtMz6B44KNw45cA554J558K558L8uy//MU8/MY8/MY9/slA/8tDagi6zAAAACd0Uk5TABsfJC0uLi4vMDAxXWNkeHmuusPHzc7Oz9ja4eHh6uvr7O3v9vv+iiW3AQAAAKhJREFUOMu1ykcSgkAQQNEmSVSSEpUsOqBguP/dnKFc0lMUln/7PgCa6NbxDmfQ8wtti7rqndkQY77Jhj07asTNym+nw8W860/syEXUx/exHTyd48+7n6mzbny9qzYcf9y6ylznJd+1xW785uW8K4tdm/fivy5PPlJX+F6scyGdvMcc7LDhOgQkeTGXEZcIIUmDOzh0IGGKOkTUA1tA3bpGjgScDhZw+wCw9ii/pP1rgAAAAABJRU5ErkJggg==" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-pen-btn simple-paint-buttons-selected' title='Pen' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-pen-btn").html(penBtn).on("click", method.pen);
            },
            textBtn: function () {
                var textBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA3QAAAN0BcFOiBwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAATNSURBVFiF7ZdbTBRnFMd/38wwewWyFmS9gCAaRUOEiiRtqkljtD40aXpJNMYaQ4m+6IPVpBdrlPBiay2mJk0wvmhqo4mGpyYWWzA0IbViiymm2VZFKEQU2WVhd2d3Z2e+PsgiWBEE26ZJ/4/n8v3/OfN9Z84RgPTqmmUhLQmSEZgpW7NsuUVKeYYZQAixSVPEaaemyhQyNdYXT1oOzatr1vCeN1SWSpXch85tn10ZPvnt7Zlwj6KqvIj6w4dVXNdUcldAIgxWAlfFzoQ2cZrChg0blhQUFHxhGEb2dIh1XQ+Vl5cHIAwdl2FZCCwDLBOkBcDEAvQsdd3aVw5WVVURj8enw4/H4yGZTNL86UeSO7dhkYTk4LgYDaDtTpCeaAyyoXiOl9LCbLAMGYlE2nbv3u0fHBycVgWys7MHN2/e3AxsAcTjYjSAK3dCXL4xAE5Y/3zeiICEfeDA/iPP4hJuX7lwy0R+LZ6yRPv9kK14RULqXtnYHrQbf7orWzr61ZkQj0VLdz87GtvsxFUtJtQMIU1Dgi3NlO0WwCaA0uWlOTt37TzW09tzvra29txIbiswG1g0Te4bwD3gRYB9+/ZvX7x40cunTp18v6mpqQtAS5c4Pz//kGVZnDhxYrWU8q30CQ5fYV0qq/B1V85Ca7bHNh5lEEKgZ2hICbZtI6VEVVWCvb9lhHt+OZeIBN8GugFKSpYdqamp4ebNm2VSyo9hzCtIJVNZkUiUUCg0/sKpimqXbBXuio1aZYkn81EB/kyoWQ8DUWjtAsOEV0vgzQ/PcPXkLmVsbCgU9MRiMQzD8KVtT+gDU0PfMOw4P9723Y2p509ZQOh4hXVu8PZoK3UvqKRoe6OjKFen9dCaWPBW2+il1WctELlr9+lkODImO1eZLACAYAA7ck9aZtyfShpOy4yXGZEhJZlMsnEFJIYHEpYZLxvx+RND/Ur37x2g6PpkR09agVQ8fEnvbFhga46IDeZY3/2o5Ode+9EUU9EcP2idDd5UPHxpxgKsyMBR4OjjfHmZCi8UKtSPsUkpo8Dqyc5NY2qfYALEkpK+ITl54N8lIC9TUFnw2Bb/zwh4FvhfwH9PgBAiF8gBsCWYD9tAzojvqfDU/wLFmRUQTp/XmVMkUHU+aYbMOUscyVjoazMaNgD/tARoujbk9Xrw+XzhJyUIRdetsl0ZvtnZ8OtX9ALzVr7m9peu49rZD1JPyvX5ZkXdbne2y+UKjfIKIdIDSY+qqlRXV3+ftgGtUsrucQKkdSyj/fP8Pitu9klzXGvGSt39i2AhCng4kAQMw5hbXFzcnuYQmiKsqvIiTK9MSI9XylTcxjZlS0e/2tkXfedZzIRLczNPrynIJfHc+JHsy6Yut+bUVFn/3rsqS+e4UMMw3A1zX2JbVfVwZ190JtyjWFOQS/36CoXV0jvWfrblj5HFpCsAri7IMiEVgZ4mUB1KTU3tnvnz5x+eyVi+d+/e5qHmhgljHggI3oWghPRIkQiD6hJer7eirq5uJotJZjKZ3Nrc3DDhH2viZ5gcsi5e/Obg9evX82aymuXl5QVWKfLo8fZbonKejx8DQXxeneULsiYRgM2FCxcCUsqa6ZCnIYTYtGrlQvweJx6Hht/nJNOt4XY8KLfgX17P/wSowx0362oBBgAAAABJRU5ErkJggg==" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-text-btn' title='Add Text' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-text-btn").html(textBtn).on("click", method.text);
            },
            lineBtn: function () {
                var lineBtn = '<img height="20" src=" data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAAEzo7pQAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAAAAAKVnuc8AAAABdFJOUwBA5thmAAAACXBIWXMAAA6cAAAOnAEHlFPdAAAARElEQVQoU+2KSQ4AIAgD6f8/LRBcEDx50EQnhNChBBLiDgx6dbaAvQs9VU4oGU+osXjHqJ20Rwu/EuC3YCnlvoqFHAAote4A1Z6zrygAAAAASUVORK5CYII=" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-line-btn' title='Line' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-line-btn").html(lineBtn).on("click", method.line);
            },
            triangleBtn: function () {
                var triangleBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAQAAACROWYpAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADdcAAA3XAUIom3gAAAAHdElNRQfjAwUXEC6jB+MFAAAAvklEQVQ4y53NwRGCQBBE0Q8bBKKhGJVVZuCJg0UkBGASRkAIcPRI6cFSWHZm2KH72l0PrDQ07EzNwECtDwrj3DJRUHLxuwdGjlSMnLRJUM83nnS8qDjz2OMClq3JXxfw27Nr2rI8u247dg1bkmPXZaeuaqdy6mbbsqvYa1l2s2zdFe1Y1t1N23YFeynbrmlvu4k9y9uuaue5K/sn57mine9GdnC6ie1zF3Zwu5Htd/92QcvE1X2GOyX0vHe2/wCeHXJ8OpDkmwAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxOS0wMy0wNVQyMjoxNjo0NiswMTowMB+ZxHQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTktMDMtMDVUMjI6MTY6NDYrMDE6MDBuxHzIAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAABJRU5ErkJggg==" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-triangle-btn' title='Triangle Shape' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-triangle-btn").html(triangleBtn).on("click", method.triangle);
            },
            rectBtn: function () {
                var rectBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAQAAACROWYpAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADdcAAA3XAUIom3gAAAAHdElNRQfjAwUXEQaPqXq+AAAAJ0lEQVQ4y2Nk+M9AASBf838mSuwd1TyqeVTzqOZRzaOaiQOMlFR0AK7TBDW48yv6AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE5LTAzLTA1VDIyOjE3OjA2KzAxOjAwdBGhsAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxOS0wMy0wNVQyMjoxNzowNiswMTowMAVMGQwAAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2FwZS5vcmeb7jwaAAAAAElFTkSuQmCC" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-rect-btn' title='Rect Shape' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-rect-btn").html(rectBtn).on("click", method.rect);
            },
            circleBtn: function () {
                var circleBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAQAAACROWYpAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADdcAAA3XAUIom3gAAAAHdElNRQfjAwUXEB0c14ITAAABfElEQVQ4y6XUy25SURTG8R+HpNKUSRMZkM40ERh0bjlemr4AIfE5HGirs4aQ9E28JNpq+ghgGzuQoPNyepkUnchQB14GhtByKAeO32jvtfc/a31rr+yMuLKqakK3LOO7yIF9H/2SoEXPfNWxbV3ZkiVl67Z19G3JTUMfOfdWaeJZya4z9clgYEfP3al1VUWaMnH0tZabSa4UtLwcx3e0LCSisKCledVrb4aso+zRyPui8wSvce+nw84/92YuFPZsQlb/mseZpooLAQ98mhuFrjDrsS/aKeCi1UDVh1SZ20K+uZMKLunzUz4VnPcjID6rMykgMFBMBRcNAj0rqeAVx4FD91PBDx1wTycV/Nnaf44nW3bnht978m+Rc6Y6Fxo6cWO4qYsUZkYLTtQuB5pzfENtjauhjFdaM2QvaHsRn8mMpijBeyjSuG6c607tqUw8q3g37nVcOZv6uho2lOXllW1o6LrwdNThYbFxBdbUhG5b9sfAsUP7jvwev/gXYZxYQ9yPkFAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTktMDMtMDVUMjI6MTY6MjkrMDE6MDAvvr0aAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE5LTAzLTA1VDIyOjE2OjI5KzAxOjAwXuMFpgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAASUVORK5CYII=" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-circle-btn' title='Circle Shape' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-circle-btn").html(circleBtn).on("click", method.circle);
            },
            imgBtn: function () {
                var imgBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAADhAAAA4QFwGBwuAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAs1QTFRF////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUFAAAAAAAAAAQEGxcIGBIJGhcJHBcJBQwRBA8TCAYCCAgCCwoEDQsEDwsGEQ0GBhIYEg8GBxQZEQ0FLCQPLSUQLyYQLigQMCgRMisRMisTCRwkDCMuDSk0Ch8nHBkNDzJBSDwZETdHFkRXEjlIGExhRjoYG1lxHl95MSgRHlluIm6MQzcXH2WBZVQjJXmZJ36gKoarK420LY+0MaDLFkdaGlRqHUhAHU1JH2N+IGeDIVBBIV1iIk43I2VuI3GQJU8tJVQ5JWx6JXWVJlAvJ3SHKDkwKHyWKUpJKWI4KYWqKYaqKoSjKoerK1Q1K2Y6K4qwLVU3LZC3LZC4LmA5LpS5LpS8L2A5L5fAMFY6MJ3HMZ7JMndEMqLPM1g/M3GDM3dEM4urM46wM6XSNERANHA/NVs9NVw5NV03Nl03N1BEN1pEN3dGOFFGOF43OHdEOYZNOohOOopPO1VYO11JO19LO4xQPF9LPF9MPGxwPIBIPI5RPYNMPpFTP0dBP19NP5JTQJRUQUhBQZVVQklERUs+SE9DSJpXSVBGTHpgTaNcT1c9UFA6UKlgUWFDUa1iUa5jUq9jVGFEVLFlVLJlWmNHYGBFYWFGZF03Z3d1Z3d3bF0rbWVBb2FMb2xMcGg+cWlEdHNWdWImdWo9em5AhY18iHU1i5+kjayrja2tj5yQj66ukKivlKqvlYNdlq+2lrC3l4Nbl4NdmYNbmoNcmqumm5FBnpJBn4tGoMLCob/EorzEpptkpsLKqMTLqcTNrocersK+saVqsc3XsqFbtZpJttTet5tsuJpBuZtCu9nkvpQfv6BEv97owaJFxeXvxqByx6tJx+fxyKdHyaJzydfEyqZ2y+v2zKZ2ze75zqZ22LRM4bWB47eC49OI57Qm6LuF6bUm68RT7MVU7cZUFglEjAAAAD90Uk5TAAIDBgoPGRstLjc5OztDVFhaZ3iChYaHiImKio2YnZ6foKGioqutsLW1t8TGyMrN09bX19rc3d7g5Oft8vz+d/MfYQAAAcRJREFUOMtjYCAE2AUE8QB+VgaDazfwgMvGDBbnV+EAx16cWfbUgsFi3Z3HOMH2y2QpOL10zX0cCrYdBZErXr4+h13BprjOk0Bq/amrq7Eq2Bw3b24dSMX+LQ/RFNzsWPL48da4efPmzS09CZXblXcWruDmpAc7Fh9OnAcCczMgKnY1NZRfgCq4PuHRq1d7CudBwNzkEyD5xtbWmpIrYAVr+5+8AoLdRTAV0ccf76xvBYLqko0gBYvuvQKDvcUwFRFHJreCQVXAJaCClc8gCl7tq5g3d2Jly5R5c/3SIApagw8iK3h1scDJIyzQzbFsrlcWREHkAWQFt3qyc8HA3316fjumgud96blQEO89b2YXhoLlOSC58BQQ6dM2b1Y3moLntWDNLrFgynXevNm9UAWHFiwEgWmZyAqCZsyYMWf+/Km3LRjM3rwDgw0xubkhnp72zp6eUbm5zXchom+1GfhUlJUUFeTlNG1zcxNCQx18Q0OTcnNNZKUlJcTFREW44cmfwxzZCh3M/MGkh6xADUsOErYGyUSlgkhDLiwKGDXsYAFlI4U1E7KpWkHkjWSYceRTIS19S1NddV48WZmFh5OJgTQAALXb5c01VaclAAAAAElFTkSuQmCC" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-img-btn' title='Add background image'  />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-img-btn").html(imgBtn).on("click", function () {
                    $(".simple-paint-file-input-warrper").show();
                });
            },
            saveBtn: function () {
                var saveBtn = '<img height="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAADdAAAA3QFwU6IHAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAMNQTFRF////AICAM01TME9UMk5UMk9VME1VMU9VME5UXHF2YnZ8ZGlQZnp5Znp+cYOAdXFNdnRNdoeDWmRRgJCLjJmdh3xLUmpvTmVsT15ST2dtUWhrU2lshpSYj4BKS2Rql6Kml6SlmqWcRl9lR1pSR2BkQ11jRFhTpa+iqo5HPVVTP1leO1NUO1VdO1ddrLO2tJRGub6xN1NaME5VNlBVNFFYzM6+M09VM09VMU5V2KVCzM7PMk5VMU5VMU5V2NjY5K1A6efRw4tgBAAAAD10Uk5TAAIoOlJXYH6pwMDAwMDAwMDAwcHBwsPExMTExMTExcXHx8nJycvLy87Q0NTU1NTU1Nvd3uLi5OXo7/H2+y24CNcAAADDSURBVDjL3dPXDoIwFIBhXHUhDnABDsQFKkURnFjf/6msN4xDwRjv/C+br+lJ03LIT+tQKXA05GGMO/upJEkTK1LjNBrcy2/gEEKa2yHdMntEUun6+lYMwfhaTQDSOucCMHzUkuDi57MB8UoBWFh9BnBQ5pARcFRhvRjoOsmWUZDaX4H6hlk9ALrZZmTqIeCfjPgYEOcgEQCNB2kAuDbIBUCBj14B4OOQwg4kALCCt7D69ohfAP28hmwzkg2MPQr8zNALrg/CchXc/7gAAAAASUVORK5CYII=" />'
                $("<span class='simple-paint-tooltip simple-paint-buttons simple-paint-save-btn' title='Save canvas as image' />").appendTo($(".simple-paint-top-tools"));
                $(".simple-paint-save-btn").html(saveBtn).on("click", function () {
                    var browser = method.getBrowser();
                    if (browser == "IE" || browser == "Edge") {
                        var blob = method.canvas.msToBlob();
                        window.navigator.msSaveBlob(blob, 'my_simple_paint.png');
                    } else {
                        method.canvas.toBlob(function (blob) {
                            var objectUrl = URL.createObjectURL(blob);
                            var a = document.createElement('a');
                            a.href = objectUrl;
                            a.download = "my_simple_paint.png";
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(objectUrl);
                        });
                    }
                });
            }
        }

        //buttons = ["pen", "line", "triangle", "rect", "circle", "text", "eraser", "undo", "redo", "clear", "image", "save"];
        $.each(settings.buttons, function (i, button) {
            switch (button) {
                case "pen":
                    method.penBtn();
                    break;
                case "line":
                    method.lineBtn();
                    break;
                case "triangle":
                    method.triangleBtn();
                    break;
                case "rect":
                    method.rectBtn();
                    break;
                case "circle":
                    method.circleBtn();
                    break;
                case "text":
                    method.textBtn();
                    break;
                case "eraser":
                    method.eraserBtn();
                    break;
                case "undo":
                    method.undoBtn();
                    break;
                case "redo":
                    method.redoBtn();
                    break;
                case "clear":
                    method.clearBtn();
                    break;
                case "image":
                    method.imgBtn();
                    break;
                case "save":
                    method.saveBtn();
                    break;
            }
        })
        method.init();
        method.reset();
        method.style();
    }
}(jQuery))