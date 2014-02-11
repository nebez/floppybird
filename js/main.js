var gravity = 0.25;
var velocity = -5.5;
var position = 200;
var rotation = 0;

$(document).ready(function() {
   var updaterate = 1000.0 / 60.0 ; //60 times a second
   setInterval(mainloop, updaterate);
});

function mainloop() {
   var player = $("#player");
   
   //update the player speed/position
   velocity += gravity;
   position += velocity;
   
   //rotation
   rotation = Math.min((velocity / 10) * 90, 90);
   
   player.css({ rotate: rotation });
   player.css('top', position +'px');
   
   //bounce (for testing)
   if(position > (player.parent().height() - player.height()))
      velocity = -velocity;
}

//Handle space bar
$(document).keydown(function(e){
   //space bar!
   if(e.keyCode == 32)
       playerJump();
});

//Handle mouse down OR touch start
if("ontouchstart" in window)
   $(document).on("touchstart", playerJump);
else
   $(document).on("mousedown", playerJump);

function playerJump()
{
   velocity = -5.5;
}

setInterval(function() {
   $("#flyarea").append('<div class="pipe"><div class="pipe_upper" style="height: 170px;"></div><div class="pipe_lower" style="height: 130px;"></div></div>');
}, 1500);