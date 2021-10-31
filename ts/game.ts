enum GameState {
    Loading,
    SplashScreen,
    Playing,
    PlayerDying,
    PlayerDead,
    ScoreScreen,
}

const sounds = {
    jump: new Howl({ src: ['assets/sounds/sfx_wing.ogg'], volume: 0.3 }),
    score: new Howl({ src: ['assets/sounds/sfx_point.ogg'], volume: 0.3 }),
    hit: new Howl({ src: ['assets/sounds/sfx_hit.ogg'], volume: 0.3 }),
    die: new Howl({ src: ['assets/sounds/sfx_die.ogg'], volume: 0.3 }),
    swoosh: new Howl({ src: ['assets/sounds/sfx_swooshing.ogg'], volume: 0.3 }),
};

const wait = async (time: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    })
}

const toRad = (degrees: number) => {
    return degrees * Math.PI / 180;
}

const isBoxIntersecting = (a: BoundingBox, b: BoundingBox) => {
    return (
        a.x <= (b.x + b.width) &&
        b.x <= (a.x + a.width) &&
        a.y <= (b.y + b.height) &&
        b.y <= (a.y + a.height)
    );
}

class GameDebugger {
    protected enabled;
    protected domLogs = document.getElementById('debug-logs')!;
    protected domState = document.getElementById('debug-state')!;
    protected domBoxContainer = document.getElementById('debug')!;
    protected domBoxes = new Map<HTMLElement, HTMLDivElement>();

    constructor(enabled: boolean) {
        this.enabled = enabled;
    }

    public drawBox(key: HTMLElement, box: BoundingBox) {
        if (!this.enabled) {
            return;
        }

        if (!this.domBoxes.has(key)) {
            const newDebugBox = document.createElement('div');
            newDebugBox.className = 'boundingbox';
            this.domBoxContainer.appendChild(newDebugBox);
            this.domBoxes.set(key, newDebugBox);
        }

        const boudingBox = this.domBoxes.get(key);

        if (boudingBox == null) {
            this.log(`couldn't create a debug box for ${key}`);
            return;
        }

        boudingBox.style.top = `${box.y}px`;
        boudingBox.style.left = `${box.x}px`;
        boudingBox.style.width = `${box.width}px`;
        boudingBox.style.height = `${box.height}px`;
    }

    public resetBoxes() {
        if (!this.enabled) {
            return;
        }

        // Only pipes need resetting. Land and bird are recycled. The debugger
        // probably shouldn't be aware of this but who cares :)
        this.domBoxes.forEach((debugBox, pipe) => {
            if (pipe.className.includes('pipe')) {
                debugBox.remove();
                this.domBoxes.delete(pipe);
            }
        });
    }

    public logStateChange(oldState: GameState, newState: GameState) {
        if (!this.enabled) {
            return;
        }

        this.log('Changing state', GameState[oldState], GameState[newState]);
        this.domState.innerText = GameState[newState];
    }

    public log(...args: any[]) {
        if (!this.enabled) {
            return;
        }

        // Current time is only really useful to see difference in ms between
        // events - we don't need to see ms elapsed since epoch. The rest of
        // the slice and "00000" garbage is so we get a consistent width.
        const shortTime = ("00000" + Date.now() % 100000).slice(-5);

        console.log(`[${shortTime}]`, ...args);
        this.domLogs.innerText += `[${shortTime}] ${args.map(a => a?.toString()).join(' ')}\n`;
    }
}

const gameDebugger = new GameDebugger(true);

interface FlyingProperties {
    gravity: number;
    jumpVelocity: number;
    flightAreaBox: BoundingBox;
}

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface GameHtmlElements {
    bird: HTMLElement;
    land: HTMLElement;
    flightArea: HTMLElement;
    replayButton: HTMLElement;
    bigScore: HTMLElement;
    currentScore: HTMLElement;
    highScore: HTMLElement;
}

