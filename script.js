const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let hp = 100;
let enemyTimer = 0;


//Параметры игрока
let player = {
    x: 400,
    y: 500,
    size: 20,
    color: "#00f3ff"
};


let bullets = [];
let enemies = [];
let particles = [];


let stars = [];

let boss = null;
let enemyBullets = [];

function spawnBoss() {
    // Босс появляется при достижении 1000 очков
    if (score >= 1000 && !boss) {
        boss = {
            x: canvas.width / 2,
            y: 80,
            size: 35,
            hp: 20,
            maxHp: 20,
            speedX: 3,
            color: "#aa00ff",
            shootTimer: 0
        };
    }
}

function handleBoss() {
    if (!boss) return;

    // Движение босса влево-вправо
    boss.x += boss.speedX;
    if (boss.x < 50 || boss.x > canvas.width - 50) boss.speedX *= -1;

    // Рисуем Босса
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.shadowBlur = 20;
    ctx.shadowColor = boss.color;
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(0, 0, boss.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Шкала здоровья босса
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(boss.x - 30, boss.y - 50, 60, 6);
    ctx.fillStyle = "#00ff66";
    ctx.fillRect(boss.x - 30, boss.y - 50, (60 * boss.hp) / boss.maxHp, 6);

    // Босс стреляет двумя пулями в ответ
    boss.shootTimer++;
    if (boss.shootTimer > 50) {
        playSound(200, "sawtooth", 0.15);
        enemyBullets.push({ x: boss.x - 12, y: boss.y + 20, speed: 5 });
        enemyBullets.push({ x: boss.x + 12, y: boss.y + 20, speed: 5 });
        boss.shootTimer = 0;
    }

    // Урон по боссу от наших пуль
    for (let j = bullets.length - 1; j >= 0; j--) {
        let b = bullets[j];
        let dist = Math.hypot(boss.x - b.x, boss.y - b.y);
        if (dist < boss.size + b.size) {
            playSound(180, "square", 0.08);
            boss.hp--;
            createParticles(b.x, b.y, "#ff00ea");
            bullets.splice(j, 1);

            if (boss.hp <= 0) {
                playSound(80, "sawtooth", 0.5);
                createParticles(boss.x, boss.y, "#9d2fd4");
                score += 1000;
                updateUI();
                boss = null;
                break;
            }
        }
    }
}

function handleEnemyBullets() {
    ctx.fillStyle = "#ff0055";
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let eb = enemyBullets[i];
        eb.y += eb.speed;

        ctx.beginPath();
        ctx.arc(eb.x, eb.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Попадание пули босса в игрока
        let dist = Math.hypot(eb.x - player.x, eb.y - player.y);
        if (dist < player.size) {
            hp -= 15;
            playSound(100, "sine", 0.2);
            createParticles(player.x, player.y, "#ff0055");
            enemyBullets.splice(i, 1);
            updateUI();
            if (hp <= 0) {
                showGameOver();
            }
        } else if (eb.y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 1
    })
}

// --- ЗВУКОВОЙ ДВИЖОК ---
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(freq, type, duration) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function drawStars() {
    ctx.fillStyle = "#FFF"
    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) star.y = 0;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}
function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("hp").innerText = hp;
}

//Движение мышки
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    player.x = event.clientX - rect.left;
    player.y = event.clientY - rect.top;
});

//Выстрел - клик
canvas.addEventListener("mousedown", () => {
    initAudio();
    playSound(400, "sawtooth", 0.1);
    //Пуля слева
    bullets.push({
       x: player.x -10,
       y: player.y - 10,
       speed: 7,
       size: 4
    });
       //Пуля справа
    bullets.push({
       x: player.x + 10,
       y: player.y - 10,
       speed: 7,
       size: 4

    });
});

function drawPlayer () {
    //Рисуем тело призрака(ромб)
    ctx.save();
    ctx.translate(player.x, player.y);
    //Эффект свечения
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.size);
    ctx.lineTo(player.size, 0);
    ctx.lineTo(0, player.size);
    ctx.lineTo(-player.size, 0);
    ctx.closePath();
    ctx.fill();
    //Добавим "зрачок" внутри
    ctx.fillStyle ="#fff";
    ctx.fillRect(-2,-2, 4, 4);
    ctx.restore();
}

//Появление врагов
function spawnEnemies() {
    enemyTimer++;
    if (enemyTimer > 60) {
        enemies.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            size: 20,
            speed: 2,
            color: "#ff0055"
        });
        enemyTimer = 0;
    }
}

//Управление врагами и столкновениями
function handleEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += e.speed;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
        ctx.restore();

        let distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
        if (distToPlayer < e.size + player.size) {
            hp -= 10;
            createParticles(player.x, player.y, "#fff");
            enemies.splice(i, 1);
            updateUI();
            if (hp <= 0) {
                showGameOver();
            }
            continue;
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            let distToBullet = Math.hypot(e.x - b.x, e.y - b.y);

            if (distToBullet < e.size / 2 + b.size) {
                createParticles(e.x, e.y, e.color);
                score += 100;
                updateUI();
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                break;
            }
        }

        if (e.y > canvas.height + 30) {
            enemies.splice(i, 1);
        }
    }
}

//Управление пулями
function handleBullets() {
    ctx.fillStyle = "#ff007f";
    
    // Перебираем пули с конца, чтобы безопасно удалять их из массива
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.y -= b.speed; // двигаем пулю вверх
        
        // Рисуем пулю
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();

        // Если пуля улетела за экран — удаляем
        if (b.y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6, // Скорость по X (в разные стороны)
            vy: (Math.random() - 0.5) * 6, // Скорость по Y
            alpha: 1,                      // Прозрачность (будет исчезать)
            color: color
        });
    }
}

function handleParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 0.02; 
        
        // Частица постепенно тает

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1.0;

        if (p.alpha <= 0) particles.splice(i, 1);
    }
}
function showGameOver() {
    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOverModal").classList.remove("hidden");
}

function gameLoop() {
    //Очищаем игровое поле
    ctx.fillStyle = "rgba(4, 4, 10, 0.4)";
    ctx.fillRect(0,0, canvas.width, canvas.height);


    //Звезды
    drawStars();
    //Враги
    spawnEnemies();
    handleEnemies();
    //Пули
    handleBullets();
    //Частицы
    handleParticles();
    //Наш игрок
    drawPlayer();
    //Босс
    spawnBoss();
    handleBoss();
    handleEnemyBullets();

    //Запуск цикла снова
    requestAnimationFrame(gameLoop);
}

updateUI();
gameLoop();