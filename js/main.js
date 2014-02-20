/*
   Copyright 2014 Nebez Briefkani
   floppybird - main.js

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
(function( floppybird, $, undefined ) {

   //Make options public so they can be updated from the console at anytime.
   floppybird.options = {
      debugmode: false,
      easymode: false
   };

   //Define global variables
   var currentstate,
      gravity = 0.25,
      velocity,
      position = 180,
      rotation,
      jump = -4.6,
      score,
      highscore = 0,
      pipeheight = 90,
      pipewidth = 52,
      pipes = new Array(),
      replayclickable = false,
      updaterate = 1000.0 / 60.0,
      //elements
      $player = $("#player"),
      $scoreboard = $("#scoreboard"),
      $splashScreen = $("#splash"),
      $ceiling = $("#ceiling"),
      $land = $("#land"),
      //sounds
      volume = 30,
      soundJump = new buzz.sound("assets/sounds/sfx_wing.ogg"),
      soundScore = new buzz.sound("assets/sounds/sfx_point.ogg"),
      soundHit = new buzz.sound("assets/sounds/sfx_hit.ogg"),
      soundDie = new buzz.sound("assets/sounds/sfx_die.ogg"),
      soundSwoosh = new buzz.sound("assets/sounds/sfx_swooshing.ogg"),
      loopGameloop,
      loopPipeloop,
      playerBoundingBox,
      pipeBoundingBox;

   var states = Object.freeze({
      SplashScreen: 0,
      GameScreen: 1,
      ScoreScreen: 2
   });

   function GamePlay() {
      this.velocity = 0;
      this.position = 180;
      this.rotation = 0;
      this.score = 0;
      this.savedscore = getCookie("highscore");
   }

   GamePlay.prototype.sethighScore = function() {
      if(this.savedscore != "")
         this.highscore = parseInt(this.savedscore);
      console.log(this);
   }

   function Screens() {
      this.$splashScreen = $("#splash");
      this.$scoreboard = $("#scoreboard");
   }

   Screens.prototype.showSplashScreen = function() {
      GamePlay.currentstate = states.SplashScreen;
      setDefaults();

      //update the player in preparation for the next game
      $player.css({ y: 0, x: 0});
      updatePlayer();

      soundSwoosh.stop();
      soundSwoosh.play();

      //clear out all the pipes if there are any
      $(".pipe").remove();
      pipes = new Array();

      //make everything animated again
      setAnimation('running');

      //fade in the splash
      this.$splashScreen.transition({ opacity: 1 }, 2000, 'ease');
   }

floppybird.newGame = function () {
   var GamePlayvar = new GamePlay();
       GamePlayvar.sethighScore();

   var Screensvar = new Screens();
       Screensvar.showSplashScreen();
};

   $(document).ready(function() {
      init();
   });

   function init() {
      buzz.all().setVolume(volume);

      if(window.location.search == "debug") {
         floppybird.options.debugmode = true;
      }
      if(window.location.search == "easy" || floppybird.options.easymode == true) {
         floppybird.options.easymode = true;
         pipeheight = 200;
      }

      //get the highscore
      //getHighScore();

      //start with the splash screen
      //showSplash();
   }

   function getCookie(cname)
   {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for(var i=0; i<ca.length; i++)
      {
         var c = ca[i].trim();
         if (c.indexOf(name)==0) return c.substring(name.length,c.length);
      }
      return "";
   }

   function setCookie(cname,cvalue,exdays)
   {
      var d = new Date();
      d.setTime(d.getTime()+(exdays*24*60*60*1000));
      var expires = "expires="+d.toGMTString();
      document.cookie = cname + "=" + cvalue + "; " + expires;
   }

   function setDefaults()
   {
      velocity = 0;
      position = 180;
      rotation = 0;
      score = 0;
   }

   function setAnimation(status)
   {
      $(".animated").css({'animation-play-state': status, '-webkit-animation-play-state': status});
   }

   function showSplash()
   {
      currentstate = states.SplashScreen;
      setDefaults();

      //update the player in preparation for the next game
      $player.css({ y: 0, x: 0});
      updatePlayer();

      soundSwoosh.stop();
      soundSwoosh.play();

      //clear out all the pipes if there are any
      $(".pipe").remove();
      pipes = new Array();

      //make everything animated again

      setAnimation('running');

      //fade in the splash
      $splashScreen.transition({ opacity: 1 }, 2000, 'ease');
   }

   function startGame()
   {
      currentstate = states.GameScreen;

      //fade out the splash
      $splashScreen.stop().transition({ opacity: 0 }, 500, 'ease');

      //update the big score
      setBigScore();

      //debug mode?
      if(floppybird.options.debugmode)
      {
         //show the bounding boxes
         $(".boundingbox").show();
      }

      //start up our loops
      loopGameloop = setInterval(gameloop, updaterate);
      loopPipeloop = setInterval(updatePipes, 1400);

      //jump from the start!
      playerJump();
   }

   function updatePlayer()
   {
      //rotation
      rotation = Math.min((velocity / 10) * 90, 90);

      //apply rotation and position
      $player.css({ rotate: rotation, top: position });
   }

   function gameloop() {

      //update the player speed/position
      velocity += gravity;
      position += velocity;

      //update the player
      updatePlayer();

      //create the bounding box
      var box = document.getElementById('player').getBoundingClientRect(),
         origwidth = 34.0,
         origheight = 24.0,
         boxwidth = origwidth - (Math.sin(Math.abs(rotation) / 90) * 8),
         boxheight = (origheight + box.height) / 2,
         boxleft = ((box.width - boxwidth) / 2) + box.left,
         boxtop = ((box.height - boxheight) / 2) + box.top,
         boxright = boxleft + boxwidth,
         boxbottom = boxtop + boxheight;

      //did we hit the ground?
      if(box.bottom >= $land.offset().top)
      {
         playerDead();
         return;
      }
      //we can't go any further without a pipe
      if(pipes[0] == null)
         return;
      //determine the bounding box of the next pipes inner area
      var nextpipe = pipes[0],
         nextpipeupper = nextpipe.children(".pipe_upper"),
         pipetop = nextpipeupper.offset().top + nextpipeupper.height(),
         pipeleft = nextpipeupper.offset().left - 2, // for some reason it starts at the inner pipes offset, not the outer pipes.
         piperight = pipeleft + pipewidth,
         pipebottom = pipetop + pipeheight;

      //if we're in debug mode, draw the bounding boxes
      if(floppybird.options.debugmode)
      {
         playerBoundingBox = $("#playerbox");
         playerBoundingBox.css({left: boxleft, top: boxtop, height: boxheight, width: boxwidth});
         pipeBoundingBox = $("#pipebox");
         pipeBoundingBox.css({left: pipeleft, top: pipetop, height: pipeheight, width: pipewidth});
      }

      //have they tried to escape through the ceiling? :o
      if(boxtop <= ($ceiling.offset().top + $ceiling.height()))
         position = 0;

      //have we gotten inside the pipe yet?
      if(boxright > pipeleft)
      {
         //we're within the pipe, have we passed between upper and lower pipes?
         if(boxtop > pipetop && boxbottom < pipebottom)
         {
            //yeah! we're within bounds

         }
         else
         {
            //no! we touched the pipe
            playerDead();
            return;
         }
      }

      //have we passed the imminent danger?
      if(boxleft > piperight)
      {
         //yes, remove it
         pipes.splice(0, 1);

         //and score a point
         playerScore();
      }
   }

   //Handle space bar
   $(document).keydown(function(e){
      //space bar!
      if(e.keyCode == 32)
      {
         //in ScoreScreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
         if(currentstate == states.ScoreScreen)
            $("#replay").click();
         else
            screenClick();
      }
   });

   //Handle mouse down OR touch start
   if("ontouchstart" in window)
      $(document).on("touchstart", screenClick);
   else
      $(document).on("mousedown", screenClick);

   function screenClick()
   {
      if(currentstate == states.GameScreen)
      {
         playerJump();
      }
      else if(currentstate == states.SplashScreen)
      {
         startGame();
      }
   }

   function playerJump()
   {
      velocity = jump;
      //play jump sound
      soundJump.stop();
      soundJump.play();
   }

   function setBigScore(erase)
   {
      var elemscore = $("#bigscore");
      elemscore.empty();

      if(erase)
         return;

      var digits = score.toString().split('');
      for(var i = 0; i < digits.length; i++)
         elemscore.append("<img src='assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
   }

   function setSmallScore()
   {
      var elemscore = $("#currentscore");
      elemscore.empty();

      var digits = score.toString().split('');
      for(var i = 0; i < digits.length; i++)
         elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
   }

   function setHighScore()
   {
      var elemscore = $("#highscore");
      elemscore.empty();

      var digits = highscore.toString().split('');
      for(var i = 0; i < digits.length; i++)
         elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
   }

   function setMedal()
   {
      var elemmedal = $("#medal"),
         medal;

      if (score > 10){
         switch (score) {
            case (score >= 10):
               medal = "bronze";
               break;

            case (score >= 20):
               medal = "silver";
               break;

            case (score >= 30):
               medal = "gold";
               break;

            case (score >= 40):
               medal = "platinum";
               break;
         }

         elemmedal.empty();
         elemmedal.append('<img src="assets/medal_' + medal +'.png" alt="' + medal +'">');

         //signal that a medal has been won
         return true;

      } else {
         return false;
      }
   }

   function playerDead()
   {
      //stop animating everything!
      setAnimation('paused');

      //drop the bird to the floor
      var playerbottom = $player.position().top + $player.width(); //we use width because he'll be rotated 90 deg
      var floor = $("#flyarea").height();
      var movey = Math.max(0, floor - playerbottom);
      $player.transition({ y: movey + 'px', rotate: 90}, 1000, 'easeInOutCubic');

      //it's time to change states. as of now we're considered ScoreScreen to disable left click/flying
      currentstate = states.ScoreScreen;

      //destroy our gameloops
      clearInterval(loopGameloop);
      clearInterval(loopPipeloop);
      loopGameloop = null;
      loopPipeloop = null;

      //mobile browsers don't support buzz bindOnce event
      if(isIncompatible.any()) {
         //skip right to showing score
         showScore();
      } else {
         //play the hit sound (then the dead sound) and then show score
         soundHit.play().bindOnce("ended", function() {
            soundDie.play().bindOnce("ended", function() {
               showScore();
            });
         });
      }
   }

   function showScore()
   {
      //unhide us
      $scoreboard.css("display", "block");

      //remove the big score
      setBigScore(true);

      //have they beaten their high score?
      if(score > highscore)
      {
         //yeah!
         highscore = score;
         //save it!
         setCookie("highscore", highscore, 999);
      }

      //update the scoreboard
      setSmallScore();
      setHighScore();

      //SWOOSH!
      soundSwoosh.stop();
      soundSwoosh.play();

      //show the scoreboard
      $scoreboard.css({ y: '40px', opacity: 0 }); //move it down so we can slide it up
      $("#replay").css({ y: '40px', opacity: 0 });
      $scoreboard.transition({ y: '0px', opacity: 1}, 600, 'ease', function() {
         //When the animation is done, animate in the replay button and SWOOSH!
         soundSwoosh.stop();
         soundSwoosh.play();
         $("#replay").transition({ y: '0px', opacity: 1}, 600, 'ease');

         //also animate in the MEDAL! WOO!
         if(setMedal())
         {
            $("#medal").css({ scale: 2, opacity: 0 });
            $("#medal").transition({ opacity: 1, scale: 1 }, 1200, 'ease');
         }
      });

      //make the replay button clickable
      replayclickable = true;
   }

   $("#replay").click(function() {
      //make sure we can only click once
      if(!replayclickable)
         return;
      else
         replayclickable = false;
      //SWOOSH!
      soundSwoosh.stop();
      soundSwoosh.play();

      //fade out the scoreboard
      $("#scoreboard").transition({ y: '-40px', opacity: 0}, 1000, 'ease', function() {
         //when that's done, display us back to nothing
         $("#scoreboard").css("display", "none");
         //start the game over!
         showSplash();
      });
   });

   function playerScore()
   {
      score += 1;
      //play score sound
      soundScore.stop();
      soundScore.play();
      setBigScore();
   }

   function updatePipes()
   {
      //Do any pipes need removal?
      $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()

      //add a new pipe (top height + bottom height  + pipeheight == 420) and put it in our tracker
      var padding = 80;
      var constraint = 420 - pipeheight - (padding * 2); //double padding (for top and bottom)
      var topheight = Math.floor((Math.random()*constraint) + padding); //add lower padding
      var bottomheight = (420 - pipeheight) - topheight;
      var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomheight + 'px;"></div></div>');
      $("#flyarea").append(newpipe);
      pipes.push(newpipe);
   }

   var isIncompatible = {
      Android: function() {
      return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function() {
      return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function() {
      return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function() {
      return navigator.userAgent.match(/Opera Mini/i);
      },
      Safari: function() {
      return (navigator.userAgent.match(/OS X.*Safari/) && ! navigator.userAgent.match(/Chrome/));
      },
      Windows: function() {
      return navigator.userAgent.match(/IEMobile/i);
      },
      any: function() {
      return (isIncompatible.Android() || isIncompatible.BlackBerry() || isIncompatible.iOS() || isIncompatible.Opera() || isIncompatible.Safari() || isIncompatible.Windows());
      }
   };
}( window.floppybird = window.floppybird || {}, jQuery ));