const gameStorage = new class {
    protected isLsEnabled = false;

    constructor() {
        this.isLsEnabled = this.testLocalStorageWorks();
    }

    protected testLocalStorageWorks() {
        try {
            window.localStorage.setItem('test', 'test');
            window.localStorage.removeItem('test');
            return true;
        } catch {
            return false;
        }
    }

    public setHighScore(score: number) {
        if (!this.isLsEnabled) {
            return;
        }

        window.localStorage.setItem('highscore', score.toString());
    }

    public getHighScore() {
        if (!this.isLsEnabled) {
            return 0;
        }

        return parseInt(window.localStorage.getItem('highscore') ?? '0');
    }
}

class Game {
    protected domElements: GameHtmlElements;
    protected bird: Bird;
    protected land: Land;
    protected pipes: PipeManager;
    protected _state!: GameState;
    protected _highScore!: number;
    protected _currentScore!: number;
    protected gameLoop: ReturnType<typeof setInterval> | undefined;

    constructor(domElements: GameHtmlElements) {
        this.domElements = domElements;
        this.bird = new Bird(domElements.bird, {
            gravity: 0.25,
            jumpVelocity: -4.6,
            flightAreaBox: domElements.flightArea.getBoundingClientRect(),
        });
        this.pipes = new PipeManager(domElements.flightArea);
        this.land = new Land(domElements.land);
        this.state = GameState.Loading;
        this.domElements.replayButton.onclick = this.onReplayTouch.bind(this);
        this.highScore = gameStorage.getHighScore();
        this.currentScore = 0;

        requestAnimationFrame(this.draw.bind(this));
    }

    public onScreenTouch(ev: UIEvent) {
        // We want to treat keyboard and touch events as the same EXCEPT during
        // the score screen. If the user is on the score screen, they MUST tap
        // the replay button or press space bar. Tapping anywhere else on the
        // screen should be a no-op.
        if (this.state === GameState.Playing) {
            this.bird.jump();
        } else if (this.state === GameState.SplashScreen) {
            this.start();
        } else if (this.state === GameState.ScoreScreen && ev instanceof KeyboardEvent) {
            this.reset();
        }
    }

    public async splash() {
        const splashImage = document.getElementById('splash')!;
        splashImage.classList.add('visible');
        sounds.swoosh.play();
        this.state = GameState.SplashScreen;
    }

    protected get state() {
        return this._state;
    }

    protected set state(newState: GameState) {
        gameDebugger.logStateChange(this._state, newState);
        document.body.className = `state-${GameState[newState]}`;
        this._state = newState;
    }

    protected get currentScore() {
        return this._currentScore;
    }

    protected set currentScore(newScore: number) {
        this._currentScore = newScore;
        this.domElements.bigScore.replaceChildren(...this.numberToImageElements(newScore, 'big'));
        this.domElements.currentScore.replaceChildren(...this.numberToImageElements(newScore, 'small'));
    }

    protected get highScore() {
        return this._highScore;
    }

    protected set highScore(newScore: number) {
        this._highScore = newScore;
        this.domElements.highScore.replaceChildren(...this.numberToImageElements(newScore, 'small'));
        gameStorage.setHighScore(newScore);
    }

    protected onReplayTouch() {
        if (this.state === GameState.ScoreScreen) {
            this.reset();
        }
    }

    protected async reset() {
        this.state = GameState.Loading;
        sounds.swoosh.play();

        const scoreboard = document.getElementById('scoreboard')!;
        scoreboard.classList.add('slide-up');
        // The above animation takes 600ms, but let's add a bit more delay
        await wait(750);

        const replay = document.getElementById('replay')!;
        replay.classList.remove('visible');
        scoreboard.classList.remove('visible', 'slide-up');

        gameDebugger.resetBoxes();

        this.pipes.removeAll();
        this.bird.reset();
        this.currentScore = 0;

        // Find everything that's animated and start it.
        Array.from(document.getElementsByClassName('animated')).forEach(e => {
            (e as HTMLElement).style.animationPlayState = 'running';
            (e as HTMLElement).style.webkitAnimationPlayState = 'running';
        });

        this.splash();
    }

