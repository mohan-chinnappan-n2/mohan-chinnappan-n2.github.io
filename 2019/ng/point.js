var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.draw = function () {
        console.log(" x: " + this.x + ", y: " + this.y);
    };
    return Point;
}());
// usage
var awesomePoint = new Point(10, 20);
awesomePoint.draw();
