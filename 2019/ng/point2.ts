class Point {

    constructor(private _x?:number, private _y?:number)  {
    }
    draw () {
      console.log(` x: ${this._x}, y: ${this._y}`);
    }

    get x() {
      return this._x;
    }
    set x(v) {
      this._x = v;
    }
}

// usage

let awesomePoint = new Point (10,20);

awesomePoint.draw();