    protected start() {
        const splashImage = document.getElementById('splash')!;
        splashImage.classList.remove('visible');
        this.state = GameState.Playing;
        this.gameLoop = setInterval(this.tick.bind(this), 1000 / 60);

        // Always start the game with a jump! it's just nicer.
        this.bird.jump();
    }

    protected async die() {
        clearInterval(this.gameLoop);

        this.state = GameState.PlayerDying;

        // Find everything that's animated and stop it.
        Array.from(document.getElementsByClassName('animated')).forEach(e => {
            (e as HTMLElement).style.animationPlayState = 'paused';
            (e as HTMLElement).style.webkitAnimationPlayState = 'paused';
        });

        await this.bird.die();

        this.state = GameState.PlayerDead;

        await wait(500);

        sounds.swoosh.play();

        const scoreboard = document.getElementById('scoreboard')!;
        scoreboard.classList.add('visible');
        // The above animation takes 600ms.
        await wait(600);

        sounds.swoosh.play();

        const replay = document.getElementById('replay')!;
        replay.classList.add('visible');
        // The above animation takes 600ms. But we don't need to wait the
        // entirety of it to let them replay. Make it half.
        await wait(300);

        this.state = GameState.ScoreScreen;
    }

    protected score() {
        gameDebugger.log('Score!');
        sounds.score.play();

        this.currentScore++;

        if (this.currentScore > this.highScore) {
        gameDebugger.log('New highscore!', this.currentScore);
        this.highScore = this.currentScore;
        }

    }

    protected numberToImageElements(digits: number, size: 'big' | 'small') {
        return digits.toString().split('').map(n => {
            const imgDigit = new Image();
            imgDigit.src = `assets/font_${size}_${n}.png`
            return imgDigit;
        });
    }

    protected tick() {
        const now = Date.now();

        this.bird.tick();
        this.pipes.tick(now);

        let unscoredPipe = this.pipes.nextUnscoredPipe();

        if (unscoredPipe && unscoredPipe.hasCrossed(this.bird.box)) {
            unscoredPipe.scored = true;
            this.score();
        }

        if (this.pipes.intersectsWith(this.bird.box) || this.land.intersectsWith(this.bird.box)) {
            this.die();
        }
    }

    protected draw() {
        requestAnimationFrame(this.draw.bind(this));

        this.bird.draw();
    }
}

class Bird {
    protected domElement: HTMLElement;
    protected flyingProperties: FlyingProperties;
    protected width!: number;
    protected height!: number;
    protected velocity!: number;
    protected position!: number;
    protected rotation!: number;
    public box!: BoundingBox;

    constructor(domElement: HTMLElement, flyingProperties: FlyingProperties) {
        this.domElement = domElement;
        this.flyingProperties = flyingProperties;
        this.reset();
    }

    public reset() {
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.position = 180;
        this.rotation = 0;
        this.box = { x: 60, y: 180, width: 34, height: 24 };
    }

    public jump() {
        this.velocity = this.flyingProperties.jumpVelocity;
        sounds.jump.play();
    }

    public async die() {
        this.domElement.style.transition = `
            transform 1s cubic-bezier(0.65, 0, 0.35, 1)
        `;
        this.position = this.flyingProperties.flightAreaBox.height - this.height;
        this.rotation = 90;

        sounds.hit.play();
        await wait(500);
        sounds.die.play();
        await wait(500);
        this.domElement.style.transition = '';
    }

