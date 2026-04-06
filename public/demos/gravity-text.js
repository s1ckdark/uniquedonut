/**
 * Gravity Text Module
 * 텍스트를 파티클로 분해하고 마우스/터치 입력에 중력·반발력·트레일 효과를 적용하는 물리 엔진 모듈
 * p5.js 인스턴스 모드 기반
 */

const COLOR_THEMES = {
    aurora: {
        name: 'Aurora',
        background: [8, 8, 24],
        particles: [
            [0, 255, 180],
            [80, 200, 255],
            [160, 100, 255],
            [255, 80, 200],
            [40, 255, 120],
        ],
        trail: [0, 255, 180, 18],
        glow: [80, 255, 200],
    },
    ember: {
        name: 'Ember',
        background: [18, 6, 4],
        particles: [
            [255, 80, 20],
            [255, 160, 40],
            [255, 220, 60],
            [255, 40, 10],
            [200, 60, 0],
        ],
        trail: [255, 100, 20, 18],
        glow: [255, 160, 60],
    },
    ocean: {
        name: 'Ocean',
        background: [4, 10, 24],
        particles: [
            [0, 180, 255],
            [0, 120, 220],
            [80, 220, 255],
            [0, 60, 180],
            [120, 200, 255],
        ],
        trail: [0, 140, 255, 18],
        glow: [60, 200, 255],
    },
    neon: {
        name: 'Neon',
        background: [6, 0, 16],
        particles: [
            [255, 0, 255],
            [0, 255, 255],
            [255, 255, 0],
            [0, 255, 100],
            [255, 60, 120],
        ],
        trail: [200, 0, 255, 18],
        glow: [255, 100, 255],
    },
    mono: {
        name: 'Mono',
        background: [10, 10, 10],
        particles: [
            [255, 255, 255],
            [200, 200, 200],
            [160, 160, 160],
            [220, 220, 220],
            [180, 180, 180],
        ],
        trail: [255, 255, 255, 12],
        glow: [255, 255, 255],
    },
};

class Particle {
    constructor(p, homeX, homeY, color) {
        this.p = p;
        this.homeX = homeX;
        this.homeY = homeY;
        this.x = homeX + (Math.random() - 0.5) * 400;
        this.y = homeY + (Math.random() - 0.5) * 400;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.color = color;
        this.size = 2.5 + Math.random() * 1.5;
        this.trail = [];
        this.maxTrail = 6;
        this.friction = 0.88;
        this.springStrength = 0.018;
        this.mass = 0.8 + Math.random() * 0.4;
    }

    applyForce(fx, fy) {
        this.ax += fx / this.mass;
        this.ay += fy / this.mass;
    }

    update(mouseX, mouseY, mouseActive, repulsionRadius, repulsionStrength, gravityStrength) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();

        // 홈으로 돌아가는 스프링 힘
        const dx = this.homeX - this.x;
        const dy = this.homeY - this.y;
        this.applyForce(dx * this.springStrength, dy * this.springStrength);

        // 마우스 상호작용 (반발 + 중력)
        if (mouseActive) {
            const mdx = this.x - mouseX;
            const mdy = this.y - mouseY;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);

            if (dist < repulsionRadius && dist > 1) {
                // 반발력 — 가까울수록 강해짐
                const force = (repulsionRadius - dist) / repulsionRadius * repulsionStrength;
                this.applyForce((mdx / dist) * force, (mdy / dist) * force);
            }

            // 먼 거리 중력 (은은한 끌림)
            if (dist > repulsionRadius && dist < repulsionRadius * 4) {
                const grav = gravityStrength / (dist * 0.5);
                this.applyForce((-mdx / dist) * grav, (-mdy / dist) * grav);
            }
        }

        this.vx += this.ax;
        this.vy += this.ay;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

        this.ax = 0;
        this.ay = 0;
    }

    draw(p, trailColor, glowColor, showTrails) {
        if (showTrails && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (i / this.trail.length) * trailColor[3];
                p.stroke(trailColor[0], trailColor[1], trailColor[2], alpha);
                p.strokeWeight(this.size * 0.4 * (i / this.trail.length));
                p.line(this.trail[i].x, this.trail[i].y, this.trail[i + 1].x, this.trail[i + 1].y);
            }
        }

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const glowSize = this.size + speed * 1.2;
        p.noStroke();
        p.fill(glowColor[0], glowColor[1], glowColor[2], 25 + speed * 8);
        p.ellipse(this.x, this.y, glowSize * 3, glowSize * 3);

        p.fill(this.color[0], this.color[1], this.color[2], 220 + speed * 10);
        p.ellipse(this.x, this.y, this.size * 2, this.size * 2);
    }
}

/**
 * GravityText 메인 클래스
 * p5.js 인스턴스 모드를 사용하여 지정된 컨테이너에 캔버스를 생성합니다.
 */
