  (function() {

        var query = location.search.substr(1);
        var result = {};
        query.split("&").forEach(function(part) {
          var item = part.split("=");
          result[item[0]] = decodeURIComponent(item[1]);
        });
        var name = result.n || 'you';
        var ele = document.getElementById('mp3Name');
        var greeting = 'Happy Holidays to ' + name + '!!!'; 
        ele.innerHTML = greeting;
        var title= document.getElementById('title');
        title.innerHTML = 'Happy Holidays to ' + name + '!!!'; 
        var header= document.getElementById('header');
        header.innerHTML = 'Happy Holidays to ' + name + '!!!'; 


     // fish pond:
 // the reference to the processing sketch
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.fillStyle = "steelblue";
ctx.fillRect(0, 0, canvas.width, canvas.height);

  var pjs;
  // the id of the repeated update events that each local fish makes
  var intervalId;


  channel.bind('pusher:subscription_error', function(status) {
    alert("pusher subscription failed: " + status);
  });

  // bind to the repeated updates that each local fish makes about itself.
  channel.bind('client-update', function(data) {
    pjs.updateRemoteFish(data.myLocation, data.mousePosition, data.stripeColor, data.id, data.maxSpeed, data.maxForce, data.bodySizeW, data.bodySizeH, data.velocity, data.canonicalUnModdedLocation, data.originalBodySizeW,
      data.originalBodySizeH, data.startFade);
    
    pjs.updateRemoteFood(data.foodLocation, data.foodVelocity, data.foodIsDead, data.foodId, 
      data.foodColor, data.foodAge, data.foodIsDummy);
  });

  // bind to the event that a remote fish ate a food
  channel.bind('client-my-fish-ate', function(data) {
    gulp.play();
    pjs.foodEatenByRemoteFish(data.foodEatenId, data.myFishId);
  });

  // create the repeated pusher updates
  function createRepeatedUpdateEvents() {
    if(pjs != null) {
      intervalId = setInterval(function(){
        sendUpdate();
        //printDebugInfo();
      }, 100); // send every 100 milliseconds if position has changed
      pjs.setPusherUpdateIntervalId(intervalId);
    }
    else
      setTimeout(createRepeatedUpdateEvents,250);
  }

  // obtain a reference to the processing sketch
  function getPjsInstance() {
    var bound = false;
    pjs = Processing.getInstanceById('mycanvas');
    if(pjs != null)
      bound = true;
    if(!bound)
      setTimeout(getPjsInstance, 250);
  } 

  // the repeated update where each local fish tells others about itself
  function sendUpdate(){
    var myFish = pjs.getMyFish();
    var myFood = pjs.getMyFood();
    channel.trigger("client-update",
      {
        myLocation: myFish.getLocation(),
        mousePosition: myFish.getMousePosition(),
        stripeColor: myFish.getStripeColor(),
        id: myFish.getId(),
        maxSpeed: myFish.getMaxSpeed(),
        maxForce: myFish.getMaxForce(),
        bodySizeW: myFish.getBodySizeW(),
        bodySizeH: myFish.getBodySizeH(),
        velocity: myFish.getVelocity(),
        canonicalUnModdedLocation: myFish.getCanonicalUnModdedLocation(),
        originalBodySizeW: myFish.getOriginalBodySizeW(),
        originalBodySizeH: myFish.getOriginalBodySizeH(),
        startFade: myFish.getStartFade(),

        foodLocation: myFood.getLocation(),
        foodVelocity: myFood.getVelocity(),
        foodIsDead: myFood.getIsDead(),
        foodId: myFood.getId(),
        foodColor: myFood.getColor(),
        foodAge: myFood.getAge(),
        foodIsDummy: myFood.getIsDummy(),
      });
  }

  function printDebugInfo() {
    myFish = pjs.getMyFish();
    document.getElementById('debugger').innerHTML = myFish.getId();
  } 

   })();

