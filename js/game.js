"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var GameState;
(function (GameState) {
    GameState[GameState["Loading"] = 0] = "Loading";
    GameState[GameState["SplashScreen"] = 1] = "SplashScreen";
    GameState[GameState["Playing"] = 2] = "Playing";
    GameState[GameState["PlayerDying"] = 3] = "PlayerDying";
    GameState[GameState["PlayerDead"] = 4] = "PlayerDead";
    GameState[GameState["ScoreScreen"] = 5] = "ScoreScreen";
})(GameState || (GameState = {}));
var sounds = {
    jump: new Howl({ src: ['assets/sounds/sfx_wing.ogg'], volume: 0.3 }),
    score: new Howl({ src: ['assets/sounds/sfx_point.ogg'], volume: 0.3 }),
    hit: new Howl({ src: ['assets/sounds/sfx_hit.ogg'], volume: 0.3 }),
    die: new Howl({ src: ['assets/sounds/sfx_die.ogg'], volume: 0.3 }),
    swoosh: new Howl({ src: ['assets/sounds/sfx_swooshing.ogg'], volume: 0.3 }),
};
var wait = function (time) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, new Promise(function (resolve) {
                setTimeout(resolve, time);
            })];
    });
}); };
var log = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(console, __spreadArray(["[" + Date.now() + "]"], __read(args), false));
};
var toRad = function (degrees) {
    return degrees * Math.PI / 180;
};
var isBoxIntersecting = function (a, b) {
    return (a.x <= (b.x + b.width) &&
        b.x <= (a.x + a.width) &&
        a.y <= (b.y + b.height) &&
        b.y <= (a.y + a.height));
};
var GameDebugger = (function () {
    function GameDebugger(enabled) {
        this.domState = document.getElementById('debug-state');
        this.domBoxContainer = document.getElementById('debug');
        this.domBoxes = new Map();
        this.enabled = enabled;
    }
    GameDebugger.prototype.drawBox = function (key, box) {
        if (!this.enabled) {
            return;
        }
        if (!this.domBoxes.has(key)) {
            var newDebugBox = document.createElement('div');
            newDebugBox.className = 'boundingbox';
            this.domBoxContainer.appendChild(newDebugBox);
            this.domBoxes.set(key, newDebugBox);
        }
        var boudingBox = this.domBoxes.get(key);
        if (boudingBox == null) {
            log("couldn't create a debug box for " + key);
            return;
        }
        boudingBox.style.top = box.y + "px";
        boudingBox.style.left = box.x + "px";
        boudingBox.style.width = box.width + "px";
        boudingBox.style.height = box.height + "px";
    };
    GameDebugger.prototype.resetBoxes = function () {
        var _this = this;
        if (!this.enabled) {
            return;
        }
        this.domBoxes.forEach(function (debugBox, pipe) {
            if (pipe.className.includes('pipe')) {
                debugBox.remove();
                _this.domBoxes.delete(pipe);
            }
        });
    };
    GameDebugger.prototype.logStateChange = function (oldState, newState) {
        if (!this.enabled) {
            return;
        }
        log('Changing state', GameState[oldState], GameState[newState]);
        this.domState.innerText = GameState[newState];
    };
    return GameDebugger;
}());
var gameDebugger = new GameDebugger(true);
var Game = (function () {
    function Game(domElements) {
        this.domElements = domElements;
        this.bird = new Bird(domElements.bird, {
            gravity: 0.25,
            jumpVelocity: -4.6,
            flightAreaBox: domElements.flightArea.getBoundingClientRect(),
        });
        this.pipes = new PipeManager(domElements.flightArea);
        this.land = new Land(domElements.land);
        this.state = GameState.Loading;
        requestAnimationFrame(this.draw.bind(this));
    }
    Game.prototype.onScreenTouch = function () {
        if (this.state === GameState.Playing) {
            this.bird.jump();
        }
        else if (this.state === GameState.SplashScreen) {
            this.start();
        }
        else if (this.state === GameState.ScoreScreen) {
            this.reset();
        }
    };
    Game.prototype.splash = function () {
        return __awaiter(this, void 0, void 0, function () {
            var splashImage;
            return __generator(this, function (_a) {
                splashImage = document.getElementById('splash');
                splashImage.classList.add('visible');
                sounds.swoosh.play();
                this.state = GameState.SplashScreen;
                return [2];
            });
        });
    };
    Object.defineProperty(Game.prototype, "state", {
        get: function () {
            return this._state;
        },
        set: function (newState) {
            gameDebugger.logStateChange(this._state, newState);
            this._state = newState;
        },
        enumerable: false,
        configurable: true
    });
    Game.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            var scoreboard, replay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.state = GameState.Loading;
                        sounds.swoosh.play();
                        scoreboard = document.getElementById('scoreboard');
                        scoreboard.classList.add('slide-up');
                        return [4, wait(750)];
                    case 1:
                        _a.sent();
                        replay = document.getElementById('replay');
                        replay.classList.remove('visible');
                        scoreboard.classList.remove('visible', 'slide-up');
                        gameDebugger.resetBoxes();
                        this.pipes.removeAll();
                        this.bird.reset();
                        Array.from(document.getElementsByClassName('animated')).forEach(function (e) {
                            e.style.animationPlayState = 'running';
                            e.style.webkitAnimationPlayState = 'running';
                        });
                        this.splash();
                        return [2];
                }
            });
        });
    };
    Game.prototype.start = function () {
        var splashImage = document.getElementById('splash');
        splashImage.classList.remove('visible');
        this.state = GameState.Playing;
        this.gameLoop = setInterval(this.tick.bind(this), 1000 / 60);
        this.bird.jump();
    };
    Game.prototype.die = function () {
        return __awaiter(this, void 0, void 0, function () {
            var scoreboard, replay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        clearInterval(this.gameLoop);
                        this.state = GameState.PlayerDying;
                        Array.from(document.getElementsByClassName('animated')).forEach(function (e) {
                            e.style.animationPlayState = 'paused';
                            e.style.webkitAnimationPlayState = 'paused';
                        });
                        return [4, this.bird.die()];
                    case 1:
                        _a.sent();
                        this.state = GameState.PlayerDead;
                        return [4, wait(500)];
                    case 2:
                        _a.sent();
                        sounds.swoosh.play();
                        scoreboard = document.getElementById('scoreboard');
                        scoreboard.classList.add('visible');
                        return [4, wait(600)];
                    case 3:
                        _a.sent();
                        sounds.swoosh.play();
                        replay = document.getElementById('replay');
                        replay.classList.add('visible');
                        return [4, wait(300)];
                    case 4:
                        _a.sent();
                        this.state = GameState.ScoreScreen;
                        return [2];
                }
            });
        });
    };
    Game.prototype.tick = function () {
        var now = Date.now();
        this.bird.tick();
        this.pipes.tick(now);
        if (this.pipes.intersectsWith(this.bird.box) || this.land.intersectsWith(this.bird.box)) {
            this.die();
        }
    };
    Game.prototype.draw = function () {
        requestAnimationFrame(this.draw.bind(this));
        this.bird.draw();
    };
    return Game;
}());
var Bird = (function () {
    function Bird(domElement, flyingProperties) {
        this.domElement = domElement;
        this.flyingProperties = flyingProperties;
        this.reset();
    }
    Bird.prototype.reset = function () {
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.position = 180;
        this.rotation = 0;
        this.box = { x: 60, y: 180, width: 34, height: 24 };
    };
    Bird.prototype.jump = function () {
        this.velocity = this.flyingProperties.jumpVelocity;
        sounds.jump.play();
    };
    Bird.prototype.die = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.domElement.style.transition = "\n            transform 1s cubic-bezier(0.65, 0, 0.35, 1)\n        ";
                        this.position = this.flyingProperties.flightAreaBox.height - this.height;
                        this.rotation = 90;
                        sounds.hit.play();
                        return [4, wait(500)];
                    case 1:
                        _a.sent();
                        sounds.die.play();
                        return [4, wait(500)];
                    case 2:
                        _a.sent();
                        this.domElement.style.transition = '';
                        return [2];
                }
            });
        });
    };
    Bird.prototype.tick = function () {
        this.velocity += this.flyingProperties.gravity;
        this.rotation = Math.min((this.velocity / 10) * 90, 90);
        this.position += this.velocity;
        if (this.position < 0) {
            this.position = 0;
        }
        if (this.position > this.flyingProperties.flightAreaBox.height) {
            this.position = this.flyingProperties.flightAreaBox.height;
        }
        var rotationInRadians = Math.abs(toRad(this.rotation));
        var widthMultiplier = this.height - this.width;
        var heightMultiplier = this.width - this.height;
        this.box.width = this.width + (widthMultiplier * Math.sin(rotationInRadians));
        this.box.height = this.height + (heightMultiplier * Math.sin(rotationInRadians));
        var xShift = (this.width - this.box.width) / 2;
        var yShift = (this.height - this.box.height) / 2;
        this.box.x = 60 + xShift;
        this.box.y = this.position + yShift + this.flyingProperties.flightAreaBox.y;
    };
    Bird.prototype.draw = function () {
        gameDebugger.drawBox(this.domElement, this.box);
        this.domElement.style.transform = "\n            translate3d(0px, " + this.position + "px, 0px)\n            rotate3d(0, 0, 1, " + this.rotation + "deg)\n        ";
    };
    return Bird;
}());
var Land = (function () {
    function Land(domElement) {
        this.domElement = domElement;
        this.box = domElement.getBoundingClientRect();
        gameDebugger.drawBox(this.domElement, this.box);
    }
    Land.prototype.intersectsWith = function (box) {
        return isBoxIntersecting(this.box, box);
    };
    return Land;
}());
var Pipe = (function () {
    function Pipe() {
        this.upperBox = { x: 0, y: 0, width: 0, height: 0 };
        this.lowerBox = { x: 0, y: 0, width: 0, height: 0 };
        this.domElement = document.createElement('div');
        this.domElement.className = 'pipe animated';
        this.upperPipeDomElement = document.createElement('div');
        this.upperPipeDomElement.className = 'pipe_upper';
        this.upperPipeDomElement.style.height = '165px';
        this.lowerPipeDomElement = document.createElement('div');
        this.lowerPipeDomElement.className = 'pipe_lower';
        this.lowerPipeDomElement.style.height = '165px';
        this.domElement.appendChild(this.upperPipeDomElement);
        this.domElement.appendChild(this.lowerPipeDomElement);
    }
    Pipe.prototype.isOffScreen = function () {
        return this.upperBox.x <= -100;
    };
    Pipe.prototype.tick = function () {
        this.upperBox = this.upperPipeDomElement.getBoundingClientRect();
        this.lowerBox = this.lowerPipeDomElement.getBoundingClientRect();
        gameDebugger.drawBox(this.upperPipeDomElement, this.upperBox);
        gameDebugger.drawBox(this.lowerPipeDomElement, this.lowerBox);
    };
    Pipe.prototype.intersectsWith = function (box) {
        return isBoxIntersecting(this.upperBox, box) || isBoxIntersecting(this.lowerBox, box);
    };
    return Pipe;
}());
var PipeManager = (function () {
    function PipeManager(pipeAreaDomElement) {
        this.pipeDelay = 1400;
        this.lastPipeInsertedTimestamp = 0;
        this.pipes = [];
        this.pipeAreaDomElement = pipeAreaDomElement;
    }
    PipeManager.prototype.tick = function (now) {
        this.pipes.forEach(function (pipe) { return pipe.tick(); });
        if (now - this.lastPipeInsertedTimestamp < this.pipeDelay) {
            return;
        }
        log('inserting pipe after', now - this.lastPipeInsertedTimestamp, 'ms');
        this.lastPipeInsertedTimestamp = now;
        var pipe = new Pipe();
        this.pipes.push(pipe);
        this.pipeAreaDomElement.appendChild(pipe.domElement);
        this.pipes = this.pipes.filter(function (pipe) {
            if (pipe.isOffScreen()) {
                log('pruning a pipe');
                pipe.domElement.remove();
                return false;
            }
            return true;
        });
    };
    PipeManager.prototype.intersectsWith = function (box) {
        return this.pipes.find(function (pipe) { return pipe.intersectsWith(box); }) != null;
    };
    PipeManager.prototype.removeAll = function () {
        this.pipes.forEach(function (pipe) { return pipe.domElement.remove(); });
        this.pipes = [];
    };
    return PipeManager;
}());
(function () {
    var bird = document.getElementById('player');
    var land = document.getElementById('land');
    var flightArea = document.getElementById('flyarea');
    if (bird == null || flightArea == null || land == null) {
        throw new Error('Missing an element');
    }
    var game = new Game({ bird: bird, land: land, flightArea: flightArea });
    document.onkeydown = function (ev) { ev.keyCode == 32 && game.onScreenTouch(); };
    if ('ontouchstart' in document) {
        document.ontouchstart = game.onScreenTouch.bind(game);
    }
    else {
        document.onmousedown = game.onScreenTouch.bind(game);
    }
    game.splash();
})();
//# sourceMappingURL=game.js.map