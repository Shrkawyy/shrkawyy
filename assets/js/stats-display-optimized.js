(function() {
    'use strict';

    class StatsDisplay {
        constructor() {
            // Cache DOM elements for better performance
            this.elements = {
                pingParent: document.querySelector('#stats-ping-parent .stat-value'),
                pingChild: document.querySelector('#stats-ping-child .stat-value'),
                fps: document.querySelector('#stats-fps .stat-value'),
                mass: document.querySelector('#stats-mass .stat-value'),
                render: document.querySelector('#stats-render .stat-value')
            };
            // aliases used by other methods
            this.pingParentEl = this.elements.pingParent;
            this.pingChildEl = this.elements.pingChild;
            this.fpsEl = this.elements.fps;
            this.massEl = this.elements.mass;
            this.renderEl = this.elements.render;
            
            // Performance tracking
            this.lastFrameTime = performance.now();
            this.frameCount = 0;
            this.fps = 0;
            this.lastUpdate = performance.now();
            
            // Game stats
            this.lastParentPing = -1;
            this.lastChildPing = -1;
            this.playerMass = 0;
            this.renderMethod = 'Canvas 2D';
            
            // Throttling for performance
            this.updateThrottle = 100; // Update every 100ms
            
            this.init();
        }

        init() {
            // Use a single unified update loop for better performance
            this.startUnifiedLoop();
            
            // Initialize displays
            this.updateFpsDisplay(0);
            this.updateMassDisplay(0);
            this.updateRenderDisplay();
            this.updatePingDisplay(-1, 'parent');
            this.updatePingDisplay(-1, 'child');
            // begin active ping measurements
            this.startPingMeasurement();
        }

        startUnifiedLoop() {
            let lastTime = performance.now();
            
            const updateLoop = (currentTime) => {
                // Calculate FPS
                this.frameCount++;
                const deltaTime = currentTime - lastTime;
                
                if (deltaTime >= 1000) {
                    this.fps = Math.round((this.frameCount * 1000) / deltaTime);
                    this.frameCount = 0;
                    lastTime = currentTime;
                    this.updateFpsDisplay(this.fps);
                }
                
                // Throttled updates for other stats
                if (currentTime - this.lastUpdate >= this.updateThrottle) {
                    this.updatePingDisplay(this.lastParentPing, 'parent');
                    this.updatePingDisplay(this.lastChildPing, 'child');
                    this.updateMassDisplay(this.playerMass);
                    this.lastUpdate = currentTime;
                }
                
                requestAnimationFrame(updateLoop);
            };
            
            requestAnimationFrame(updateLoop);
        }

        updateFpsDisplay(fps) {
            const element = this.elements.fps;
            if (!element) return;
            
            let displayValue = fps;
            if (fps >= 1000) {
                displayValue = (fps / 1000).toFixed(1) + 'k';
            }
            
            element.textContent = displayValue;
            
            // Add performance classes
            element.className = 'stat-value';
            if (fps >= 60) {
                element.classList.add('high');
            } else if (fps >= 30) {
                element.classList.add('medium');
            } else {
                element.classList.add('low');
            }
        }

        updatePingDisplay(ping, type) {
            const element = type === 'parent' ? this.elements.pingParent : this.elements.pingChild;
            if (!element) return;
            
            if (ping < 0) {
                element.textContent = '--';
                return;
            }
            
            let displayValue = ping;
            if (ping >= 1000) {
                displayValue = (ping / 1000).toFixed(1) + 'k';
            }
            
            element.textContent = displayValue + 'ms';
            
            // Add ping quality classes
            element.className = 'stat-value';
            if (ping < 50) {
                element.classList.add('excellent');
            } else if (ping < 100) {
                element.classList.add('good');
            } else if (ping < 200) {
                element.classList.add('fair');
            } else {
                element.classList.add('poor');
            }
        }

        updateMassDisplay(mass) {
            const element = this.elements.mass;
            if (!element) return;
            
            let displayValue = mass;
            if (mass >= 1000) {
                displayValue = (mass / 1000).toFixed(1) + 'k';
            }
            
            element.textContent = displayValue;
        }

        startPingMeasurement() {
            // measure both parent and child pings periodically
            try {
                this.pingInterval = setInterval(() => {
                    this.measurePing('parent');
                    this.measurePing('child');
                }, 1000);

                // initial quick measurement
                setTimeout(() => {
                    this.measurePing('parent');
                    this.measurePing('child');
                }, 500);
            } catch (e) {
                // ignore
            }
        }

        measurePing(clientType = 'parent') {
            try {
                const start = performance.now();
                const url = location.origin + '/assets/images/virus.webp?cb=' + Date.now() + '_' + clientType;

                if (window.fetch) {
                    const controller = window.AbortController ? new AbortController() : null;
                    const signal = controller ? controller.signal : undefined;
                    const timeout = setTimeout(() => { if (controller) controller.abort(); }, 4000);

                    fetch(url, { method: 'HEAD', cache: 'no-store', signal }).then(() => {
                        clearTimeout(timeout);
                        const now = performance.now();
                        const ping = Math.max(0, Math.round(now - start));

                        if (clientType === 'parent') {
                            this.lastParentPing = ping;
                        } else {
                            this.lastChildPing = ping;
                        }

                        this.updatePingDisplay(ping, clientType);
                    }).catch(() => {
                        clearTimeout(timeout);
                        const i = new Image();
                        i.onload = i.onerror = () => {
                            const now2 = performance.now();
                            const ping = Math.max(0, Math.round(now2 - start));

                            if (clientType === 'parent') {
                                this.lastParentPing = ping;
                            } else {
                                this.lastChildPing = ping;
                            }

                            this.updatePingDisplay(ping, clientType);
                            i.onload = i.onerror = null;
                        };
                        i.src = url;
                    });
                } else {
                    const img = new Image();
                    img.onload = img.onerror = () => {
                        const now = performance.now();
                        const ping = Math.max(0, Math.round(now - start));

                        if (clientType === 'parent') {
                            this.lastParentPing = ping;
                        } else {
                            this.lastChildPing = ping;
                        }

                        this.updatePingDisplay(ping, clientType);
                        img.onload = img.onerror = null;
                    };
                    img.src = url;
                }
            } catch (e) {
                // swallow
            }
        }

        updateRenderDisplay() {
            const element = this.elements.render;
            if (!element) return;
            
            element.textContent = this.renderMethod;
        }

        // Public API for external updates
        setPing(ping, type) {
            if (type === 'parent') {
                this.lastParentPing = ping;
            } else {
                this.lastChildPing = ping;
            }
        }

        setMass(mass) {
            this.playerMass = mass;
        }

        setRenderMethod(method) {
            this.renderMethod = method;
            this.updateRenderDisplay();
        }

        // Update mass from game state
        updateMassFromGame() {
            try {
                const multibox = window.multibox;
                if (multibox && multibox.clients && multibox.clients.length > 0) {
                    let totalMass = 0;
                    let hasOwnedCells = false;
                    
                    multibox.clients.forEach(client => {
                        if (client.ownedCells) {
                            client.ownedCells.forEach(cell => {
                                if (cell && cell.mass) {
                                    totalMass += cell.mass;
                                    hasOwnedCells = true;
                                }
                            });
                        }
                    });
                    
                    if (hasOwnedCells) {
                        this.setMass(Math.round(totalMass));
                    }
                }
            } catch (error) {
                // Silently handle errors to prevent performance impact
            }
        }

        // Performance monitoring
        getPerformanceMetrics() {
            return {
                fps: this.fps,
                parentPing: this.lastParentPing,
                childPing: this.lastChildPing,
                mass: this.playerMass,
                renderMethod: this.renderMethod
            };
        }

        // Destroy method for cleanup
        destroy() {
            // Cancel any ongoing animations or intervals
            this.elements = null;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.statsDisplay = new StatsDisplay();
        });
    } else {
        window.statsDisplay = new StatsDisplay();
    }

})();
