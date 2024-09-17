const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameButton = document.getElementById('game-button');

let player;
let circles = [];
let bullets = [];
let pulses = [];
let gameRunning = false;
let gameOver = false;
let lastShotTime = 0;
let lastSpecialShotTime = 0;
let score = 0;
let mouseX = 0;
let mouseY = 0;
const shootCooldown = 0o500; // 0.5 seconds in milliseconds
const specialShootCooldown = 60000; // 60 seconds in milliseconds

class Player {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = 5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }

    move(dx, dy) {
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x + dx * this.speed));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y + dy * this.speed));
    }
}

class Circle {
    constructor(x, y, radius, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    }

    move() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
    }
}

class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 10;
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
    }

    isOutOfBounds() {
        return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
    }
}

class Pulse {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 200;
        this.growthRate = 5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    }

    grow() {
        this.radius += this.growthRate;
    }

    isFinished() {
        return this.radius >= this.maxRadius;
    }
}

function init() {
    canvas.style.display = 'block';
    gameButton.style.display = 'none';
    gameOver = false;
    gameRunning = true;
    player = new Player(canvas.width / 2, canvas.height / 2, 20);
    circles = [];
    bullets = [];
    pulses = [];
    score = 0;
    lastShotTime = 0;
    lastSpecialShotTime = 0;
    for (let i = 0; i < 5; i++) {
        spawnCircle();
    }
    gameLoop();
}

function spawnCircle() {
    const radius = 10;
    let x, y;
    do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
    } while (Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2) < 100);
    circles.push(new Circle(x, y, radius, 2));
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();

    circles.forEach((circle, index) => {
        circle.move();
        circle.draw();
        const dx = player.x - circle.x;
        const dy = player.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius + circle.radius) {
            gameOver = true;
            gameRunning = false;
            showGameOver();
        }
    });

    bullets = bullets.filter(bullet => {
        bullet.move();
        bullet.draw();
        let hitEnemy = false;
        circles = circles.filter(circle => {
            const dx = bullet.x - circle.x;
            const dy = bullet.y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < bullet.radius + circle.radius) {
                hitEnemy = true;
                score += 10;
                return false;
            }
            return true;
        });
        return !hitEnemy && !bullet.isOutOfBounds();
    });

    pulses = pulses.filter(pulse => {
        pulse.grow();
        pulse.draw();
        circles = circles.filter(circle => {
            const dx = pulse.x - circle.x;
            const dy = pulse.y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= pulse.radius) {
                score += 10;
                return false;
            }
            return true;
        });
        return !pulse.isFinished();
    });

    if (Math.random() < 0.02) {
        spawnCircle();
    }

    drawCooldownIndicator(10, 10, shootCooldown, lastShotTime, 'yellow');
    drawCooldownIndicator(10, 50, specialShootCooldown, lastSpecialShotTime, 'purple');

    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 100);
}

function drawCooldownIndicator(x, y, cooldown, lastTime, color) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - lastTime;
    const remainingTime = Math.max(0, cooldown - elapsedTime);
    const progress = 1 - (remainingTime / cooldown);

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'gray';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * progress));
    ctx.lineTo(x, y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 100);
    ctx.font = '36px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 50);
}

function shoot(x, y) {
    const currentTime = Date.now();
    if (currentTime - lastShotTime >= shootCooldown) {
        bullets.push(new Bullet(player.x, player.y, x, y));
        lastShotTime = currentTime;
    }
}

function specialShoot() {
    const currentTime = Date.now();
    if (currentTime - lastSpecialShotTime >= specialShootCooldown) {
        pulses.push(new Pulse(player.x, player.y));
        lastSpecialShotTime = currentTime;
    }
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    if (gameOver) {
        init();
    } else if (gameRunning) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        shoot(x, y);
    }
});

let keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === 'f' || e.key === 'F') {
        specialShoot();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

gameButton.addEventListener('click', init);

function gameLoop() {
    if (gameRunning) {
        let dx = 0;
        let dy = 0;
        if (keys['w']) dy -= 1;
        if (keys['s']) dy += 1;
        if (keys['a']) dx -= 1;
        if (keys['d']) dx += 1;
        player.move(dx, dy);
        update();
        requestAnimationFrame(gameLoop);
    }
}
