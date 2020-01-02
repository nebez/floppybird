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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
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
    console.log.apply(console, __spread(["[" + Date.now() + "]"], args));
};
var GAME_ELEMENTS = {
    bird: document.getElementById('player'),
    flyArea: document.getElementById('flyarea'),
};
if (GAME_ELEMENTS.bird == null || GAME_ELEMENTS.flyArea == null) {
    throw new Error('Missing an element');
}
var Bird = (function () {
    function Bird(domElement, flyingProperties) {
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.position = 180;
        this.rotation = 0;
        this.domElement = domElement;
        this.flyingProperties = flyingProperties;
    }
    Bird.prototype.tick = function () {
        this.velocity += this.flyingProperties.gravity;
        this.position += this.velocity;
        if (this.position < 0) {
            this.position = 0;
        }
        if (this.position > this.flyingProperties.flyAreaHeight) {
            this.position = this.flyingProperties.flyAreaHeight;
        }
        this.rotation = Math.min((this.velocity / 10) * 90, 90);
    };
    Bird.prototype.jump = function () {
        this.velocity = this.flyingProperties.jumpVelocity;
    };
    Bird.prototype.draw = function () {
        this.domElement.style.transform = "\n            translate3d(0px, " + this.position + "px, 0px)\n            rotate3d(0, 0, 1, " + this.rotation + "deg)\n        ";
    };
    return Bird;
}());
var Pipe = (function () {
    function Pipe() {
        this.domElement = document.createElement('div');
        this.domElement.className = 'pipe animated';
        this.domElement.innerHTML = 'test';
    }
    return Pipe;
}());
var PipeManager = (function () {
    function PipeManager() {
        this.pipeDelay = 1400;
        this.lastPipeInserted = 0;
    }
    PipeManager.prototype.tick = function (now) {
        if (now - this.lastPipeInserted < this.pipeDelay) {
            return;
        }
        this.insertPipe(now);
    };
    PipeManager.prototype.insertPipe = function (now) {
        log('inserting pipe after', now - this.lastPipeInserted, 'ms');
        this.lastPipeInserted = now;
        new Pipe();
    };
    return PipeManager;
}());
var bird = new Bird(GAME_ELEMENTS.bird, {
    gravity: 0.25,
    jumpVelocity: -4.6,
    flyAreaHeight: GAME_ELEMENTS.flyArea.getBoundingClientRect().height,
});
var pipeManager = new PipeManager();
var gameLoop = function () {
    var now = Date.now();
    bird.tick();
    pipeManager.tick(now);
};
var renderingLoop = function () {
    requestAnimationFrame(renderingLoop);
    bird.draw();
};
bird.jump();
setInterval(function () { return bird.jump(); }, 574);
setInterval(gameLoop, 1000 / 60);
requestAnimationFrame(renderingLoop);
//# sourceMappingURL=game.js.map