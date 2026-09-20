// Castle Quest - 2D Zelda-like Adventure Game

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'start'; // start, playing, gameover, victory
let currentRoom = 0;
const totalRooms = 7;

// Player
const player = {
    x: 100,
    y: 384,
    width: 32,
    height: 32,
    speed: 5,
    health: 100,
    maxHealth: 100,
    direction: 'right',
    isAttacking: false,
    attackCooldown: 0,
    attackDuration: 0,
    invincible: 0,
    color: '#4169e1'
};

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        attemptAttack();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Room design - castle layout with walls and obstacles
const rooms = [
    // Room 1: Entrance hall
    {
        walls: [
            {x: 200, y: 0, width: 20, height: 200},
            {x: 200, y: 568, width: 20, height: 200},
            {x: 800, y: 200, width: 20, height: 368}
        ],
        fires: [
            {x: 150, y: 300, size: 20},
            {x: 850, y: 500, size: 25}
        ],
        enemies: [
            {x: 400, y: 300, type: 'guard'},
            {x: 600, y: 400, type: 'guard'}
        ],
        exitX: 950,
        exitY: 384,
        boss: null
    },
    // Room 2: Corridor with fire pits
    {
        walls: [
            {x: 0, y: 150, width: 300, height: 20},
            {x: 500, y: 598, width: 300, height: 20},
            {x: 700, y: 200, width: 20, height: 200}
        ],
        fires: [
            {x: 300, y: 400, size: 30},
            {x: 500, y: 300, size: 25},
            {x: 700, y: 500, size: 20}
        ],
        enemies: [
            {x: 350, y: 250, type: 'guard'},
            {x: 550, y: 450, type: 'guard'}
        ],
        exitX: 950,
        exitY: 384,
        boss: null
    },
    // Room 3: Throne room antechamber
    {
        walls: [
            {x: 150, y: 0, width: 20, height: 250},
            {x: 150, y: 518, width: 20, height: 250},
            {x: 600, y: 150, width: 20, height: 468},
            {x: 850, y: 0, width: 20, height: 300}
        ],
        fires: [
            {x: 200, y: 350, size: 25},
            {x: 400, y: 200, size: 20},
            {x: 700, y: 450, size: 30},
            {x: 900, y: 600, size: 25}
        ],
        enemies: [
            {x: 300, y: 384, type: 'guard'},
            {x: 750, y: 300, type: 'guard'}
        ],
        exitX: 950,
        exitY: 384,
        boss: null
    },
    // Room 4: Fire hall
    {
        walls: [
            {x: 250, y: 0, width: 20, height: 300},
            {x: 500, y: 468, width: 20, height: 300},
            {x: 750, y: 0, width: 20, height: 250}
        ],
        fires: [
            {x: 150, y: 200, size: 35},
            {x: 350, y: 500, size: 30},
            {x: 600, y: 300, size: 40},
            {x: 850, y: 450, size: 25}
        ],
        enemies: [
            {x: 400, y: 200, type: 'guard'},
            {x: 650, y: 500, type: 'guard'}
        ],
        exitX: 950,
        exitY: 384,
        boss: null
    },
    // Room 5: Dark passage
    {
        walls: [
            {x: 0, y: 200, width: 200, height: 20},
            {x: 300, y: 548, width: 400, height: 20},
            {x: 600, y: 100, width: 20, height: 250},
            {x: 850, y: 350, width: 20, height: 418}
        ],
        fires: [
            {x: 250, y: 300, size: 25},
            {x: 500, y: 400, size: 30},
            {x: 750, y: 250, size: 20}
        ],
        enemies: [
            {x: 350, y: 350, type: 'guard'},
            {x: 700, y: 450, type: 'guard'}
        ],
        exitX: 950,
        exitY: 384,
        boss: null
    },
    // Room 6: Final approach
    {
        walls: [
            {x: 200, y: 0, width: 20, height: 350},
            {x: 400, y: 418, width: 20, height: 350},
            {x: 600, y: 0, width: 20, height: 300},
            {x: 800, y: 468, width: 20, height: 300}
        ],
        fires: [
            {x: 300, y: 450, size: 30},
            {x: 500, y: 250, size: 35},
            {x: 700, y: 500, size: 25},
            {x: 900, y: 300, size: 30}
        ],
        enemies: [
            {x: 300, y: 200, type: 'guard'},
            {x: 500, y: 550, type: 'guard'},
            {x: 750, y: 350, type: 'guard'}
        ],
        exitX: 950,
        exitY: 384,
        boss: null
    },
    // Room 7: Boss chamber
    {
        walls: [
            {x: 150, y: 0, width: 20, height: 200},
            {x: 150, y: 568, width: 20, height: 200},
            {x: 500, y: 150, width: 20, height: 468}
        ],
        fires: [
            {x: 100, y: 100, size: 40},
            {x: 100, y: 650, size: 40},
            {x: 400, y: 384, size: 30}
        ],
        enemies: [],
        exitX: 950,
        exitY: 384,
        boss: {
            x: 850,
            y: 384,
            width: 80,
            height: 80,
            health: 200,
            maxHealth: 200,
            phase: 'idle',
            attackTimer: 0,
            patternIndex: 0
        }
    }
];

