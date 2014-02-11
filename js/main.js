var gravity = 0.25;
var velocity = -5;
var position = 200;
var rotation = 0;

$(document).ready(function() {
   var updaterate = 1000.0 / 60.0 ; //60 times a second
   setInterval(mainloop, updaterate);
});

function mainloop() {
   var player = $("#player");
   velocity += gravity;
   position += velocity;
   
   //bounce (for testing)
   if(position > (player.parent().height() - player.height()))
      velocity = -velocity;
   
   //rotation
   //-10 and over should be 15 degrees rotated up
   //0 should be flat (obviously)
   //10 and over should be totally face down
   rotation = (velocity / 10) * 90;
   if(rotation > 90)
      rotation = 90;
   
   player.css({ rotate: rotation });
   player.css('top', position +'px');
}

$(document).click(function(e) { 
   //click?
   if (e.button == 0) {
      playerJump();
   }
});

function playerJump()
{
   velocity = -6;
}