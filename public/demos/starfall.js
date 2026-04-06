class Star {
    constructor(p, w, h, layer) {
        this.p = p;
        this.w = w;
        this.h = h;
        this.layer = layer;
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * this.w;
        this.y = initial ? Math.random() * this.h : -10;
        this.z = 0.2 + this.layer * 0.3;
        this.baseSpeed = 1 + Math.random() * 2;
        this.size = 0.5 + this.z * 2;
        this.brightness = 0.4 + this.z * 0.6;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.02 + Math.random() * 0.03;
    }

    update(speedMult, depthMult, mouseX, mouseY, mouseInfluence) {
        const depth = this.z * depthMult;
        this.y += this.baseSpeed * speedMult * depth;

        const offsetX = (mouseX - this.w / 2) * 0.0003 * depth * mouseInfluence;
        const offsetY = (mouseY - this.h / 2) * 0.0003 * depth * mouseInfluence;
        this.x += offsetX * this.baseSpeed;
        this.y += offsetY * this.baseSpeed * 0.5;

        if (this.y > this.h + 20 || this.x < -50 || this.x > this.w + 50) {
            this.reset();
        }
    }

    draw(p, time) {
        const twinkle = 0.7 + 0.3 * Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
        const alpha = this.brightness * twinkle;
        const glowSize = this.size * (1 + this.z * 2);

        p.noStroke();
        p.fill(255, 255, 255, alpha * 30);
        p.ellipse(this.x, this.y, glowSize * 4, glowSize * 4);

        p.fill(255, 255, 255, alpha * 80);
        p.ellipse(this.x, this.y, glowSize * 2, glowSize * 2);

        p.fill(255, 255, 255, alpha * 255);
        p.ellipse(this.x, this.y, this.size, this.size);
    }
}

class Starfall {
    constructor(options = {}) {
        this.container =
            typeof options.container === 'string'
                ? document.querySelector(options.container)
                : options.container || document.body;

        this.starCount = options.starCount || 300;
        this.speedMultiplier = options.speedMultiplier || 1;
        this.depthMultiplier = options.depthMultiplier || 1;
        this.mouseInfluence = options.mouseInfluence || 1;
        this.layers = options.layers || 3;

        this.stars = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.time = 0;
        this.p5Instance = null;

        this._init();
    }

    _init() {
        const self = this;

        this.p5Instance = new p5((p) => {
            p.setup = () => {
                const w = self.container.clientWidth || window.innerWidth;
                const h = self.container.clientHeight || window.innerHeight;
                const canvas = p.createCanvas(w, h);
                canvas.parent(self.container);
                p.pixelDensity(1);

                self._createStars(p, w, h);
            };

            p.draw = () => {
                self.time++;

                p.background(2, 2, 12);

                for (const star of self.stars) {
                    star.update(
                        self.speedMultiplier,
                        self.depthMultiplier,
                        self.mouseX,
                        self.mouseY,
                        self.mouseInfluence
                    );
                    star.draw(p, self.time);
                }
            };

            p.mouseMoved = () => {
                self.mouseX = p.mouseX;
                self.mouseY = p.mouseY;
            };

            p.touchMoved = () => {
                if (p.touches.length > 0) {
                    self.mouseX = p.touches[0].x;
                    self.mouseY = p.touches[0].y;
                }
                return false;
            };

            p.windowResized = () => {
                const w = self.container.clientWidth || window.innerWidth;
                const h = self.container.clientHeight || window.innerHeight;
                p.resizeCanvas(w, h);
                self.stars = [];
                self._createStars(p, w, h);
            };
        });
    }

    _createStars(p, w, h) {
        this.stars = [];
        const perLayer = Math.floor(this.starCount / this.layers);
        for (let layer = 0; layer < this.layers; layer++) {
            for (let i = 0; i < perLayer; i++) {
                this.stars.push(new Star(p, w, h, layer));
            }
        }
    }

    setStarCount(count) {
        this.starCount = count;
        if (this.p5Instance) {
            const p = this.p5Instance;
            this.stars = [];
            this._createStars(p, p.width, p.height);
        }
    }

    setSpeed(mult) {
        this.speedMultiplier = mult;
    }

    setDepth(mult) {
        this.depthMultiplier = mult;
    }

    setMouseInfluence(val) {
        this.mouseInfluence = val;
    }

    destroy() {
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }
        this.stars = [];
    }
}

export default Starfall;
export { Starfall, Star };