    public tick() {
        this.velocity += this.flyingProperties.gravity;
        this.rotation = Math.min((this.velocity / 10) * 90, 90);
        this.position += this.velocity;

        // Clip us back in
        if (this.position < 0) {
            this.position = 0;
        }

        if (this.position > this.flyingProperties.flightAreaBox.height) {
            this.position = this.flyingProperties.flightAreaBox.height;
        }

        // We draw our bounding box around the bird through a couple steps. Our
        // rotation of the bird is done through the center. So if we've rotated
        // the bird 90 degrees (facing down), our bird becomes 5 px closer to
        // the top and 5 px further from the left -- because it's 10 px wider
        // than it is tall. To make this easier, we first calculate the height
        // and width of our bird and then calculate its x,y based on that.
        const rotationInRadians = Math.abs(toRad(this.rotation));
        const widthMultiplier = this.height - this.width; // 24 - 34 = -10
        const heightMultiplier = this.width - this.height; // 34 - 24 = 10

        this.box.width = this.width + (widthMultiplier * Math.sin(rotationInRadians));
        this.box.height = this.height + (heightMultiplier * Math.sin(rotationInRadians));

        const xShift = (this.width - this.box.width) / 2;
        const yShift = (this.height - this.box.height) / 2;

        // We're 60 away from the left (magic number), + x shift
        this.box.x = 60 + xShift;
        // And we're our current bird position from the top + y shift + the
        // distance to the top of the window, because of the sky
        this.box.y = this.position + yShift + this.flyingProperties.flightAreaBox.y;
    }

    public draw() {
        gameDebugger.drawBox(this.domElement, this.box);

        this.domElement.style.transform = `
            translate3d(0px, ${this.position}px, 0px)
            rotate3d(0, 0, 1, ${this.rotation}deg)
        `;
    }
}

class Land {
    public domElement: HTMLElement;
    public box: BoundingBox;

    constructor(domElement: HTMLElement) {
        this.domElement = domElement;
        this.box = domElement.getBoundingClientRect();

        gameDebugger.drawBox(this.domElement, this.box);
    }

    public intersectsWith(box: BoundingBox) {
        return isBoxIntersecting(this.box, box);
    }
}

class Pipe {
    public scored = false;
    public domElement: HTMLDivElement;
    protected upperPipeDomElement: HTMLDivElement;
    protected lowerPipeDomElement: HTMLDivElement;
    protected upperBox: BoundingBox = { x: 0, y: 0, width: 0, height: 0 };
    protected lowerBox: BoundingBox = { x: 0, y: 0, width: 0, height: 0 };

    constructor(options: { topPipeHeight: number, bottomPipeHeight: number }) {
        this.domElement = document.createElement('div');
        this.domElement.className = 'pipe animated';

        this.upperPipeDomElement = document.createElement('div');
        this.upperPipeDomElement.className = 'pipe_upper';
        this.upperPipeDomElement.style.height = `${options.topPipeHeight}px`;

        this.lowerPipeDomElement = document.createElement('div');
        this.lowerPipeDomElement.className = 'pipe_lower';
        this.lowerPipeDomElement.style.height = `${options.bottomPipeHeight}px`;

        this.domElement.appendChild(this.upperPipeDomElement);
        this.domElement.appendChild(this.lowerPipeDomElement);
    }

    public isOffScreen() {
        return this.upperBox.x <= -100;
    }

    public hasCrossed(box: BoundingBox) {
        // Little bug with attempting to understand if we've crossed something
        // before we've actually rendered. We can fix one of two ways: wait to
        // render (setImmediate, or wait another ticket), or check for width.
        // First option sounds like it would fix other bugs that are probably
        // lingering but no thanks.
        return this.upperBox.width !== 0 && this.upperBox.x + this.upperBox.width <= box.x;
    }

    public intersectsWith(box: BoundingBox) {
        return isBoxIntersecting(this.upperBox, box) || isBoxIntersecting(this.lowerBox, box);
    }

    public tick() {
        this.upperBox = this.upperPipeDomElement.getBoundingClientRect();
        this.lowerBox = this.lowerPipeDomElement.getBoundingClientRect();

        // TODO: This should be in draw not tick. Find a way to move it after.
        gameDebugger.drawBox(this.upperPipeDomElement, this.upperBox);
        gameDebugger.drawBox(this.lowerPipeDomElement, this.lowerBox);
    }
}

