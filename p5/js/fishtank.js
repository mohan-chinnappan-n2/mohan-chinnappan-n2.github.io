let bubbles = [];
let fishcolor = [236, 136, 173];

function Bubble() {
  this.x = random(0, width);
  this.y = random(height, 0);
  this.i = random(0, width);
  this.j = random(height, 0);

  this.display = function() {
    noStroke();
    fill(260);
    ellipse(this.x, this.y, 20);

    noStroke();
    fill(260, 60);
    ellipse(this.i, this.j, 28);
  }

  this.move = function() {
    this.x = this.x;
    this.y = this.y - 1;
    this.i = this.i;
    this.j = this.j - 1;
  }
}


function fish(x, y, d) {
  //body
  fill(fishcolor);
  noStroke();
  ellipse(x, y, d * 10, d * 6);

  //tail
  fill(fishcolor);
  noStroke();
  triangle(x + 50, y, x + 90, y - 30, x + 90, y + 30);

  //eye
  fill(0, 0, 0);
  noStroke();
  ellipse(x - 30, y - 5, d, d);
}


function setup() {
  createCanvas(800, 600);

  //bubbles
  for (let i = 0; i < 25; i++) {
    bubbles[i] = new Bubble();
  }
}

function draw() {
  background(116, 187, 227);
  text("ichi", x, 80);


  //bubbles 
  for (let i = 0; i < bubbles.length; i++) {
    bubbles[i].move();
    bubbles[i].display();
  }
  
  //grass
  for (let x = 0; x < width; x += 20) {
    for (let y = 0; y < height; y += 20) {
      triangle(x, y + 400, x + 10, y + 330, x + 20, y + 400);
      fill(55, 143, 80);
      noStroke();
    }
  }

  //fish
  fish(mouseX, mouseY, 10);

}

function mousePressed() {
  fishcolor = random(255, 0, 0);
}