let activeEnemies = [];
let projectiles = [];
let particles = [];

// Initialize room
function initRoom(roomNum) {
    const room = rooms[roomNum];
    activeEnemies = room.enemies.map(e => ({
        x: e.x,
        y: e.y,
        width: 32,
        height: 32,
        health: 30,
        maxHealth: 30,
        speed: 2,
        type: e.type,
        direction: 'left',
        attackCooldown: 0,
        state: 'chase'
    }));
    
    projectiles = [];
    particles = [];
    
    if (roomNum === 0) {
        player.x = 50;
        player.y = 384;
    } else {
        player.x = 50;
        player.y = room.exitY;
    }
    
    updateUI();
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Wall collision
function checkWallCollision(x, y, width, height) {
    const room = rooms[currentRoom];
    for (let wall of room.walls) {
        if (x < wall.x + wall.width &&
            x + width > wall.x &&
            y < wall.y + wall.height &&
            y + height > wall.y) {
            return true;
        }
    }
    // Boundary checks
    if (x < 0 || x + width > canvas.width || y < 0 || y + height > canvas.height) {
        return true;
    }
    return false;
}

// Attack function
function attemptAttack() {
    if (player.attackCooldown > 0 || player.isAttacking) return;
    
    player.isAttacking = true;
    player.attackDuration = 15;
    player.attackCooldown = 30;
    
    // Check enemy hits
    const attackRange = {
        x: player.direction === 'right' ? player.x + player.width : player.x - 40,
        y: player.y - 10,
        width: 40,
        height: player.height + 20
    };
    
    activeEnemies.forEach(enemy => {
        if (checkCollision(attackRange, enemy)) {
            enemy.health -= 15;
            createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff0000', 5);
            if (enemy.health <= 0) {
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#8b0000', 15);
            }
        }
    });
    
    // Check boss hit
    const room = rooms[currentRoom];
    if (room.boss && checkCollision(attackRange, room.boss)) {
        room.boss.health -= 10;
        createParticles(room.boss.x + room.boss.width/2, room.boss.y + room.boss.height/2, '#8b0000', 8);
        if (room.boss.health <= 0) {
            victory();
        }
    }
}

// Create particles
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 30,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// Update player
function updatePlayer() {
    let dx = 0, dy = 0;
    
    if (keys['w'] || keys['arrowup']) dy = -player.speed;
    if (keys['s'] || keys['arrowdown']) dy = player.speed;
    if (keys['a'] || keys['arrowleft']) {
        dx = -player.speed;
        player.direction = 'left';
    }
    if (keys['d'] || keys['arrowright']) {
        dx = player.speed;
        player.direction = 'right';
    }
    
    // Move with collision
    if (!checkWallCollision(player.x + dx, player.y, player.width, player.height)) {
        player.x += dx;
    }
    if (!checkWallCollision(player.x, player.y + dy, player.width, player.height)) {
        player.y += dy;
    }
    
    // Update attack state
    if (player.isAttacking) {
        player.attackDuration--;
        if (player.attackDuration <= 0) {
            player.isAttacking = false;
        }
    }
    
    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }
    
    if (player.invincible > 0) {
        player.invincible--;
    }
    
    // Check room exit
    if (player.x > rooms[currentRoom].exitX && currentRoom < totalRooms - 1) {
        currentRoom++;
        initRoom(currentRoom);
    }
    
    // Check fire damage
    const room = rooms[currentRoom];
    room.fires.forEach(fire => {
        const fireRect = {x: fire.x - fire.size/2, y: fire.y - fire.size/2, width: fire.size, height: fire.size};
        if (checkCollision(player, fireRect) && player.invincible <= 0) {
            player.health -= 1;
            player.invincible = 30;
            createParticles(player.x + player.width/2, player.y + player.height/2, '#ff4500', 2);
        }
    });
    
    // Check enemy collision
    activeEnemies.forEach(enemy => {
        if (checkCollision(player, enemy) && player.invincible <= 0) {
            player.health -= 20;
            player.invincible = 60;
            createParticles(player.x + player.width/2, player.y + player.height/2, '#ff0000', 10);
        }
    });
    
    if (player.health <= 0) {
        gameOver();
    }
    
    updateUI();
}

