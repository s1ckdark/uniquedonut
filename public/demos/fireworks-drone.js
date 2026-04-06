
class Particle3D {
    constructor(x, y, z, color, type = 'spark') {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = (Math.random() - 0.5) * 5; // Random velocity
        this.vy = (Math.random() - 0.5) * 5;
        this.vz = (Math.random() - 0.5) * 5;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        this.gravity = 0.05;
        this.type = type; // 'spark', 'trail', 'debris'
        
        // Special physics for launch trails
        if (type === 'trail') {
            this.vx *= 0.1;
            this.vy *= 0.1;
            this.vz *= 0.1;
            this.decay = 0.05;
        }
    }

    update() {
        // Apply physics
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        
        // Gravity (only affects y)
        this.vy += this.gravity;
        
        // Air resistance
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.vz *= 0.95;
        
        this.life -= this.decay;
    }
}

class Firework {
    constructor(x, y, z, targetY, color, drone) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.startX = x;
        this.startZ = z;
        this.targetY = targetY;
        this.color = color;
        this.drone = drone;
        this.state = 'launching';
        this.particles = [];

        this.size = 0.5 + Math.random() * 1.0;

        this.vy = (-8 - Math.random() * 4) * Math.sqrt(this.size);
        this.vx = (Math.random() - 0.5) * 2;
        this.vz = (Math.random() - 0.5) * 1;

        this.curveAmplitude = 30 + Math.random() * 50;
        this.curveFrequency = 0.5 + Math.random() * 0.5;
        this.curvePhase = Math.random() * Math.PI * 2;
        
        this.trailTimer = 0;
        this.launchProgress = 0;
    }

    update() {
        if (this.state === 'launching') {
            this.launchProgress += 0.02;
            
            this.y += this.vy;
            this.vy *= 0.98;
            
            const curveEffect = Math.pow(this.launchProgress, 2);
            const curveX = Math.sin(this.launchProgress * Math.PI * this.curveFrequency + this.curvePhase) * this.curveAmplitude * curveEffect;
            const curveZ = Math.cos(this.launchProgress * Math.PI * this.curveFrequency * 0.7 + this.curvePhase) * this.curveAmplitude * 0.5 * curveEffect;
            
            this.x = this.startX + this.vx * (-this.y * 0.1) + curveX;
            this.z = this.startZ + this.vz * (-this.y * 0.05) + curveZ;
            
            this.trailTimer++;
            if (this.trailTimer % 2 === 0) {
                this.particles.push(new Particle3D(
                    this.x + (Math.random() - 0.5) * 2,
                    this.y,
                    this.z + (Math.random() - 0.5) * 2,
                    this.color,
                    'trail'
                ));
            }

            if (this.y <= this.targetY || this.vy > -1) {
                this.explode();
            }
        } else if (this.state === 'exploding') {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
            
            if (this.particles.length === 0) {
                this.state = 'dead';
            }
        }
    }

    explode() {
        this.state = 'exploding';
        const density = this.drone ? this.drone.particleDensity : 1.0;
        const particleCount = Math.floor((80 + Math.random() * 80) * density * this.size);

        if (this.drone) {
            const relZ = this.z - this.drone.cameraZ;
            const distance = Math.max(100, relZ);
            const intensity = Math.min(0.6, 800 / distance) * this.size;
            this.drone.addFlash(this.color, intensity);
        }

        for (let i = 0; i < particleCount; i++) {
            const p = new Particle3D(this.x, this.y, this.z, this.color);
            
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const baseSpeed = 2 + Math.random() * 6;
            const speed = baseSpeed * Math.sqrt(this.size);
            
            p.vx = speed * Math.sin(phi) * Math.cos(theta);
            p.vy = speed * Math.sin(phi) * Math.sin(theta);
            p.vz = speed * Math.cos(phi);
            
            p.decay = 0.005 + Math.random() * 0.02;
            
            this.particles.push(p);
        }
    }
}

export default class FireworksDrone {
    constructor(options = {}) {
        this.container = typeof options.container === 'string' 
            ? document.querySelector(options.container) 
            : options.container || document.body;
            
        // Simulation params
        this.cameraZ = 0;
        this.speed = options.speed || 5;
        this.intensity = options.intensity || 0.05; // Spawn probability
        this.chaos = options.chaos || 0.5; // Camera shake amount
        
        this.particleDensity = options.particleDensity !== undefined ? options.particleDensity : 1.0;
        this.particleSize = options.particleSize !== undefined ? options.particleSize : 1.0;
        this.glowIntensity = options.glowIntensity !== undefined ? options.glowIntensity : 0.3;
        this.flashIntensity = options.flashIntensity !== undefined ? options.flashIntensity : 1.0;
        
        this.fireworks = [];
        this.stars = [];
        this.flashEffects = [];

        this.mouseX = 0;
        this.mouseY = 0;
        
        // Init p5
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
                
                // Initialize background stars
                for(let i=0; i<200; i++) {
                    self.stars.push({
                        x: (Math.random() - 0.5) * w * 4,
                        y: (Math.random() - 0.5) * h * 4,
                        z: 1000 + Math.random() * 5000,
                        size: Math.random() * 2
                    });
                }
            };
            