class PipeManager {
    protected pipeAreaDomElement: HTMLElement;
    protected pipeDelay = 1400;
    protected lastPipeInsertedTimestamp = 0;
    protected pipes: Pipe[] = [];

    constructor(pipeAreaDomElement: HTMLElement) {
        this.pipeAreaDomElement = pipeAreaDomElement;
    }

    public tick(now: number) {
        this.pipes.forEach(pipe => pipe.tick());

        if (now - this.lastPipeInsertedTimestamp < this.pipeDelay) {
            // Wait a little longer... we don't need to do this too often.
            return;
        }

        // Insert a new pipe and then prune all the pipes that have gone
        // entirely off the screen
        gameDebugger.log('inserting pipe after', now - this.lastPipeInsertedTimestamp, 'ms');
        this.lastPipeInsertedTimestamp = now;
        const pipeDimension = this.createPipeDimensions({ gap: 90, minDistanceFromEdges: 80 });
        const pipe = new Pipe(pipeDimension);
        this.pipes.push(pipe);
        this.pipeAreaDomElement.appendChild(pipe.domElement);

        this.pipes = this.pipes.filter(pipe => {
            if (pipe.isOffScreen()) {
                gameDebugger.log('pruning a pipe');
                pipe.domElement.remove();
                return false;
            }

            return true;
        });
    }

    public intersectsWith(box: BoundingBox) {
        return this.pipes.find(pipe => pipe.intersectsWith(box)) != null;
    }

    public removeAll() {
        this.pipes.forEach(pipe => pipe.domElement.remove());
        this.pipes = [];
    }

    public nextUnscoredPipe() {
        return this.pipes.find(pipe => pipe.scored === false);
    }

    protected createPipeDimensions(options: { gap: number, minDistanceFromEdges: number }) {
        // The gap between pipes should be 90px. And the positioning of them
        // should be somewhere randomly within the flight area with sufficient
        // buffer from the top of bottom. Our entire "flight" area is 420px.
        // The pipes should be at *least* 80px high, which means they can be
        // at most:
        //     FlightHeight - PipeGap - PipeMinHeight = PipeMaxHeight
        //     420 - 90 - 80 = 250px
        // So if we pick a top pipe size of 80, then the bottom is 250 (and
        // vice versa). Another way of expressing this same thing would be:
        //     FlightHeight - PipeGap - TopPipeHeight = BottomPipeHeight
        //     420 - 90 - 80 = 250px
        const topPipeHeight = this.randomNumberBetween(80, 250);
        const bottomPipeHeight = 420 - options.gap - topPipeHeight;
        return { topPipeHeight, bottomPipeHeight };
    }

    protected randomNumberBetween(min: number, max: number) {
        // Generate a random integer between min (inclusive) and max (inclusive).
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

(function() {
    const bird = document.getElementById('player');
    const land = document.getElementById('land');
    const flightArea = document.getElementById('flyarea');
    const replayButton = document.getElementById('replay');
    const bigScore = document.getElementById('bigscore');
    const currentScore = document.getElementById('currentscore');
    const highScore = document.getElementById('highscore');

    if (bird == null || flightArea == null || land == null || replayButton == null || bigScore == null || currentScore == null || highScore == null) {
        throw new Error('Missing an element');
    }

    const game = new Game({ bird, land, flightArea, replayButton, bigScore, currentScore, highScore });

    // They can use both the spacebar or screen taps to interact with the game
    document.onkeydown = (ev: KeyboardEvent) => { ev.keyCode == 32 && game.onScreenTouch(ev); }
    if ('ontouchstart' in document) {
        document.ontouchstart = game.onScreenTouch.bind(game);
    } else {
        document.onmousedown = game.onScreenTouch.bind(game);
    }
    game.splash();
})();

