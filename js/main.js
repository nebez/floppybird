var gravity = 0.25;
var velocity = -5.5;
var position = 180;
var rotation = 0;
var score = 0;
var debugmode = true;
var pipes = new Array();

$(document).ready(function() {
   //debug mode?
   if(debugmode)
   {
      //show the bounding box
      $(".boundingbox").show();
   }
   var updaterate = 1000.0 / 60.0 ; //60 times a second
   setInterval(mainloop, updaterate);
   setInterval(updatePipes, 1350);
});

function mainloop() {
   var player = $("#player");
   
   //update the player speed/position
   velocity += gravity;
   position += velocity;
   
   //rotation
   rotation = Math.min((velocity / 10) * 90, 90);
   
   //apply it
   player.css({ rotate: rotation, top: position });
   
   //create the bounding box
   var box = document.getElementById('player').getBoundingClientRect();
   var origwidth = 34.0;
   var origheight = 24.0;
   
   var boxwidth = origwidth - (Math.sin(Math.abs(rotation) / 90) * 8);
   var boxheight = (origheight + box.height) / 2;
   var boxleft = ((box.width - boxwidth) / 2) + box.left;
   var boxtop = ((box.height - boxheight) / 2) + box.top;
   var boxright = boxleft + boxwidth;
   var boxbottom = boxtop + boxheight;
   
   //if we're in debug mode, draw the bounding box
   if(debugmode)
   {
      var boundingbox = $("#playerbox");
      boundingbox.css('left', boxleft);
      boundingbox.css('top', boxtop);
      boundingbox.css('height', boxheight);
      boundingbox.css('width', boxwidth);
      
      //bounce
      if(box.bottom >= $("#land").offset().top)
         velocity = -velocity;
   }
   
   //we can't go any further without a pipe
   if(pipes[0] == null)
      return;
   
   //determine the box of the next pipe
   var nextpipe = pipes[0];
   var nextpipeupper = nextpipe.children(".pipe_upper");
   
   var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
   var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
   var pipewidth = 52;
   var pipeheight = 120;
   var piperight = pipeleft + pipewidth;
   var pipebottom = pipetop + pipeheight;
   
   if(debugmode)
   {
      //$("#debug").text(pipeupper + " - " + pipelower);
      var boundingbox = $("#pipebox");
      boundingbox.css('left', pipeleft);
      boundingbox.css('top', pipetop);
      boundingbox.css('height', pipeheight);
      boundingbox.css('width', pipewidth);
   }
   
   //have we gotten inside the pipe yet?
   if(boxright > pipeleft)
   {
      //we're within the pipe, have we passed through it?
      if(boxtop > pipetop && boxbottom < pipebottom)
      {
         //yeah! we're through.
         $("#debug").text("");
      }
      else
      {
         //no! we touched the pipe
      $("#debug").text("DEAD!");
      }
   }
   
   //have we passed the imminent danger?
   if(boxleft > piperight)
   {
      //yes, remove it
      pipes.splice(0, 1);
      //and maybe add something to our score?!
      score += 1;
   }
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

function updatePipes()
{
   //Do any pipes need removal?
   $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()
   
   //add a new pipe (top height + bottom height == 300) and put it in our tracker
   var topheight = Math.floor((Math.random()*150) + 75); //generate random int between 75 - 225
   var bottomheight = 300 - topheight;
   var newpipe = $('<div class="pipe"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomheight + 'px;"></div></div>');
   $("#flyarea").append(newpipe);
   pipes.push(newpipe);
}