const getMatter = () => {
    if (window.Matter) return window.Matter;
    throw new Error('Matter.js not loaded');
};

class PhysicsBody {
    constructor(body, element) {
        this.body = body;
        this.element = element;
        this.originalStyles = {
            position: element.style.position,
            left: element.style.left,
            top: element.style.top,
            transform: element.style.transform,
        };
    }

    sync() {
        const pos = this.body.position;
        const angle = this.body.angle;
        const bounds = this.body.bounds;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;

        this.element.style.position = 'absolute';
        this.element.style.left = '0';
        this.element.style.top = '0';
        this.element.style.transform = `translate(${pos.x - width/2}px, ${pos.y - height/2}px) rotate(${angle}rad)`;
        this.element.style.transformOrigin = 'center center';
        this.element.style.willChange = 'transform';
    }
}

class Antigravity {
    constructor(options = {}) {
        this.container =
            typeof options.container === 'string'
                ? document.querySelector(options.container)
                : options.container || document.body;

        this.gravity = options.gravity !== undefined ? options.gravity : 1;
        this.restitution = options.restitution !== undefined ? options.restitution : 0.6;
        this.friction = options.friction !== undefined ? options.friction : 0.1;
        this.elements = options.elements || [];
        this.additionalBodies = options.additionalBodies || 0;

        this.engine = null;
        this.physicsBodies = [];
        this.isRunning = false;
    }

    init() {
        const Matter = getMatter();
        const { Engine, Bodies, Composite, Mouse, MouseConstraint } = Matter;

        const rect = this.container.getBoundingClientRect();
        const w = rect.width || window.innerWidth;
        const h = rect.height || window.innerHeight;

        this.engine = Engine.create({
            gravity: { x: 0, y: this.gravity }
        });

        // 벽 생성 (화면 밖으로 나가지 않도록)
        const wallThickness = 100;
        const walls = [
            Bodies.rectangle(w / 2, h + wallThickness/2, w + 200, wallThickness, { isStatic: true, friction: this.friction, restitution: this.restitution }),
            Bodies.rectangle(-wallThickness/2, h / 2, wallThickness, h + 200, { isStatic: true, friction: this.friction, restitution: this.restitution }),
            Bodies.rectangle(w + wallThickness/2, h / 2, wallThickness, h + 200, { isStatic: true, friction: this.friction, restitution: this.restitution }),
            Bodies.rectangle(w / 2, -wallThickness*2, w + 200, wallThickness, { isStatic: true, friction: this.friction, restitution: this.restitution }), // 천장은 높게
        ];
        Composite.add(this.engine.world, walls);

        this._createBodiesFromElements();

        if (this.additionalBodies > 0) {
            this._createRandomBodies(w, h);
        }

        // 마우스 제약조건 (드래그 가능)
        const mouse = Mouse.create(this.container);
        const mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(this.engine.world, mouseConstraint);

        // 스크롤 방지
        this.container.style.overflow = 'hidden';
        if (!this.container.style.position || this.container.style.position === 'static') {
            this.container.style.position = 'relative';
        }

        this.isRunning = true;
        this._startAnimation();

        window.addEventListener('resize', () => this._handleResize());
    }

    _createBodiesFromElements() {
        const Matter = getMatter();
        const { Bodies, Composite } = Matter;

        const allElements = [];
        for (const selector of this.elements) {
            const els = document.querySelectorAll(selector);
            els.forEach(el => allElements.push(el));
        }

        for (const el of allElements) {
            this._wrapElement(el, Bodies, Composite);
        }
    }

    _wrapElement(element, Bodies, Composite) {
        const rect = element.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top + rect.height / 2;

        const body = Bodies.rectangle(x, y, rect.width, rect.height, {
            friction: this.friction,
            restitution: this.restitution,
            frictionAir: 0.01,
        });

        element.style.pointerEvents = 'none';
        element.style.userSelect = 'none';

        this.container.appendChild(element);

        const physicsBody = new PhysicsBody(body, element);
        this.physicsBodies.push(physicsBody);
        Composite.add(this.engine.world, body);
    }

