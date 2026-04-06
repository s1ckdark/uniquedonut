import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class AntigravityTrail {
    constructor(options = {}) {
        this.container = typeof options.container === 'string' 
            ? document.querySelector(options.container) 
            : options.container || document.body;
            
        this.particleCount = options.particleCount || 3000;
        this.colors = options.colors || [0x4285f4, 0xea4335, 0xfbbc05, 0x34a853]; // Google colors
        this.repulsionRadius = options.repulsionRadius || 150;
        this.repulsionForce = options.repulsionForce || 2.0;
        this.returnSpeed = options.returnSpeed || 0.05;
        this.damping = options.damping || 0.9;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        
        this.mouse = new THREE.Vector2(-1000, -1000);
        this.raycaster = new THREE.Raycaster();
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        
        // Particle data
        this.initialPositions = [];
        this.currentPositions = [];
        this.velocities = [];
        
        this.isRunning = false;
        
        this.resizeHandler = this._handleResize.bind(this);
        this.mouseMoveHandler = this._handleMouseMove.bind(this);
    }
    
    init() {
        this._setupScene();
        this._createParticles();
        this._addEventListeners();
        this._startAnimation();
    }
    
    _setupScene() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        
        // Orthographic camera for 2D-like effect
        this.camera = new THREE.OrthographicCamera(
            width / -2, width / 2,
            height / 2, height / -2,
            1, 1000
        );
        this.camera.position.z = 100;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }
    
    _createParticles() {
        // Geometry for each particle (a small dash)
        const geometry = new THREE.PlaneGeometry(8, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        this.mesh = new THREE.InstancedMesh(geometry, material, this.particleCount);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        const dummy = new THREE.Object3D();
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        for (let i = 0; i < this.particleCount; i++) {
            // Random position across the screen
            const x = (Math.random() - 0.5) * width;
            const y = (Math.random() - 0.5) * height;
            const z = 0;
            
            this.initialPositions.push(new THREE.Vector3(x, y, z));
            this.currentPositions.push(new THREE.Vector3(x, y, z));
            this.velocities.push(new THREE.Vector3(0, 0, 0));
            
            dummy.position.set(x, y, z);
            dummy.rotation.z = Math.random() * Math.PI; // Random rotation
            dummy.updateMatrix();
            
            this.mesh.setMatrixAt(i, dummy.matrix);
            
            // Set random color
            const colorHex = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.mesh.setColorAt(i, new THREE.Color(colorHex));
        }
        
        this.mesh.instanceMatrix.needsUpdate = true;
        this.mesh.instanceColor.needsUpdate = true;
        this.scene.add(this.mesh);
    }
    
    _addEventListeners() {
        window.addEventListener('resize', this.resizeHandler);
        this.container.addEventListener('mousemove', this.mouseMoveHandler);
        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this._handleMouseMove(e.touches[0]);
        }, { passive: false });
    }
    
    _handleResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.left = width / -2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = height / -2;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        // Optional: Re-distribute particles on resize (or just let them stay)
        // For now, we keep them relative to center, which works fine with ortho camera
    }
    
    _handleMouseMove(event) {
        // Convert mouse event client coordinates to Three.js coordinates
        // Since we are using Orthographic camera centered at (0,0):
        // (0,0) is center of screen.
        // x goes from -width/2 to width/2
        // y goes from -height/2 to height/2 (note: mouse Y is inverted in DOM)
        
        const rect = this.container.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = -(event.clientY - rect.top - rect.height / 2); // Invert Y
        
        this.mouse.set(x, y);
    }
    
    _startAnimation() {
        this.isRunning = true;
        
        const dummy = new THREE.Object3D();
        
        const animate = () => {
            if (!this.isRunning) return;
            
            requestAnimationFrame(animate);
            
            for (let i = 0; i < this.particleCount; i++) {
                const initialPos = this.initialPositions[i];
                const currentPos = this.currentPositions[i];
                const velocity = this.velocities[i];
                
                // 1. Calculate vector from mouse to particle
                const dx = currentPos.x - this.mouse.x;
                const dy = currentPos.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                
                // 2. Repulsion from mouse
                if (dist < this.repulsionRadius) {
                    const force = (1 - dist / this.repulsionRadius) * this.repulsionForce;
                    // Push away
                    velocity.x += (dx / dist) * force * 5; 
                    velocity.y += (dy / dist) * force * 5;
                }
                
                // 3. Spring force back to initial position
                const returnX = initialPos.x - currentPos.x;
                const returnY = initialPos.y - currentPos.y;
                
                velocity.x += returnX * this.returnSpeed;
                velocity.y += returnY * this.returnSpeed;
                
                // 4. Apply damping (friction)
                velocity.x *= this.damping;
                velocity.y *= this.damping;
                
                // 5. Update position
                currentPos.x += velocity.x;
                currentPos.y += velocity.y;
                
                // 6. Update matrix
                dummy.position.set(currentPos.x, currentPos.y, currentPos.z);
                // Optional: Rotate based on velocity for visual flair
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                if (speed > 0.1) {
                    dummy.rotation.z = Math.atan2(velocity.y, velocity.x);
                }
                
                dummy.updateMatrix();
                this.mesh.setMatrixAt(i, dummy.matrix);
            }
            
            this.mesh.instanceMatrix.needsUpdate = true;
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    destroy() {
        this.isRunning = false;
        window.removeEventListener('resize', this.resizeHandler);
        this.container.removeEventListener('mousemove', this.mouseMoveHandler);
        
        if (this.renderer && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
    
    setParams(params) {
        if (params.repulsionRadius !== undefined) {
            this.repulsionRadius = params.repulsionRadius;
        }
        if (params.repulsionForce !== undefined) {
            this.repulsionForce = params.repulsionForce;
        }
        if (params.returnSpeed !== undefined) {
            this.returnSpeed = params.returnSpeed;
        }
        if (params.damping !== undefined) {
            this.damping = params.damping;
        }
    }
}
