import { GameProject } from '@/types/playground';

export const STARTER_GAMES: GameProject[] = [
  {
    id: 'cosmic-defender',
    title: 'Cosmic Defender',
    prompt: 'A sleek retro arcade space shooter with laser sounds, particle explosions, score, and increasing waves.',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Cosmic Defender</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }
    body {
      background: #070913;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
    }
    #gameContainer {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 30%, #151833 0%, #080a14 100%);
    }
    #ui {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 18px;
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.8);
      pointer-events: none;
    }
    #overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(7, 9, 19, 0.85);
      backdrop-filter: blur(4px);
    }
    #overlay h1 {
      font-size: 36px;
      letter-spacing: 2px;
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    #overlay p {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 24px;
    }
    button.btn {
      padding: 12px 32px;
      background: linear-gradient(135deg, #6366f1, #3b82f6);
      border: none;
      border-radius: 9999px;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
      transition: transform 0.1s, box-shadow 0.1s;
    }
    button.btn:active { transform: scale(0.96); }
  </style>
</head>
<body>
  <div id="gameContainer">
    <canvas id="canvas"></canvas>
    <div id="ui">
      <div>SCORE: <span id="scoreVal">0</span></div>
      <div>LIVES: <span id="livesVal">3</span></div>
    </div>
    <div id="overlay">
      <h1 id="titleText">COSMIC DEFENDER</h1>
      <p id="subText">Drag/Mouse or Arrow keys to move • Click/Space to Fire</p>
      <button class="btn" id="startBtn">START MISSION</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const scoreVal = document.getElementById('scoreVal');
    const livesVal = document.getElementById('livesVal');
    const overlay = document.getElementById('overlay');
    const titleText = document.getElementById('titleText');
    const subText = document.getElementById('subText');
    const startBtn = document.getElementById('startBtn');

    let W = canvas.width = window.innerWidth || 480;
    let H = canvas.height = window.innerHeight || 640;

    let state = 'menu'; // menu, playing, gameover
    let score = 0;
    let lives = 3;
    let particles = [];
    let bullets = [];
    let enemies = [];
    let stars = [];
    let lastEnemySpawn = 0;

    const player = {
      x: W / 2,
      y: H - 70,
      size: 26,
      speed: 7,
      vx: 0,
      movingLeft: false,
      movingRight: false
    };

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      if (player) {
        player.x = Math.max(player.size, Math.min(W - player.size, player.x));
        player.y = H - 70;
      }
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 0.5 + Math.random() * 2,
        size: Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.7
      });
    }

    function shoot() {
      if (state !== 'playing') return;
      bullets.push({ x: player.x - 8, y: player.y - 12, vx: 0, vy: -12, w: 3, h: 12 });
      bullets.push({ x: player.x + 8, y: player.y - 12, vx: 0, vy: -12, w: 3, h: 12 });
      if (window.PlaygroundAudio) {
        window.PlaygroundAudio.play('laser');
      }
    }

    function createExplosion(x, y, color = '#f59e0b', count = 18) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 3,
          color,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.03
        });
      }
    }

    function startGame() {
      score = 0;
      lives = 3;
      bullets = [];
      enemies = [];
      particles = [];
      scoreVal.textContent = score;
      livesVal.textContent = lives;
      player.x = W / 2;
      player.y = H - 70;
      state = 'playing';
      overlay.style.display = 'none';
      if (window.PlaygroundAudio) window.PlaygroundAudio.play('powerup');
    }

    function gameOver() {
      state = 'gameover';
      overlay.style.display = 'flex';
      titleText.textContent = 'MISSION FAILED';
      subText.textContent = 'Final Score: ' + score;
      startBtn.textContent = 'TRY AGAIN';
      if (window.PlaygroundAudio) window.PlaygroundAudio.play('gameover');
    }

    startBtn.addEventListener('click', startGame);

    // Controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') player.movingLeft = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') player.movingRight = true;
      if (e.code === 'Space') shoot();
      if (e.code === 'KeyR' && state !== 'playing') startGame();
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') player.movingLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') player.movingRight = false;
    });

    let pointerDown = false;
    function handlePointer(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      player.x = Math.max(player.size, Math.min(W - player.size, clientX - rect.left));
    }
    canvas.addEventListener('mousemove', (e) => { if (state === 'playing') handlePointer(e); });
    canvas.addEventListener('mousedown', (e) => {
      pointerDown = true;
      if (state === 'playing') shoot();
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (state === 'playing') handlePointer(e);
    }, { passive: false });
    canvas.addEventListener('touchstart', (e) => {
      if (state === 'playing') {
        handlePointer(e);
        shoot();
      }
    });

    function spawnEnemy() {
      const size = 20 + Math.random() * 12;
      enemies.push({
        x: size + Math.random() * (W - size * 2),
        y: -size,
        size,
        speed: 1.5 + Math.random() * 2 + (score / 1000),
        hp: 1,
        hue: (Date.now() / 20) % 360
      });
    }

    let lastTime = performance.now();
    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update stars
      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      });

      if (state === 'playing') {
        // Player movement via keyboard
        if (player.movingLeft) player.x = Math.max(player.size, player.x - player.speed);
        if (player.movingRight) player.x = Math.min(W - player.size, player.x + player.speed);

        // Spawn enemies
        if (now - lastEnemySpawn > Math.max(500, 1400 - score * 0.8)) {
          spawnEnemy();
          lastEnemySpawn = now;
        }

        // Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y += b.vy;
          if (b.y < -20) bullets.splice(i, 1);
        }

        // Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const en = enemies[i];
          en.y += en.speed;

          // Collision with bullets
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const dist = Math.hypot(b.x - en.x, b.y - en.y);
            if (dist < en.size + 6) {
              bullets.splice(j, 1);
              en.hp--;
              if (en.hp <= 0) {
                createExplosion(en.x, en.y, '#38bdf8', 20);
                enemies.splice(i, 1);
                score += 100;
                scoreVal.textContent = score;
                if (window.PlaygroundAudio) window.PlaygroundAudio.play('hit');
                break;
              }
            }
          }

          // Collision with player
          const distToPlayer = Math.hypot(player.x - en.x, player.y - en.y);
          if (distToPlayer < player.size + en.size) {
            createExplosion(player.x, player.y, '#ef4444', 30);
            enemies.splice(i, 1);
            lives--;
            livesVal.textContent = lives;
            if (window.PlaygroundAudio) window.PlaygroundAudio.play('explosion');
            if (lives <= 0) {
              gameOver();
              break;
            }
          } else if (en.y > H + en.size) {
            enemies.splice(i, 1);
          }
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      // DRAW
      ctx.clearRect(0, 0, W, H);

      // Draw stars
      stars.forEach(s => {
        ctx.fillStyle = 'rgba(255, 255, 255,' + s.alpha + ')';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Draw bullets
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      bullets.forEach(b => {
        ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h);
      });
      ctx.shadowBlur = 0;

      // Draw enemies
      enemies.forEach(en => {
        ctx.save();
        ctx.translate(en.x, en.y);
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, en.size);
        ctx.lineTo(-en.size, -en.size * 0.7);
        ctx.lineTo(0, -en.size * 0.3);
        ctx.lineTo(en.size, -en.size * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      ctx.shadowBlur = 0;

      // Draw player
      if (lives > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.fillStyle = '#6366f1';
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, -player.size);
        ctx.lineTo(-player.size * 0.8, player.size * 0.8);
        ctx.lineTo(0, player.size * 0.4);
        ctx.lineTo(player.size * 0.8, player.size * 0.8);
        ctx.closePath();
        ctx.fill();

        // Thruster flame
        ctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-6, player.size * 0.6);
        ctx.lineTo(0, player.size + Math.random() * 12);
        ctx.lineTo(6, player.size * 0.6);
        ctx.fill();
        ctx.restore();
      }

      // Draw particles
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`
  },
  {
    id: 'cyber-pong',
    title: 'Neon Cyber Pong',
    prompt: 'A futuristic cyber pong game with glowing neon trails, smart AI opponent, sound synthesis, and score multiplier.',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Neon Cyber Pong</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #09090b;
      color: #fafafa;
      font-family: system-ui, sans-serif;
      overflow: hidden;
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      display: flex;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
      background: #09090b;
    }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');

    let W = canvas.width = window.innerWidth || 700;
    let H = canvas.height = window.innerHeight || 460;

    const paddleW = 12;
    const paddleH = 80;
    let p1Y = H / 2 - paddleH / 2;
    let p2Y = H / 2 - paddleH / 2;
    let p1Score = 0;
    let p2Score = 0;

    const ball = {
      x: W / 2,
      y: H / 2,
      vx: 5,
      vy: 3,
      r: 8,
      speed: 6,
      trail: []
    };

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      p1Y = Math.min(H - paddleH, Math.max(0, p1Y));
      p2Y = Math.min(H - paddleH, Math.max(0, p2Y));
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      p1Y = Math.max(0, Math.min(H - paddleH, (e.clientY - rect.top) - paddleH / 2));
    });

    window.addEventListener('touchmove', (e) => {
      const rect = canvas.getBoundingClientRect();
      p1Y = Math.max(0, Math.min(H - paddleH, (e.touches[0].clientY - rect.top) - paddleH / 2));
    }, { passive: true });

    function resetBall() {
      ball.x = W / 2;
      ball.y = H / 2;
      ball.speed = 6;
      ball.vx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
      ball.vy = (Math.random() * 2 - 1) * 4;
      ball.trail = [];
    }

    function loop() {
      // AI opponent logic
      const targetY = ball.y - paddleH / 2;
      p2Y += (targetY - p2Y) * 0.09;
      p2Y = Math.max(0, Math.min(H - paddleH, p2Y));

      // Ball update
      ball.x += ball.vx;
      ball.y += ball.vy;

      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 10) ball.trail.shift();

      // Wall bounce
      if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy *= -1;
        if (window.PlaygroundAudio) window.PlaygroundAudio.play('hit');
      }
      if (ball.y + ball.r > H) {
        ball.y = H - ball.r;
        ball.vy *= -1;
        if (window.PlaygroundAudio) window.PlaygroundAudio.play('hit');
      }

      // Player 1 collision
      if (ball.x - ball.r < 30 + paddleW && ball.x + ball.r > 30) {
        if (ball.y > p1Y && ball.y < p1Y + paddleH) {
          ball.vx = Math.abs(ball.vx) * 1.05;
          const hitOffset = (ball.y - (p1Y + paddleH / 2)) / (paddleH / 2);
          ball.vy = hitOffset * 6;
          if (window.PlaygroundAudio) window.PlaygroundAudio.play('laser');
        }
      }

      // Player 2 collision
      if (ball.x + ball.r > W - 30 - paddleW && ball.x - ball.r < W - 30) {
        if (ball.y > p2Y && ball.y < p2Y + paddleH) {
          ball.vx = -Math.abs(ball.vx) * 1.05;
          const hitOffset = (ball.y - (p2Y + paddleH / 2)) / (paddleH / 2);
          ball.vy = hitOffset * 6;
          if (window.PlaygroundAudio) window.PlaygroundAudio.play('laser');
        }
      }

      // Score
      if (ball.x < 0) {
        p2Score++;
        if (window.PlaygroundAudio) window.PlaygroundAudio.play('gameover');
        resetBall();
      } else if (ball.x > W) {
        p1Score++;
        if (window.PlaygroundAudio) window.PlaygroundAudio.play('coin');
        resetBall();
      }

      // Draw
      ctx.fillStyle = 'rgba(9, 9, 11, 0.3)';
      ctx.fillRect(0, 0, W, H);

      // Center divider
      ctx.strokeStyle = '#27272a';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Scores
      ctx.font = '700 48px monospace';
      ctx.fillStyle = '#3f3f46';
      ctx.textAlign = 'center';
      ctx.fillText(p1Score, W / 4, 70);
      ctx.fillText(p2Score, 3 * W / 4, 70);

      // Paddles
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillRect(30, p1Y, paddleW, paddleH);

      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.fillRect(W - 30 - paddleW, p2Y, paddleW, paddleH);

      // Ball trail
      ball.trail.forEach((t, i) => {
        ctx.fillStyle = 'rgba(255, 255, 255,' + (i / 15) + ')';
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * (i / 10), 0, Math.PI * 2);
        ctx.fill();
      });

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      requestAnimationFrame(loop);
    }
    resetBall();
    requestAnimationFrame(loop);
  </script>
</body>
</html>`
  }
];
