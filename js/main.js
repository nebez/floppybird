var gravity = 0.7;
var velocity = -5;
var position = 200;

$(document).ready(function() {
   var updaterate = 1000.0 / 30.0 ; //60 times a second
   setInterval(mainloop, updaterate);
});

function mainloop() {
   var player = $("#player");
   velocity += gravity;
   position += velocity;
   
   //bounce (for testing)
   if(position > (player.parent().height() - player.height()))
      velocity = -velocity;
   
   player.css('top', position +'px');
   console.log(position);
}

$(document).click(function(e) { 
   //click?
   if (e.button == 0) {
      playerJump();
   }
});

function playerJump()
{
   velocity = -10;
}