// Update enemies
function updateEnemies() {
    activeEnemies.forEach((enemy, index) => {
        if (enemy.health <= 0) {
            activeEnemies.splice(index, 1);
            return;
        }
        
        // Simple AI: chase player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 50) {
            const moveX = (dx / dist) * enemy.speed;
            const moveY = (dy / dist) * enemy.speed;
            
            if (!checkWallCollision(enemy.x + moveX, enemy.y, enemy.width, enemy.height)) {
                enemy.x += moveX;
            }
            if (!checkWallCollision(enemy.x, enemy.y + moveY, enemy.width, enemy.height)) {
                enemy.y += moveY;
            }
        }
        
        enemy.direction = dx > 0 ? 'right' : 'left';
        
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown--;
        }
    });
}

// Update boss
function updateBoss() {
    const room = rooms[currentRoom];
    if (!room.boss) return;
    
    const boss = room.boss;
    
    if (boss.health <= 0) {
        victory();
        return;
    }
    
    boss.attackTimer++;
    
    // Boss attack patterns
    if (boss.attackTimer > 60) {
        boss.attackTimer = 0;
        boss.patternIndex = (boss.patternIndex + 1) % 4;
        
        switch(boss.patternIndex) {
            case 0: // Fireball spread
                for (let i = -2; i <= 2; i++) {
                    projectiles.push({
                        x: boss.x,
                        y: boss.y + boss.height/2,
                        vx: -8,
                        vy: i * 2,
                        type: 'fireball',
                        size: 20
                    });
                }
                break;
            case 1: // Water balls aimed
                const dx = player.x - boss.x;
                const dy = player.y - boss.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                projectiles.push({
                    x: boss.x,
                    y: boss.y + boss.height/2,
                    vx: (dx/dist) * 10,
                    vy: (dy/dist) * 10,
                    type: 'waterball',
                    size: 25
                });
                break;
            case 2: // Rapid fireballs
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        projectiles.push({
                            x: boss.x,
                            y: boss.y + boss.height/2,
                            vx: -10,
                            vy: (Math.random() - 0.5) * 4,
                            type: 'fireball',
                            size: 18
                        });
                    }, i * 200);
                }
                break;
            case 3: // Water stream
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        projectiles.push({
                            x: boss.x,
                            y: boss.y + boss.height/2 - 40 + i * 20,
                            vx: -9,
                            vy: 0,
                            type: 'waterball',
                            size: 15
                        });
                    }, i * 100);
                }
                break;
        }
    }
    
    // Update projectiles
    projectiles.forEach((proj, index) => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Remove off-screen projectiles
        if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
            projectiles.splice(index, 1);
            return;
        }
        
        // Check player collision
        const projRect = {x: proj.x - proj.size/2, y: proj.y - proj.size/2, width: proj.size, height: proj.size};
        if (checkCollision(player, projRect) && player.invincible <= 0) {
            player.health -= proj.type === 'fireball' ? 25 : 20;
            player.invincible = 45;
            createParticles(player.x + player.width/2, player.y + player.height/2, 
                          proj.type === 'fireball' ? '#ff4500' : '#4169e1', 8);
            projectiles.splice(index, 1);
        }
    });
    
    updateUI();
}

