var canvas;
var direction = -1;
var offset = 0;
var shadowScale = 1.0;

/*var bubDirection = -1;
var bubOffset = 0;*/

function setup() {
  canvas = createCanvas(640,480);
}

function draw() {

  //fish rules
  var fishTimer = frameCount % 100
  if( fishTimer == 0 ) {
    direction = direction * -1;
		}
  offset = offset + (direction*.15)
	
	//bubble rules
	/*var bubbleTimer = frameCount % 500
	if (bubbleTimer == 0){
		bubOffset = 0;
	}
	bubOffset = bubOffset + bubDirection;*/
	
	noStroke();
  water();
	
  push();
		translate(320,480);
		noStroke();
		seafloor();

		//growing shadow
		if(direction > 0 ) {
			shadowScale += .002;
		} else {
			shadowScale -= .002;    
		}
		scale(shadowScale,1)
		shadow();
  pop();  
  
	//moving the fish
  push()
		translate(0, 0 + offset )  

		push();
		translate(320,100);
		dorsal();
		pop();

		push();
		translate(420,250);
		finR();
		pop();

		push();
		translate(220,250);
		finL();
		pop();

		push();
			translate(320, 240);
			body();

			push();
			translate(70,0);
			eyes();
			pop();

			push();
			translate(-70,0);
			eyes();
			pop();

			push();
			translate(70,0);
			pupils();
			pop();

			push();
			translate(-70,0);
			pupils();
			pop();

			push();
			translate(0,50);
			lips();
			pop();
		pop();
  pop();
	
	/*bubbles
	push();
		translate(100, 460 + bubOffset);
		bubbles();
	pop();*/
}

function water(){
  fill('#85e0e0');
  rect(0,0,640,480);
}

function seafloor(){
  fill('#ff0066');
  ellipse(0,0,1000,200);
}

function shadow(){
  fill('#73264d')
  ellipse(0,-50,150,20);
}

function body(){
  fill('#ffcc00');
  noStroke();
  ellipse(0,0,250,250);
}

function eyes(){
  fill('white');
  noStroke();
  ellipse(0,0, 100, 100);
}

function pupils(){
  fill('black');
  ellipse(0,0,50,10);
}

function lips(){
  noFill();
  stroke('#FF3239');
  strokeWeight(20);
  ellipse(0,0,30,50);
}

function dorsal(){
  fill('#FF3239');
  noStroke();
  arc(0,0,100,100,0, PI+QUARTER_PI,PIE);
}

function finR(){
  rotate(radians(300));
  fill('#FF3239');
  noStroke();
  arc(0,0,150,150,0,HALF_PI, PIE);

}

function finL(){
  rotate(radians(150));
  fill('#FF3239');
  noStroke();
  arc(0,0,150,150,0, HALF_PI, PIE);
}

function bubbles(){
	noFill();
	stroke('white');
	strokeWeight('2');
	ellipse(0,0,25,25);
}