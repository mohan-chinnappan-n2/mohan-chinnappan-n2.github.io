class Point {

   private x: number;
   private y: number;

    constructor(x?:number, y?:number)  {
        this.x = x;
        this.y = y;
    }
    draw () {
      console.log(` x: ${this.x}, y: ${this.y}`);
    }
    
}

// usage

let awesomePoint = new Point (10,20);
awesomePoint.draw();
