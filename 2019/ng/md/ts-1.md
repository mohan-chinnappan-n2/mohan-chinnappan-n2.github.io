## Simple TypeScript Class

```
class Point {

    x: number;
    y: number;

    constructor(x?:number, y?:number)  {
        this.x = x;
        this.y = y;
    }
    draw () {
      console.log(` x: ${this.x}, y: ${this.y}`);
    }
    
}



```
