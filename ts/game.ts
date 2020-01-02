const wait = async (time: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    })
}

const log = (...args: any[]) => {
    console.log(`[${Date.now()}]`, ...args);
}

const toRad = (degrees: number) => {
    return degrees * Math.PI / 180;
}

// TODO put this in the game class or something?
const debugBoxes = new Map<HTMLElement, HTMLDivElement>();

const drawDebugBox = (element: HTMLElement, box: BoundingBox) => {
    if (!debugBoxes.has(element)) {
        const newDebugBox = document.createElement('div');
        newDebugBox.className = 'boundingbox';
        const debugContainer = document.getElementById('debug');
        debugContainer!.appendChild(newDebugBox);
        debugBoxes.set(element, newDebugBox);
    }

    const boudingBox = debugBoxes.get(element);

    if (boudingBox == null) {
        log(`couldn't create a debug box for ${element}`);
        return;
    }

    boudingBox.style.top = `${box.y}px`;
    boudingBox.style.left = `${box.x}px`;
    boudingBox.style.width = `${box.width}px`;
    boudingBox.style.height = `${box.height}px`;
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
    flyAreaBox: BoundingBox;
}

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
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
    protected box: BoundingBox = { x: 0, y: 0, width: 34, height: 24 };

    constructor(domElement: HTMLElement, flyingProperties: FlyingProperties) {
        this.domElement = domElement;
        this.flyingProperties = flyingProperties;
        console.log(this.flyingProperties);
    }

    public tick() {
        this.velocity += this.flyingProperties.gravity;
        this.rotation = Math.min((this.velocity / 10) * 90, 90);
        this.position += this.velocity;

        if (this.position < 0) {
            this.position = 0;
        }

        if (this.position > this.flyingProperties.flyAreaBox.height) {
            this.position = this.flyingProperties.flyAreaBox.height;
        }

        // We draw our bounding box around the bird through a couple steps. Our
        // rotation of the bird is done through the center. So if we've rotated
        // the bird 90 degrees (facing down), our bird becomes 5 px closer to
        // the top and 5 px further from the left -- because it's 10 px wider
        // than it is tall. To make this easier, we first calculate the height
        // and width of our bird and then its x/y based on that.
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
        this.box.y = this.position + yShift + this.flyingProperties.flyAreaBox.y;
    }

    public jump() {
        this.velocity = this.flyingProperties.jumpVelocity;
    }

    public draw() {
        drawDebugBox(this.domElement, this.box);
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
        // console.log(this.domElement.getBoundingClientRect());
    }
}

class PipeManager implements Tickable {
    protected pipeAreaDomElement: HTMLElement;
    protected pipeDelay = 1400;
    protected lastPipeInsertedTimestamp = 0;
    protected pipes: Pipe[] = [];

    constructor(pipeAreaDomElement: HTMLElement) {
        this.pipeAreaDomElement = pipeAreaDomElement;
    }

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
        this.pipeAreaDomElement.appendChild(pipe.domElement);

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
    // this info is wrong as soon as we resize. it should probably be passed by
    // reference or invalidated/refreshed every time the browser changes size.
    flyAreaBox: GAME_ELEMENTS.flyArea.getBoundingClientRect(),
});

const pipeManager = new PipeManager(GAME_ELEMENTS.flyArea);

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