    _createRandomBodies(w, h) {
        const Matter = getMatter();
        const { Bodies, Composite } = Matter;

        const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
        
        for (let i = 0; i < this.additionalBodies; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h * 0.3;
            const size = 30 + Math.random() * 50;
            
            const body = Bodies.rectangle(x, y, size, size, {
                friction: this.friction,
                restitution: this.restitution,
                frictionAir: 0.01,
            });

            const el = document.createElement('div');
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.background = colors[Math.floor(Math.random() * colors.length)];
            el.style.position = 'absolute';
            el.style.borderRadius = '4px';
            el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            el.style.pointerEvents = 'none';
            this.container.appendChild(el);

            const physicsBody = new PhysicsBody(body, el);
            this.physicsBodies.push(physicsBody);
            Composite.add(this.engine.world, body);
        }
    }

    _startAnimation() {
        const Matter = getMatter();
        const { Engine } = Matter;

        const animate = () => {
            if (!this.isRunning) return;

            Engine.update(this.engine, 1000 / 60);

            for (const pb of this.physicsBodies) {
                pb.sync();
            }

            requestAnimationFrame(animate);
        };
        animate();
    }

    _handleResize() {
        const Matter = getMatter();
        const { Bodies, Composite } = Matter;

        const rect = this.container.getBoundingClientRect();
        const w = rect.width || window.innerWidth;
        const h = rect.height || window.innerHeight;

        const bodies = Composite.allBodies(this.engine.world);
        const walls = bodies.filter(b => b.isStatic);
        Composite.remove(this.engine.world, walls);

        const wallThickness = 100;
        const newWalls = [
            Bodies.rectangle(w / 2, h + wallThickness/2, w + 200, wallThickness, { isStatic: true, friction: this.friction, restitution: this.restitution }),
            Bodies.rectangle(-wallThickness/2, h / 2, wallThickness, h + 200, { isStatic: true, friction: this.friction, restitution: this.restitution }),
            Bodies.rectangle(w + wallThickness/2, h / 2, wallThickness, h + 200, { isStatic: true, friction: this.friction, restitution: this.restitution }),
            Bodies.rectangle(w / 2, -wallThickness*2, w + 200, wallThickness, { isStatic: true, friction: this.friction, restitution: this.restitution }),
        ];
        Composite.add(this.engine.world, newWalls);
    }

    setGravity(value) {
        this.gravity = value;
        if (this.engine) {
            this.engine.gravity.y = value;
        }
    }

    setFriction(value) {
        this.friction = value;
        if (this.engine) {
            const bodies = this.physicsBodies.map(pb => pb.body);
            bodies.forEach(body => {
                body.friction = value;
            });
        }
    }

    setBlockCount(value) {
        const Matter = getMatter();
        const { Bodies, Composite, Body } = Matter;
        
        const currentCount = this.physicsBodies.length;
        const diff = value - currentCount;
        
        const rect = this.container.getBoundingClientRect();
        const w = rect.width || window.innerWidth;
        const h = rect.height || window.innerHeight;
        const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h * 0.3;
                const size = 30 + Math.random() * 50;
                
                const body = Bodies.rectangle(x, y, size, size, {
                    friction: this.friction,
                    restitution: this.restitution,
                    frictionAir: 0.01,
                });

                const el = document.createElement('div');
                el.style.width = size + 'px';
                el.style.height = size + 'px';
                el.style.background = colors[Math.floor(Math.random() * colors.length)];
                el.style.position = 'absolute';
                el.style.borderRadius = '4px';
                el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                el.style.pointerEvents = 'none';
                this.container.appendChild(el);

                const physicsBody = new PhysicsBody(body, el);
                this.physicsBodies.push(physicsBody);
                Composite.add(this.engine.world, body);
            }
        } else if (diff < 0) {
            const toRemove = this.physicsBodies.splice(currentCount + diff);
            toRemove.forEach(pb => {
                if (pb.element && pb.element.parentNode) {
                    pb.element.parentNode.removeChild(pb.element);
                }
                Composite.remove(this.engine.world, pb.body);
            });
        }
    }

    explode() {
        const Matter = getMatter();
        const { Body } = Matter;

        for (const pb of this.physicsBodies) {
            const forceX = (Math.random() - 0.5) * 0.15;
            const forceY = -Math.random() * 0.15 - 0.05;
            Body.applyForce(pb.body, pb.body.position, { x: forceX, y: forceY });
        }
    }

    reset() {
        this.isRunning = false;
        location.reload();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Antigravity;
    module.exports.Antigravity = Antigravity;
    module.exports.PhysicsBody = PhysicsBody;
}
window.Antigravity = Antigravity;
window.PhysicsBody = PhysicsBody;
