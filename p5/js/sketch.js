/*
function setup() { 
  createCanvas(800, 600);
} 

function draw() {
  if (mouseIsPressed) {
    fill('salmon');
  } else {
    fill('#99ccff');
  }
  ellipse(mouseX, mouseY, 30, 30);
}
*/


let snowflakes = []; // array to hold snowflake objects

function setup() {
  createCanvas(300, 300);
  fill(240);
  noStroke();
}

function draw() {
  var angle = 0.0;
  var jitter = 0.0;

  background('skyblue');
  //fill(65);
  if (second() % 2 == 0) {  
    jitter = random(-0.1, 0.1);
  }
  //increase the angle value using the most recent jitter value
  angle = angle + jitter;
  //use cosine to get a smooth CW and CCW motion when not jittering
  var c = cos(angle);
  //move the shape to the center of the canvas
  // translate(width/2, height/2);
  //apply the final rotation
  // rotate(c);
  text("Happy Holidays!", 100, 100);

  text("Happy Holidays!", mouseX, mouseY);
  // foreground('black');

  let t = frameCount / 30; // update time

  // create a random number of snowflakes each frame
  for (var i = 0; i < random(5); i++) {
    snowflakes.push(new snowflake()); // append snowflake object
  }

  // loop through snowflakes with a for..of loop
  for (let flake of snowflakes) {
    flake.update(t); // update snowflake position
    flake.display(); // draw snowflake
  }
}

// snowflake class
function snowflake() {
  // initialize coordinates
  this.posX = 0;
  this.posY = random(-50, 0);
  this.initialangle = random(0, 2 * PI);
  this.size = random(2, 5);

  // radius of snowflake spiral
  // chosen so the snowflakes are uniformly spread out in area
  this.radius = sqrt(random(pow(width / 2, 2)));

  this.update = function(time) {
    // x position follows a circle
    let w = 0.6; // angular speed
    let angle = w * time + this.initialangle;
    this.posX = width / 2 + this.radius * sin(angle);

    // different size snowflakes fall at slightly different y speeds
    this.posY += pow(this.size, 0.5);

    // delete snowflake if past end of screen
    if (this.posY > height) {
      let index = snowflakes.indexOf(this);
      snowflakes.splice(index, 1);
    }
  };

  this.display = function() {
    ellipse(this.posX, this.posY, this.size);
  };
}
