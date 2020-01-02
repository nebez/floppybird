const wait = async (time: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    })
}

const log = (...args: any[]) => {
    console.log(`[${Date.now()}]`, ...args);
}

const GAME_ELEMENTS = {
    bird: document.getElementById('player'),
    flyArea: document.getElementById('flyarea'),
}

if (GAME_ELEMENTS.bird == null || GAME_ELEMENTS.flyArea == null) {
    throw new Error('Missing an element');
}

interface FlyingProperties {
    gravity: number;
    jumpVelocity: number;
    flyAreaHeight: number;
}

// Ticking happens on the game loop
interface Tickable {
    tick(now: number): void;
}

// Drawing happens on the rendering loop
interface Drawable {
    draw(): void;
}

class Bird implements Tickable, Drawable {
    protected domElement: HTMLElement;
    protected flyingProperties: FlyingProperties;
    protected width = 34;
    protected height = 24;
    protected velocity = 0;
    protected position = 180;
    protected rotation = 0;

    constructor(domElement: HTMLElement, flyingProperties: FlyingProperties) {
        this.domElement = domElement;
        this.flyingProperties = flyingProperties;
    }

    public tick() {
        this.velocity += this.flyingProperties.gravity;
        this.position += this.velocity;

        if (this.position < 0) {
            this.position = 0;
        }

        if (this.position > this.flyingProperties.flyAreaHeight) {
            this.position = this.flyingProperties.flyAreaHeight;
        }

        this.rotation = Math.min((this.velocity / 10) * 90, 90);
    }

    public jump() {
        this.velocity = this.flyingProperties.jumpVelocity;
    }

    public draw() {
        this.domElement.style.transform = `
            translate3d(0px, ${this.position}px, 0px)
            rotate3d(0, 0, 1, ${this.rotation}deg)
        `;
    }
}

class Pipe implements Tickable {
    public domElement: HTMLDivElement;

    constructor() {
        this.domElement = document.createElement('div');
        this.domElement.className = 'pipe animated';
        this.domElement.innerHTML = `
            <div class="pipe_upper" style="height: 165px;"></div>
            <div class="pipe_lower" style="height: 165px;"></div>
        `;
    }

    public tick() {
        console.log(this.domElement.getBoundingClientRect());
    }
}

class PipeManager implements Tickable {
    protected pipeDelay = 1400;
    protected lastPipeInsertedTimestamp = 0;
    protected pipes: Pipe[] = [];

    public tick(now: number) {
        if (now - this.lastPipeInsertedTimestamp < this.pipeDelay) {
            // Wait a little longer... we don't need to do this too often.
            return;
        }

        // Insert a new pipe and then prune all the pipes that have gone
        // entirely off the screen
        log('inserting pipe after', now - this.lastPipeInsertedTimestamp, 'ms');
        this.lastPipeInsertedTimestamp = now;
        const pipe = new Pipe();
        this.pipes.push(pipe);
        GAME_ELEMENTS.flyArea!.appendChild(pipe.domElement);

        this.pipes = this.pipes.filter(pipe => {
            pipe.tick();

            if (pipe.domElement.getBoundingClientRect().x <= -100) {
                pipe.domElement.remove();
                return false;
            }

            return true;
        });
    }
}

const bird = new Bird(GAME_ELEMENTS.bird, {
    gravity: 0.25,
    jumpVelocity: -4.6,
    flyAreaHeight: GAME_ELEMENTS.flyArea.getBoundingClientRect().height,
});

const pipeManager = new PipeManager();

const gameLoop = () => {
    const now = Date.now();
    bird.tick();
    pipeManager.tick(now);
}

const renderingLoop = () => {
    requestAnimationFrame(renderingLoop);
    bird.draw();
}

bird.jump();
setInterval(() => bird.jump(), 574);
setInterval(gameLoop, 1000 / 60);
requestAnimationFrame(renderingLoop);
