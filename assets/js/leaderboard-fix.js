// Leaderboard Fix - Override the drawLeaderboard function
(function() {
    'use strict';
    
    // Wait for the game to load
    function waitForGame() {
        if (window.game && window.game.drawLeaderboard) {
            fixLeaderboard();
        } else {
            setTimeout(waitForGame, 100);
        }
    }
    
    function fixLeaderboard() {
        // Store original function
        const originalDrawLeaderboard = window.game.drawLeaderboard;
        
        // Override with fixed version
        window.game.drawLeaderboard = function() {
            const client = window.multibox.getActiveClient();
            if (!client) {
                return;
            }
            
            const leaderboardData = {
                items: client.stores.leaderboard.map(item => ({
                    name: item.nickname,
                    pos: item.position,
                    mass: item.totalMass,
                    isMe: item.isMe
                }))
            };
            
            const canvas = this.leaderboardCanvas || document.getElementById('leaderboard-canvas');
            const ctx = (this.leaderboardCtx || (canvas ? canvas.getContext('2d') : null));
            
            if (!canvas || !ctx) return;
            
            // Make canvas much smaller
            const baseWidth = 150; // Much smaller width
            canvas.width = baseWidth;
            
            const maxItems = Math.min(6, leaderboardData.items.length); // Show fewer items
            const rowHeight = 16; // Much smaller row height
            const headerHeight = 22;
            const padding = 8;
            
            canvas.height = headerHeight + (rowHeight * maxItems) + (padding * 2);
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Enable ultra-sharp text rendering
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            
            // Disable image smoothing for crisp text
            ctx.imageSmoothingEnabled = false;
            
            // Set up sharp rendering
            ctx.save();
            
            // Use integer positioning for sharp text
            const scale = 1; // No scaling for sharpness
            ctx.scale(scale, scale);
            
            // Draw header
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px Ubuntu';
            ctx.textAlign = 'center';
            ctx.letterSpacing = '0';
            ctx.fillText('Leaderboard', canvas.width / 2, 16);
            
            // Draw items
            ctx.textAlign = 'left';
            
            leaderboardData.items.slice(0, 6).forEach((item, index) => {
                const y = Math.round(headerHeight + padding + (index * rowHeight) + (rowHeight / 2));
                const x = Math.round(padding);
                
                // Position
                ctx.font = 'bold 9px Ubuntu';
                ctx.fillStyle = '#FFD700';
                ctx.letterSpacing = '0';
                const posText = `${item.pos}.`;
                ctx.fillText(posText, x, y);
                
                // Name (very small but sharp)
                ctx.font = '6px Ubuntu';
                ctx.fillStyle = item.isMe ? '#FFD700' : '#FFFFFF';
                ctx.letterSpacing = '0';
                const nameX = Math.round(x + 15);
                
                // Truncate name if too long
                let displayName = item.name;
                const maxWidth = canvas.width - nameX - 35;
                if (ctx.measureText(displayName).width > maxWidth) {
                    while (ctx.measureText(displayName + '...').width > maxWidth && displayName.length > 3) {
                        displayName = displayName.slice(0, -1);
                    }
                    if (displayName.length > 3) {
                        displayName += '...';
                    } else {
                        displayName = displayName.slice(0, 3);
                    }
                }
                
                ctx.fillText(displayName, nameX, y);
                
                // Mass
                ctx.font = '6px Ubuntu';
                ctx.fillStyle = '#FFFFFF';
                ctx.letterSpacing = '0';
                const massText = item.mass >= 1000 ? 
                    (item.mass / 1000).toFixed(1) + 'k' : 
                    item.mass.toString();
                const massX = Math.round(canvas.width - padding - 25);
                ctx.fillText(massText, massX, y);
            });
            
            ctx.restore();
        };
        
        console.log('Leaderboard fix applied - smaller fonts, no letter spacing, wider canvas');
    }
    
    // Start waiting for game
    waitForGame();
})();
