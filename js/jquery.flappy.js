;(function($, window, undefined){

    var Conf = {
        // debug mode enabled flag
        debug: false,
        updateRate: {
            game: 1000.0 / 60.0, // 60 times a second
            pipe: 1500 //1400
        },
        // Prevents object manipulation
        states: {
            SplashScreen: 0,
            GameScreen: 1,
            ScoreScreen: 2
        },

        // Game options and constants
        Game: {
            score: 0,
            highscore: 0,

            layout: {
                pipeHeight: 90,
                pipeWidth: 52,
                birdWidth: 34,
                birdHeight: 24
            },

            constrains: {
                gravity: 0.23, //25
                velocity: 0,
                position: 180,
                rotation: 0,
                jump: -4.6
            }
        }
    };

    var Sound = {
        // sound enabled flag
        enabled: true,
        volume: 30,
        sounds: {
            jump: new buzz.sound("assets/sounds/sfx_wing.ogg"),
            score: new buzz.sound("assets/sounds/sfx_point.ogg"),
            hit: new buzz.sound("assets/sounds/sfx_hit.ogg"),
            die: new buzz.sound("assets/sounds/sfx_die.ogg"),
            swoosh: new buzz.sound("assets/sounds/sfx_swooshing.ogg")
        }
    };

    /**
     * Game engine object
     *
     * @type {Object}
     */
    var Flap = {

        Intervals: {
            pipe: null,
            game: null
        },

        Selectors: {
            $player: $('#player'),
            $splash: $('#splash'),
            $scoreboard: $("#scoreboard"),
            $flyarea: $("#flyarea"),
            $currentscore: $("#currentscore"),
            $bigscore: $("#bigscore"),
            $highscore: $("#highscore"),
            $replay: $("#replay"),
            $medal: $("#medal")
        },

        options: {
            rotation: Conf.Game.constrains.rotation,
            velocity: Conf.Game.constrains.velocity,
            position: Conf.Game.constrains.position,
            gravity: Conf.Game.constrains.gravity
        },

        pipes: new Array(),
        currentstate: Conf.states.SplashScreen,
        replayclickable: true,

        score: Conf.Game.score,
        highscore: Conf.Game.score,

        init: function () {
            this.initSound();
            this.clearScene();
            this.addEventHandlers();
            this.showSplash();
        },

        update: function () {
            this.Intervals.game = setInterval(this.gameLoop, Conf.updateRate.game);
            this.Intervals.pipe = setInterval(this.pipeLoop, Conf.updateRate.pipe);
        },

        addEventHandlers: function(){
            var _self = this;

            $('#gamescreen').on('click', function(){

                _self.screenClick();
            });

            $(document).on('keyup', function(e){
                // play on space key also
                if (e.keyCode == 32) {
                    _self.screenClick();
                }
            });

            this.Selectors.$replay.click(function() {

                //make sure we can only click once
                if(!_self.replayclickable){
                    return;
                }else {
                    _self.replayclickable = false;
                }

                //SWOOSH!
                _self.playSound(Sound.sounds.swoosh);

                //fade out the scoreboard
                _self.Selectors.$scoreboard.transition({ y: '-40px', opacity: 0}, 1000, 'ease', function() {
                    _self.currentstate = Conf.states.SplashScreen;

                    //when that's done, display us back to nothing
                    _self.Selectors.$scoreboard.css("display", "none");

                    _self.clearScene();
                    _self.resetOptions();
                    //start the game over!
                    _self.showSplash();
                });
            });
        },

        /**
         * Clear scene before game starts
         */
        clearScene: function () {
            var $pipes = $('.pipe');

            $pipes.remove();
            this.pipes = new Array();
        },

        resetOptions: function(){
            //set defaults
            this.options.velocity = 0;
            this.options.position = 180;
            this.options.rotation = 0;
            this.score = 0;

            this.Selectors.$player.css({
                top: Conf.Game.constrains.position,
                rotate: 0
            });
        },

        initSound: function () {
            buzz.all().setVolume(Sound.volume);
        },

        /**
         * Sound play wrapper
         * @param sound
         */
        playSound: function (sound) {
            if(Sound.enabled){
                sound.stop();
                sound.play();
            }
        },

        showSplash: function () {
            var $animated = $(".animated"),
                savedscore;

            savedscore = parseInt(CookieManager.getCookie("highscore"));

            this.resetOptions();

            if(savedscore > 0)
                this.highscore = savedscore;

            $animated.css('animation-play-state', 'running');
            $animated.css('-webkit-animation-play-state', 'running');

            this.Selectors.$splash.transition({
                opacity: 1
            }, 2000, 'ease');

        },

        /**
         * Update player position
         */
        updatePlayer: function () {
            var _self = this;

            this.options.rotation = Math.min((_self.options.velocity / 10) * 90, 90);

            this.Selectors.$player.css({
                rotate: _self.options.rotation,
                top: _self.options.position
            });
        },

        /**
         * Check player collision
         */
        colisionCheck: function(){
            var _self = Flap, // set scope
                box , boxwidth, boxheight, boxtop, boxleft, boxright, boxbottom,
                nextpipe, nextpipeupper, pipetop, pipeleft, piperight, pipebottom;

            //create the bounding box
            box = document.getElementById('player').getBoundingClientRect();

            boxwidth = Conf.Game.layout.birdWidth - (Math.sin(Math.abs(_self.options.rotation) / 90) * 8);
            boxheight = (Conf.Game.layout.birdHeight + box.height) / 2;

            boxleft = ((box.width - boxwidth) / 2) + box.left;
            boxtop = ((box.height - boxheight) / 2) + box.top;
            boxright = boxleft + boxwidth;
            boxbottom = boxtop + boxheight;

            //if we're in debug mode, draw the bounding box
            if (Conf.debug) {
                var boundingbox = $("#playerbox");
                boundingbox.css('left', boxleft);
                boundingbox.css('top', boxtop);
                boundingbox.css('height', boxheight);
                boundingbox.css('width', boxwidth);
            }

            //did we hit the ground?
            if (box.bottom >= $("#land").offset().top) {
                _self.playerDead();
                return;
            }

            //have they tried to escape through the ceiling? :o
            var ceiling = $("#ceiling");
            if (boxtop <= (ceiling.offset().top + ceiling.height()))
                position = 0;

            //we can't go any further without a pipe
            if (_self.pipes[0] == null)
                return;

            //determine the bounding box of the next pipes inner area
            nextpipe = _self.pipes[0];
            nextpipeupper = nextpipe.children(".pipe_upper");

            pipetop = nextpipeupper.offset().top + nextpipeupper.height();
            pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
            piperight = pipeleft + Conf.Game.layout.pipeWidth;
            pipebottom = pipetop + Conf.Game.layout.pipeHeight;

            if (Conf.debug) {
                var boundingbox = $("#pipebox");
                boundingbox.css('left', pipeleft);
                boundingbox.css('top', pipetop);
                boundingbox.css('height', Conf.Game.layout.pipeHeight);
                boundingbox.css('width', Conf.Game.layout.pipeWidth);
            }

            //have we gotten inside the pipe yet?
            if (boxright > pipeleft) {
                //we're within the pipe, have we passed between upper and lower pipes?
                if (!(boxtop > pipetop && boxbottom < pipebottom)) {

                    //no! we touched the pipe
//                    alert('player dead again');
                    if((boxright - pipeleft) > 3){
                        _self.playerDead(pipetop);
                    }else {
                        _self.playerDead();
                    }
                    return;
                }
            }

            //have we passed the imminent danger?
            if (boxleft > piperight) {
                //yes, remove it
                _self.pipes.splice(0, 1);

                //and score a point
                _self.playerScore();
            }
        },

        /**
         * Game loop, updates game and controls player interaction
         */
        gameLoop: function () {
           var _self = Flap;

            //update the player speed/position
            _self.options.velocity += _self.options.gravity;
            _self.options.position += _self.options.velocity;

            //update the player
            _self.updatePlayer();
            _self.colisionCheck();

        },

        /**
         * Pipe loop, creates pipes and runs on separate time gauge
         */
        pipeLoop: function () {
            var _self = Flap, // needs to set context because setInterval calls function passed with window scope
                padding, constraint, topHeight, bottomHeight, newpipe;
            //Do any pipes need removal?
            $(".pipe").filter(function () {
                return $(this).position().left <= -100;
            }).remove();

            //add a new pipe (top height + bottom height  + Conf.Game.layout.pipeHeight == 420) and put it in our tracker
            padding = 80;
            constraint = 420 - Conf.Game.layout.pipeHeight - (padding * 2); //double padding (for top and bottom)
            topHeight = Math.floor((Math.random() * constraint) + padding); //add lower padding
            bottomHeight = (420 - Conf.Game.layout.pipeHeight) - topHeight;

            newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: ' + topHeight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomHeight + 'px;"></div></div>');

            _self.Selectors.$flyarea.append(newpipe);

            _self.pipes.push(newpipe);
        },

        /**
         * If collision is detected player is disabled
         *
         * @param pipetop {int} coordinates of top of pipe that is hit so if player hit pipe he should fall on pipe not on the ground,
         */
        playerDead: function (pipetop) {
            var floor, movey,
                $animated = $('.animated');

            pipetop = pipetop || false;

            //stop animating everything!
            $animated.css('animation-play-state', 'paused');
            $animated.css('-webkit-animation-play-state', 'paused');

            floor = this.Selectors.$flyarea.height();
            movey = !pipetop ? floor - this.Selectors.$player.width() + 5 : pipetop + Conf.Game.layout.pipeHeight - Conf.Game.layout.birdWidth + 5;

            this.Selectors.$player.animate({
               top: movey,
               rotate: 90
            },700);

            //it's time to change states. as of now we're considered ScoreScreen to disable left click/flying
            this.currentstate = Conf.states.ScoreScreen;

            //destroy loops
            clearInterval(this.Intervals.game);
            clearInterval(this.Intervals.pipe);

            this.Intervals.game = null;
            this.Intervals.pipe = null;

            this.playSound(Sound.sounds.die);
            this.showScore();


        },

        /**
         * Increment player score
         */
        playerScore: function () {
            this.score += 1;
            //play score sound
            this.playSound(Sound.sounds.score);
            this.setBigScore();
        },

        setSmallScore: function(){
            var digits;

            this.Selectors.$currentscore.empty();
            
            digits = this.score.toString().split('');

            for(var i = 0; i < digits.length; i++){
                this.Selectors.$currentscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
            }

        },

        setBigScore: function (erase) {
            this.Selectors.$bigscore.empty();
            erase = erase || false;
            
            if(erase){
                return;
            }

            var digits = this.score.toString().split('');
            for(var i = 0; i < digits.length; i++){
                this.Selectors.$bigscore.append("<img src='assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
            }

        },

        setHighScore: function(){
            var elemscore = this.Selectors.$highscore,
                digits = this.highscore.toString().split('');
            
            elemscore.empty();
            
            for(var i = 0; i < digits.length; i++){
                elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");                
            }

        },

        startGame: function () {
            this.currentstate = Conf.states.GameScreen;
            //fade out the splash
            this.Selectors.$splash.stop();
            this.Selectors.$splash.transition({
                opacity: 0
            }, 500, 'ease');

            //update the big score
            this.setBigScore();

            //debug mode?
            if (Conf.debug) {
                //show the bounding boxes
                $(".boundingbox").show();
            }

            //set game intervals
            this.update();
            //jump from the start!
            this.playerJump();
        },

        playerJump: function () {
            this.options.velocity = Conf.Game.constrains.jump;
            //play jump sound
            this.playSound(Sound.sounds.jump);
        },

        screenClick: function () {

            if(this.currentstate == Conf.states.GameScreen) {
                this.playerJump();
            } else if (this.currentstate == Conf.states.SplashScreen) {
                this.startGame();
            }
        },

        setMedal: function(){

            this.Selectors.$medal.empty();

            if(this.score < 10)
            //signal that no medal has been won
                return false;

            if(this.score >= 10){
                medal = "bronze";
            }
            if(this.score >= 20){
                medal = "silver";
            }
            if(this.score >= 30){
                medal = "gold";
            }
            if(this.score >= 40){
                medal = "platinum";
            }

            this.Selectors.$medal.append('<img src="assets/medal_' + medal +'.png" alt="' + medal +'">');

            //signal that a medal has been won
            return true;
        },

        showScore: function(){
            var _self = this;
            //unhide us
            this.Selectors.$scoreboard.css("display", "block");

            //remove the big score
            this.setBigScore(true);

            //have they beaten their high score?
            if(this.score > this.highscore) {
                //yeah!
                this.highscore = this.score;
                //save it!
                CookieManager.setCookie("highscore", highscore, 999);
            }

            //update the scoreboard
            this.setSmallScore();
            this.setHighScore();
            var wonmedal = this.setMedal();

            //SWOOSH!
            _self.playSound(Sound.sounds.swoosh);

            //show the scoreboard
            _self.Selectors.$scoreboard.css({ y: '40px', opacity: 0 }); //move it down so we can slide it up
            this.Selectors.$replay.css({ y: '40px', opacity: 0 });
            _self.Selectors.$scoreboard.transition({ y: '0px', opacity: 1}, 600, 'ease', function() {
                //When the animation is done, animate in the replay button and SWOOSH!
                _self.playSound(Sound.sounds.swoosh);
                _self.Selectors.$replay.transition({ y: '0px', opacity: 1}, 600, 'ease');

                //also animate in the MEDAL! WOO!
                if(wonmedal)
                {
                    _self.Selectors.$medal.css({ scale: 2, opacity: 0 });
                    _self.Selectors.$medal.transition({ opacity: 1, scale: 1 }, 1200, 'ease');
                }
            });

            //make the replay button clickable
            _self.replayclickable = true;
        }
    };

    /**
     * Handles cookies
     * @type {{setCookie: setCookie, getCookie: getCookie}}
     */
    var CookieManager = {

        setCookie: function(cname,cvalue,exdays){
            var d = new Date();
            d.setTime(d.getTime()+(exdays*24*60*60*1000));
            var expires = "expires="+d.toGMTString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        },

        getCookie: function (cname){
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++)
            {
                var c = ca[i].trim();
                if (c.indexOf(name)==0) return c.substring(name.length,c.length);
            }
            return "";
        }

    };

    $(document).ready(function () {
        Flap.init();
    });


})(jQuery, window);