// Update particles
function updateParticles() {
    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.size *= 0.95;
        if (p.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Draw functions
function drawCastleBackground() {
    // Grass floor
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stone pattern
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 64) {
        for (let j = 0; j < canvas.height; j += 64) {
            ctx.strokeRect(i, j, 64, 64);
        }
    }
    
    // Castle walls on sides
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(0, 0, 50, canvas.height);
    ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
    
    // Torch lights
    ctx.fillStyle = 'rgba(255, 100, 50, 0.3)';
    for (let i = 100; i < canvas.width - 100; i += 200) {
        ctx.beginPath();
        ctx.arc(i, 50, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(i, canvas.height - 50, 40, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWalls() {
    const room = rooms[currentRoom];
    ctx.fillStyle = '#4a4a6a';
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 3;
    
    room.walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
        
        // Brick detail
        ctx.strokeStyle = '#5a5a7a';
        ctx.lineWidth = 1;
        for (let i = wall.x; i < wall.x + wall.width; i += 20) {
            for (let j = wall.y; j < wall.y + wall.height; j += 15) {
                ctx.strokeRect(i, j, 20, 15);
            }
        }
    });
}

function drawFires() {
    const room = rooms[currentRoom];
    room.fires.forEach(fire => {
        // Fire glow
        const gradient = ctx.createRadialGradient(
            fire.x, fire.y, 0,
            fire.x, fire.y, fire.size
        );
        gradient.addColorStop(0, 'rgba(255, 100, 50, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, fire.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Fire core
        ctx.fillStyle = `hsl(${Date.now() / 10 % 60 + 10}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, fire.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPlayer() {
    if (player.invincible > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
        return; // Flicker when invincible
    }
    
    // Body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Face
    ctx.fillStyle = '#ffdab9';
    const faceX = player.direction === 'right' ? player.x + 20 : player.x + 4;
    ctx.fillRect(faceX, player.y + 4, 12, 12);
    
    // Eyes
    ctx.fillStyle = '#000';
    const eyeX = player.direction === 'right' ? faceX + 8 : faceX + 2;
    ctx.fillRect(eyeX, player.y + 8, 4, 4);
    
    // Sword
    if (player.isAttacking) {
        ctx.fillStyle = '#c0c0c0';
        const swordX = player.direction === 'right' ? player.x + 32 : player.x - 30;
        ctx.fillRect(swordX, player.y + 12, 30, 8);
        
        // Sword blade
        ctx.fillStyle = '#e0e0e0';
        const bladeX = player.direction === 'right' ? swordX + 10 : swordX;
        ctx.fillRect(bladeX, player.y + 10, 20, 12);
    } else {
        // Sheathed sword
        ctx.fillStyle = '#8b4513';
        const sheathX = player.direction === 'right' ? player.x + 20 : player.x;
        ctx.fillRect(sheathX, player.y + 20, 8, 20);
    }
}

function drawEnemies() {
    activeEnemies.forEach(enemy => {
        // Body
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Angry eyes
        ctx.fillStyle = '#ff0';
        const eyeY = enemy.y + 8;
        const leftEyeX = enemy.x + 6;
        const rightEyeX = enemy.x + 20;
        
        // Angry eyebrows
        ctx.fillStyle = '#000';
        ctx.fillRect(leftEyeX, eyeY - 2, 8, 3);
        ctx.fillRect(rightEyeX, eyeY - 2, 8, 3);
        
        // Eyes
        ctx.fillStyle = '#ff0';
        ctx.fillRect(leftEyeX + 1, eyeY + 2, 6, 6);
        ctx.fillRect(rightEyeX + 1, eyeY + 2, 6, 6);
        
        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
        ctx.fillStyle = '#f00';
        ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 5);
    });
}

function drawBoss() {
    const room = rooms[currentRoom];
    if (!room.boss) return;
    
    const boss = room.boss;
    
    // Boss body (large dark figure)
    ctx.fillStyle = '#2a0a0a';
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    
    // Cape
    ctx.fillStyle = '#4a0a0a';
    ctx.fillRect(boss.x - 10, boss.y + 20, 100, 60);
    
    // Glowing eyes
    const eyeGlow = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
    ctx.fillRect(boss.x + 20, boss.y + 20, 15, 15);
    ctx.fillRect(boss.x + 45, boss.y + 20, 15, 15);
    
    // Crown
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(boss.x + 15, boss.y - 10, 50, 15);
    ctx.fillRect(boss.x + 20, boss.y - 20, 10, 15);
    ctx.fillRect(boss.x + 35, boss.y - 20, 10, 15);
    ctx.fillRect(boss.x + 50, boss.y - 20, 10, 15);
    
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(boss.x, boss.y - 35, boss.width, 10);
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(boss.x, boss.y - 35, boss.width * (boss.health / boss.maxHealth), 10);
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        if (proj.type === 'fireball') {
            // Fireball
            const gradient = ctx.createRadialGradient(
                proj.x, proj.y, 0,
                proj.x, proj.y, proj.size
            );
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(0.5, '#ff4500');
            gradient.addColorStop(1, '#ff0000');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Trail
            ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(proj.x - proj.vx, proj.y - proj.vy, proj.size/3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Waterball
            const gradient = ctx.createRadialGradient(
                proj.x, proj.y, 0,
                proj.x, proj.y, proj.size
            );
            gradient.addColorStop(0, '#00ffff');
            gradient.addColorStop(0.5, '#0080ff');
            gradient.addColorStop(1, '#0000ff');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.size/2, 0, Math.PI * 2);
            ctx.fill();
            
            // Shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(proj.x - 3, proj.y - 3, proj.size/6, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function drawExit() {
    const room = rooms[currentRoom];
    if (currentRoom < totalRooms - 1) {
        // Doorway
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(room.exitX, room.exitY - 50, 60, 100);
        
        // Door frame
        ctx.strokeStyle = '#6a5a4a';
        ctx.lineWidth = 5;
        ctx.strokeRect(room.exitX, room.exitY - 50, 60, 100);
        
        // Light from next room
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
        ctx.fillRect(room.exitX + 10, room.exitY - 40, 40, 80);
    }
}

function updateUI() {
    const healthFill = document.getElementById('healthFill');
    healthFill.style.width = `${Math.max(0, (player.health / player.maxHealth) * 100)}%`;
    
    const roomNum = document.getElementById('roomNum');
    roomNum.textContent = currentRoom + 1;
    
    const bossHealthBar = document.getElementById('bossHealthBar');
    const boss = rooms[currentRoom].boss;
    if (boss) {
        bossHealthBar.style.display = 'block';
        const bossHealthFill = document.getElementById('bossHealthFill');
        bossHealthFill.style.width = `${(boss.health / boss.maxHealth) * 100}%`;
    } else {
        bossHealthBar.style.display = 'none';
    }
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('gameOverText').textContent = 'GAME OVER';
    document.getElementById('gameOverText').style.color = '#ff4444';
    document.getElementById('gameOver').style.display = 'block';
}

function victory() {
    gameState = 'victory';
    document.getElementById('gameOverText').textContent = 'VICTORY!';
    document.getElementById('gameOverText').style.color = '#ffd700';
    document.getElementById('gameOver').style.display = 'block';
}

function restartGame() {
    gameState = 'playing';
    currentRoom = 0;
    player.health = player.maxHealth;
    player.x = 100;
    player.y = 384;
    document.getElementById('gameOver').style.display = 'none';
    initRoom(0);
}

document.getElementById('restartBtn').addEventListener('click', restartGame);

// Start screen elements
const startScreen = document.getElementById('startScreen');
const creditsScreen = document.getElementById('creditsScreen');
const playBtn = document.getElementById('playBtn');
const creditsBtn = document.getElementById('creditsBtn');
const leaveBtn = document.getElementById('leaveBtn');
const backBtn = document.getElementById('backBtn');

// Play button - start the game
playBtn.addEventListener('click', () => {
    initAudio();
    gameState = 'playing';
    startScreen.style.display = 'none';
    creditsScreen.style.display = 'none';
    canvas.style.display = 'block';
    resetGame();
    if (bgmPlaying) stopBGM();
    playBGM('normal');
});

// Credits button - show credits with Dorian and Saskia
creditsBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    creditsScreen.style.display = 'flex';
});

// Back to menu button
backBtn.addEventListener('click', () => {
    creditsScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

// Leave game button - try to close window or show message
leaveBtn.addEventListener('click', () => {
    // Try to close the window
    window.close();
    
    // If window.close() doesn't work (modern browsers block it), show alternative
    setTimeout(() => {
        alert('Thank you for playing Castle Quest!\n\nYou can now close this tab manually.\n\nGame created by Dorian Voegeli & Saskia');
    }, 100);
});

// Main game loop
function gameLoop() {
    if (gameState === 'playing') {
        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update
        updatePlayer();
        updateEnemies();
        updateBoss();
        updateParticles();
        
        // Draw
        drawCastleBackground();
        drawWalls();
        drawFires();
        drawExit();
        drawEnemies();
        drawBoss();
        drawPlayer();
        drawProjectiles();
        drawParticles();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start game loop (game will start when Play button is clicked)
initRoom(0);
gameLoop();