            p.draw = () => {
                const w = p.width;
                const h = p.height;
                const centerX = w / 2;
                const centerY = h / 2;
                
                // 1. Update Camera Position
                self.cameraZ += self.speed;
                
                // Camera Sway (Simulate drone hovering/flying)
                const time = p.millis() * 0.001;
                const swayX = Math.sin(time * 0.5) * 50 * self.chaos + (self.mouseX - w/2) * 0.5;
                const swayY = Math.cos(time * 0.3) * 30 * self.chaos + (self.mouseY - h/2) * 0.5;
                
                // 2. Clear & Background
                p.background(5, 5, 20); // Deep dark blue/black
                
                // 3. Draw Stars (Far background, parallax)
                p.noStroke();
                p.fill(255);
                for(let s of self.stars) {
                    // Simple 3D projection for stars relative to camera
                    // Stars are infinitely far, so they don't move much in Z, but respond to X/Y sway
                    const fov = 500;
                    const scale = fov / (fov + 100); // Almost constant scale
                    const sx = (s.x - swayX) * scale + centerX;
                    const sy = (s.y - swayY) * scale + centerY;
                    
                    if(sx > 0 && sx < w && sy > 0 && sy < h) {
                        p.ellipse(sx, sy, s.size, s.size);
                    }
                }
                
                // 4. Spawn Fireworks
                // Spawn ahead of the camera
                if (Math.random() < self.intensity) {
                    const spawnX = swayX + (Math.random() - 0.5) * 800;
                    const spawnZ = self.cameraZ + 1500 + Math.random() * 1000; // Spawn far ahead
                    const spawnY = 500; // Below screen
                    const targetY = -200 - Math.random() * 300; // Explode high up
                    
                    // Random bright colors
                    const colors = [
                        [255, 50, 50],   // Red
                        [50, 150, 255],  // Blue
                        [255, 220, 50],  // Gold
                        [200, 50, 255],  // Purple
                        [50, 255, 100],  // Green
                        [255, 255, 255]  // White
                    ];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    self.fireworks.push(new Firework(spawnX, spawnY, spawnZ, targetY, color, self));
                }
                
                // 5. Update & Draw Fireworks
                // We need to sort by depth (Painter's algorithm) for proper transparency
                // But simplified: draw them.
                
                // We need to collect all renderable items (particles) to sort them
                let renderList = [];
                
                for (let i = self.fireworks.length - 1; i >= 0; i--) {
                    const fw = self.fireworks[i];
                    fw.update();
                    
                    if (fw.state === 'dead') {
                        self.fireworks.splice(i, 1);
                        continue;
                    }
                    
                    if (fw.state === 'launching') {
                        renderList.push({
                            x: fw.x, y: fw.y, z: fw.z,
                            size: 4 * fw.size, color: [255, 255, 200], life: 1, type: 'rocket'
                        });
                    }
                    
                    for (let particle of fw.particles) {
                        renderList.push({
                            x: particle.x, y: particle.y, z: particle.z,
                            size: 2 * fw.size, color: particle.color, life: particle.life, type: particle.type
                        });
                    }
                }
                
                // Sort by Z (furthest first)
                // Relative Z = p.z - cameraZ
                renderList.sort((a, b) => (b.z - self.cameraZ) - (a.z - self.cameraZ));
                
                // Render
                p.noStroke();
                
                for (let item of renderList) {
                    const relZ = item.z - self.cameraZ;
                    
                    // Cull if behind camera or too far
                    if (relZ < 10 || relZ > 4000) continue;
                    
                    // Perspective projection
                    const fov = 400;
                    const scale = fov / relZ;
                    
                    const sx = (item.x - swayX) * scale + centerX;
                    const sy = (item.y - swayY) * scale + centerY;
                    
                    // Fog/Depth fading
                    // Alpha based on life AND distance
                    const distAlpha = p.map(relZ, 0, 3000, 1, 0, true);
                    const alpha = item.life * distAlpha * 255;
                    
                    if (alpha < 1) continue;
                    
                    const size = item.size * scale * 10 * self.particleSize; // Scale up size by perspective
                    
                    // Draw glow
                    const c = item.color;
                    
                    // Outer glow
                    p.fill(c[0], c[1], c[2], alpha * self.glowIntensity);
                    p.ellipse(sx, sy, size * 4, size * 4);
                    
                    // Core
                    p.fill(c[0], c[1], c[2], alpha);
                    p.ellipse(sx, sy, size, size);
                }

                for (let i = self.flashEffects.length - 1; i >= 0; i--) {
                    const flash = self.flashEffects[i];
                    p.fill(flash.color[0], flash.color[1], flash.color[2], flash.intensity * 255);
                    p.rect(0, 0, w, h);
                    flash.intensity -= flash.decay;
                    if (flash.intensity <= 0) {
                        self.flashEffects.splice(i, 1);
                    }
                }
            };
            
            p.windowResized = () => {
                const w = self.container.clientWidth || window.innerWidth;
                const h = self.container.clientHeight || window.innerHeight;
                p.resizeCanvas(w, h);
            };
        });
    }
    
    updateSettings(settings) {
        if(settings.speed !== undefined) this.speed = settings.speed;
        if(settings.intensity !== undefined) this.intensity = settings.intensity;
        if(settings.chaos !== undefined) this.chaos = settings.chaos;
        if(settings.particleDensity !== undefined) this.particleDensity = settings.particleDensity;
        if(settings.particleSize !== undefined) this.particleSize = settings.particleSize;
        if(settings.glowIntensity !== undefined) this.glowIntensity = settings.glowIntensity;
        if(settings.flashIntensity !== undefined) this.flashIntensity = settings.flashIntensity;
    }

    addFlash(color, intensity) {
        const adjustedIntensity = intensity * this.flashIntensity;
        if (adjustedIntensity > 0.01) {
            this.flashEffects.push({
                color: color,
                intensity: adjustedIntensity,
                decay: 0.015 + adjustedIntensity * 0.02
            });
        }
    }
    
    updateMouse(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
}
