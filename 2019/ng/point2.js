var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.draw = function () {
        console.log(" x: " + this.x + ", y: " + this.y);
    };
    Object.defineProperty(Point.prototype, "X", {
        get: function () {
            return this.x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Point.prototype, "Y", {
        set: function (v) {
            this.y = v;
        },
        enumerable: true,
        configurable: true
    });
    return Point;
}());
// usage
var awesomePoint = new Point(10, 20);
awesomePoint.draw();