class GravityText {
    /**
     * @param {Object} options
     * @param {string|HTMLElement} options.container — 캔버스가 삽입될 요소 (CSS 선택자 또는 DOM)
     * @param {string} [options.text='GRAVITY'] — 표시할 텍스트
     * @param {number} [options.fontSize=160] — 텍스트 샘플링 크기
     * @param {string} [options.fontFamily='Arial Black'] — 폰트
     * @param {string} [options.theme='aurora'] — 컬러 테마 키
     * @param {number} [options.particleDensity=4] — 샘플링 간격 (작을수록 파티클 多)
     * @param {number} [options.repulsionRadius=150] — 반발 반경
     * @param {number} [options.repulsionStrength=8] — 반발 세기
     * @param {number} [options.gravityStrength=0.6] — 중력 세기
     * @param {boolean} [options.showTrails=true] — 트레일 표시 여부
     */
    constructor(options = {}) {
        this.container =
            typeof options.container === 'string'
                ? document.querySelector(options.container)
                : options.container || document.body;

        this.text = options.text || 'GRAVITY';
        this.fontSize = options.fontSize || 160;
        this.fontFamily = options.fontFamily || 'Arial Black';
        this.themeName = options.theme || 'aurora';
        this.theme = COLOR_THEMES[this.themeName] || COLOR_THEMES.aurora;
        this.particleDensity = options.particleDensity || 4;
        this.repulsionRadius = options.repulsionRadius || 150;
        this.repulsionStrength = options.repulsionStrength || 8;
        this.gravityStrength = options.gravityStrength || 0.6;
        this.showTrails = options.showTrails !== undefined ? options.showTrails : true;

        this.particles = [];
        this.mouseActive = false;
        this.mouseX = 0;
        this.mouseY = 0;
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
                p.textFont(self.fontFamily);
                p.textSize(self.fontSize);
                p.textAlign(p.CENTER, p.CENTER);

                self._sampleText(p, w, h);
            };

            p.draw = () => {
                const bg = self.theme.background;
                // 잔상 효과 (반투명 배경 덧그리기)
                p.fill(bg[0], bg[1], bg[2], 40);
                p.noStroke();
                p.rect(0, 0, p.width, p.height);

                for (const particle of self.particles) {
                    particle.update(
                        self.mouseX,
                        self.mouseY,
                        self.mouseActive,
                        self.repulsionRadius,
                        self.repulsionStrength,
                        self.gravityStrength
                    );
                    particle.draw(p, self.theme.trail, self.theme.glow, self.showTrails);
                }
            };

            p.mouseMoved = () => {
                self.mouseX = p.mouseX;
                self.mouseY = p.mouseY;
                self.mouseActive = true;
            };

            p.mouseDragged = () => {
                self.mouseX = p.mouseX;
                self.mouseY = p.mouseY;
                self.mouseActive = true;
            };

            p.mousePressed = () => {
                self.mouseActive = true;
            };

            p.mouseReleased = () => {
                // 마우스를 떼도 위치 기반으로 계속 반응
            };

            p.touchStarted = () => {
                if (p.touches.length > 0) {
                    self.mouseX = p.touches[0].x;
                    self.mouseY = p.touches[0].y;
                    self.mouseActive = true;
                }
                return false;
            };

            p.touchMoved = () => {
                if (p.touches.length > 0) {
                    self.mouseX = p.touches[0].x;
                    self.mouseY = p.touches[0].y;
                    self.mouseActive = true;
                }
                return false;
            };

            p.touchEnded = () => {
                if (p.touches.length === 0) {
                    self.mouseActive = false;
                }
                return false;
            };

            p.windowResized = () => {
                const w = self.container.clientWidth || window.innerWidth;
                const h = self.container.clientHeight || window.innerHeight;
                p.resizeCanvas(w, h);
                self.particles = [];
                self._sampleText(p, w, h);
            };
        });
    }

    _sampleText(p, w, h) {
        const gfx = p.createGraphics(w, h);
        gfx.pixelDensity(1);
        gfx.background(0);
        gfx.fill(255);
        gfx.noStroke();
        gfx.textFont(this.fontFamily);
        gfx.textSize(this.fontSize);
        gfx.textAlign(p.CENTER, p.CENTER);
        gfx.text(this.text, w / 2, h / 2);
        gfx.loadPixels();

        const colors = this.theme.particles;
        const density = this.particleDensity;
        this.particles = [];

        for (let x = 0; x < w; x += density) {
            for (let y = 0; y < h; y += density) {
                const idx = (y * w + x) * 4;
                const brightness = gfx.pixels[idx];
                if (brightness > 128) {
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    this.particles.push(new Particle(p, x, y, color));
                }
            }
        }

        gfx.remove();
    }

    setTheme(themeName) {
        if (!COLOR_THEMES[themeName]) return;
        this.themeName = themeName;
        this.theme = COLOR_THEMES[themeName];

        const colors = this.theme.particles;
        for (const particle of this.particles) {
            particle.color = colors[Math.floor(Math.random() * colors.length)];
        }

        if (this.p5Instance) {
            const p = this.p5Instance;
            const bg = this.theme.background;
            p.background(bg[0], bg[1], bg[2]);
        }
    }

    setText(newText) {
        this.text = newText;
        if (this.p5Instance) {
            const p = this.p5Instance;
            this.particles = [];
            this._sampleText(p, p.width, p.height);
            const bg = this.theme.background;
            p.background(bg[0], bg[1], bg[2]);
        }
    }

    setParams(params = {}) {
        if (params.repulsionRadius !== undefined) this.repulsionRadius = params.repulsionRadius;
        if (params.repulsionStrength !== undefined) this.repulsionStrength = params.repulsionStrength;
        if (params.gravityStrength !== undefined) this.gravityStrength = params.gravityStrength;
        if (params.showTrails !== undefined) this.showTrails = params.showTrails;
    }

    destroy() {
        if (this.p5Instance) {
            this.p5Instance.remove();
            this.p5Instance = null;
        }
        this.particles = [];
    }

    static getThemes() {
        return Object.entries(COLOR_THEMES).map(([key, val]) => ({ key, name: val.name }));
    }
}

export default GravityText;
export { GravityText, COLOR_THEMES, Particle };
