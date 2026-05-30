    const CELL          = 20;      // grid cell size (px)
    const TICK_MS       = 130;     // snake speed (ms per step)
    const GESTURE_THR   = 0.055;   // min pinch delta to register direction (larger = needs bigger swipe)

    let cols, rows;
    let snake, dir, nextDir, food;
    let score = 0, hiScore = 0;
    let running = false;
    let gameInterval = null;

    // Gesture tracking
    let fingerX = 0.5, fingerY = 0.5;
    let prevFX  = 0.5, prevFY  = 0.5;

    const DIRS = {
      UP:    { x: 0,  y: -1 },
      DOWN:  { x: 0,  y:  1 },
      LEFT:  { x: -1, y:  0 },
      RIGHT: { x: 1,  y:  0 },
    };

    const startScreen  = document.getElementById('start-screen');
    const gameWrap     = document.getElementById('game-wrap');
    const gameCanvas   = document.getElementById('game-canvas');
    const gCtx         = gameCanvas.getContext('2d');
    const lmCanvas     = document.getElementById('landmark-canvas');
    const lmCtx        = lmCanvas.getContext('2d');
    const video        = document.getElementById('video');
    const overlay      = document.getElementById('overlay');
    const scoreVal     = document.getElementById('score-val');
    const bestVal      = document.getElementById('best-val');
    const finalScore   = document.getElementById('final-score');
    const dirIndicator = document.getElementById('dir-indicator');
    const gestureHint  = document.getElementById('gesture-hint');
    const handDot      = document.getElementById('hand-dot');
    const permMsg      = document.getElementById('perm-msg');
    const nameInput    = document.getElementById('name-input');
    const saveBtn      = document.getElementById('save-btn');
    const saveStatus   = document.getElementById('save-status');
    const lbLoading    = document.getElementById('lb-loading');
    const lbList       = document.getElementById('lb-list');
    function initCanvas() {
      gameCanvas.width  = window.innerWidth;
      gameCanvas.height = window.innerHeight;
      cols = Math.floor(gameCanvas.width  / CELL);
      rows = Math.floor(gameCanvas.height / CELL);
    }

    function resetGame() {
      const cx = Math.floor(cols / 2);
      const cy = Math.floor(rows / 2);
      snake   = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
      dir     = DIRS.RIGHT;
      nextDir = DIRS.RIGHT;
      score   = 0;
      placeFood();
      updateHUD();
    }

    function placeFood() {
      let pos;
      do {
        pos = {
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
        };
      } while (snake.some(s => s.x === pos.x && s.y === pos.y));
      food = pos;
    }


    function tick() {
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        endGame(); return;
      }
      // Self collision
      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        endGame(); return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score++;
        if (score > hiScore) hiScore = score;
        updateHUD();
        placeFood();
        flashScore();
      } else {
        snake.pop();
      }

      draw();
    }

    function draw() {
      const W = gameCanvas.width;
      const H = gameCanvas.height;

      // Background
      gCtx.fillStyle = '#070810';
      gCtx.fillRect(0, 0, W, H);

      // Subtle grid dots
      gCtx.fillStyle = '#12152a';
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          gCtx.beginPath();
          gCtx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 0.8, 0, Math.PI * 2);
          gCtx.fill();
        }
      }

      // Food — pulsing glow
      drawFood();

      // Snake
      drawSnake();
    }

    function drawFood() {
      const fx = food.x * CELL + CELL / 2;
      const fy = food.y * CELL + CELL / 2;
      const t  = Date.now() / 400;
      const pulse = 0.55 + 0.45 * Math.sin(t);

      // Outer glow
      const g = gCtx.createRadialGradient(fx, fy, 0, fx, fy, CELL * 2 * pulse);
      g.addColorStop(0, 'rgba(255,77,109,0.35)');
      g.addColorStop(1, 'transparent');
      gCtx.fillStyle = g;
      gCtx.beginPath();
      gCtx.arc(fx, fy, CELL * 2 * pulse, 0, Math.PI * 2);
      gCtx.fill();

      // Core
      gCtx.fillStyle = '#ff4d6d';
      gCtx.beginPath();
      gCtx.arc(fx, fy, CELL * 0.42, 0, Math.PI * 2);
      gCtx.fill();

      // Shine
      gCtx.fillStyle = 'rgba(255,200,210,0.7)';
      gCtx.beginPath();
      gCtx.arc(fx - 2.5, fy - 2.5, CELL * 0.12, 0, Math.PI * 2);
      gCtx.fill();
    }

    function drawSnake() {
      const len = snake.length;
      snake.forEach((seg, i) => {
        const t   = i / len;
        const g   = Math.floor(255 * (1 - t * 0.72));
        const b   = Math.floor(g * 0.55);
        const col = i === 0 ? '#00ff9d' : `rgb(0,${g},${b})`;

        gCtx.fillStyle = col;
        const pad = i === 0 ? 1 : 2;
        const r   = i === 0 ? 6 : 4;
        roundRect(gCtx, seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, r);
        gCtx.fill();

        // Head eyes
        if (i === 0) {
          gCtx.fillStyle = '#070810';
          const ex = dir.x;
          const ey = dir.y;
          const cx = seg.x * CELL + CELL / 2;
          const cy = seg.y * CELL + CELL / 2;
          // Two eyes offset perpendicular to direction
          const px = ey, py = -ex; // perpendicular
          gCtx.beginPath();
          gCtx.arc(cx + ex * 4 + px * 4, cy + ey * 4 + py * 4, 2, 0, Math.PI * 2);
          gCtx.fill();
          gCtx.beginPath();
          gCtx.arc(cx + ex * 4 - px * 4, cy + ey * 4 - py * 4, 2, 0, Math.PI * 2);
          gCtx.fill();
        }
      });
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }


    function startRunning() {
      running = true;
      if (gameInterval) clearInterval(gameInterval);
      gameInterval = setInterval(tick, TICK_MS);
    }

    function endGame() {
        running = false;
        clearInterval(gameInterval);
        finalScore.textContent = score;
        // reset form state
        nameInput.value        = '';
        saveBtn.disabled       = false;
        saveStatus.textContent = '';
        saveStatus.className   = '';
        overlay.classList.add('show');
        loadLeaderboard();
    }
    function updateHUD() {
      scoreVal.textContent = score;
      bestVal.textContent  = 'BEST: ' + hiScore;
    }

    function flashScore() {
      scoreVal.style.color = '#ffffff';
      setTimeout(() => { scoreVal.style.color = ''; }, 150);
    }


    function applyGesture() {
      const dx = fingerX - prevFX;
      const dy = fingerY - prevFY;
      const absDx = Math.abs(dx), absDy = Math.abs(dy);

      // Must exceed threshold AND one axis must clearly dominate (ratio >= 1.8)
      if (absDx < GESTURE_THR && absDy < GESTURE_THR) return;
      if (absDx > absDy && absDx / (absDy || 0.001) < 1.8) return;
      if (absDy > absDx && absDy / (absDx || 0.001) < 1.8) return;

      if (absDx > absDy) {
        if (dx > 0 && dir !== DIRS.LEFT)       { nextDir = DIRS.RIGHT; dirIndicator.textContent = '→'; }
        else if (dx < 0 && dir !== DIRS.RIGHT) { nextDir = DIRS.LEFT;  dirIndicator.textContent = '←'; }
      } else {
        if (dy > 0 && dir !== DIRS.UP)         { nextDir = DIRS.DOWN;  dirIndicator.textContent = '↓'; }
        else if (dy < 0 && dir !== DIRS.DOWN)  { nextDir = DIRS.UP;    dirIndicator.textContent = '↑'; }
      }
    }

    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
    ];

    function drawSkeleton(landmarks) {
      lmCtx.clearRect(0, 0, lmCanvas.width, lmCanvas.height);
      const W = lmCanvas.width, H = lmCanvas.height;

      lmCtx.strokeStyle = 'rgba(0,255,157,0.5)';
      lmCtx.lineWidth   = 1.2;
      CONNECTIONS.forEach(([a, b]) => {
        lmCtx.beginPath();
        lmCtx.moveTo((1 - landmarks[a].x) * W, landmarks[a].y * H);
        lmCtx.lineTo((1 - landmarks[b].x) * W, landmarks[b].y * H);
        lmCtx.stroke();
      });

      // Joint dots
      lmCtx.fillStyle = 'rgba(0,255,157,0.4)';
      landmarks.forEach((lm, i) => {
        if (i === 4 || i === 8) return;
        lmCtx.beginPath();
        lmCtx.arc((1 - lm.x) * W, lm.y * H, 2, 0, Math.PI * 2);
        lmCtx.fill();
      });

      // Thumb tip (#4) — yellow dot
      lmCtx.fillStyle = '#ffe066';
      lmCtx.beginPath();
      lmCtx.arc((1 - landmarks[4].x) * W, landmarks[4].y * H, 5, 0, Math.PI * 2);
      lmCtx.fill();

      // Index tip (#8) — yellow dot
      lmCtx.beginPath();
      lmCtx.arc((1 - landmarks[8].x) * W, landmarks[8].y * H, 5, 0, Math.PI * 2);
      lmCtx.fill();

      // Dashed line connecting the two tips
      const t4x = (1 - landmarks[4].x) * W, t4y = landmarks[4].y * H;
      const t8x = (1 - landmarks[8].x) * W, t8y = landmarks[8].y * H;
      lmCtx.setLineDash([3, 3]);
      lmCtx.strokeStyle = 'rgba(255,224,102,0.7)';
      lmCtx.lineWidth = 1;
      lmCtx.beginPath();
      lmCtx.moveTo(t4x, t4y);
      lmCtx.lineTo(t8x, t8y);
      lmCtx.stroke();
      lmCtx.setLineDash([]);

      // Pinch midpoint — bright green crosshair dot
      const mx = (t4x + t8x) / 2;
      const my = (t4y + t8y) / 2;
      lmCtx.fillStyle = '#00ff9d';
      lmCtx.beginPath();
      lmCtx.arc(mx, my, 6, 0, Math.PI * 2);
      lmCtx.fill();
      lmCtx.strokeStyle = 'rgba(0,255,157,0.4)';
      lmCtx.lineWidth = 1;
      lmCtx.beginPath();
      lmCtx.arc(mx, my, 10, 0, Math.PI * 2);
      lmCtx.stroke();
    }

    //  MEDIAPIPE SETUP
    function setupHandTracking() {
      const hands = new Hands({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(results => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const lm = results.multiHandLandmarks[0];
          // Pinch midpoint: average of thumb tip (#4) and index tip (#8)
          // X is flipped (1 - x) to match the mirrored video preview
          prevFX = fingerX; prevFY = fingerY;
          fingerX = ((1 - lm[4].x) + (1 - lm[8].x)) / 2;
          fingerY = (lm[4].y + lm[8].y) / 2;
          handDot.classList.add('active');
          gestureHint.style.opacity = '0';
          if (running) applyGesture();
          drawSkeleton(lm);
        } else {
          handDot.classList.remove('active');
          gestureHint.style.opacity = '1';
          lmCtx.clearRect(0, 0, lmCanvas.width, lmCanvas.height);
        }
      });

      const camera = new Camera(video, {
        onFrame: async () => { await hands.send({ image: video }); },
        width: 320,
        height: 240,
      });
      camera.start();
    }

    //  CAMERA ACCESS
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 },
        });
        video.srcObject = stream;
        setupHandTracking();
      } catch (e) {
        permMsg.style.display = 'block';
      }
    }

    //  KEYBOARD FALLBACK
    window.addEventListener('keydown', e => {
      if (!running) return;
      const map = {
        ArrowUp:    [DIRS.UP,    '↑'],
        ArrowDown:  [DIRS.DOWN,  '↓'],
        ArrowLeft:  [DIRS.LEFT,  '←'],
        ArrowRight: [DIRS.RIGHT, '→'],
        w:          [DIRS.UP,    '↑'],
        s:          [DIRS.DOWN,  '↓'],
        a:          [DIRS.LEFT,  '←'],
        d:          [DIRS.RIGHT, '→'],
      };
      const entry = map[e.key];
      if (!entry) return;
      const [d, arrow] = entry;
      const opp = { UP: DIRS.DOWN, DOWN: DIRS.UP, LEFT: DIRS.RIGHT, RIGHT: DIRS.LEFT };
      const oppDir = Object.entries(DIRS).find(([, v]) => v === dir)?.[0];
      if (d !== opp[oppDir]) { nextDir = d; dirIndicator.textContent = arrow; }
    });


    window.addEventListener('resize', () => {
      initCanvas();
      if (running) draw();
    });

    document.getElementById('play-btn').addEventListener('click', () => {
      startScreen.style.display = 'none';
      gameWrap.style.display    = 'block';
      initCanvas();
      lmCanvas.width  = 180;
      lmCanvas.height = 135;
      resetGame();
      startRunning();
      draw();
      startCamera();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      overlay.classList.remove('show');
      resetGame();
      startRunning();
    });

    document.getElementById('retry-cam-btn').addEventListener('click', () => {
      permMsg.style.display = 'none';
      startCamera();
    });
    async function saveScore() {
  const name = nameInput.value.trim();
  if (!name) {
    saveStatus.textContent = 'please enter your name';
    saveStatus.className = 'err';
    nameInput.focus();
    return;
  }

  if (!window._fbReady) {
    saveStatus.textContent = '✗ firebase not loaded yet, try again';
    saveStatus.className = 'err';
    return;
  }

  saveBtn.disabled = true;
  saveStatus.textContent = 'saving...';
  saveStatus.className = '';

  try {
    await window._addDoc(
      window._collection(window._db, 'scores'),
      { name, score, playedAt: window._serverTimestamp() }
    );
    saveStatus.textContent = '✓ score saved!';
    saveStatus.className = 'ok';
    loadLeaderboard();
  } catch (e) {
    saveStatus.textContent = '✗ could not save — check firebase config';
    saveStatus.className = 'err';
    saveBtn.disabled = false;
  }
}
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
async function loadLeaderboard() {
  lbLoading.style.display = 'block';
  lbLoading.style.color   = '';
  lbList.innerHTML = '';

  if (!window._fbReady) {
    await new Promise(resolve =>
      window.addEventListener('firebase-ready', resolve, { once: true })
    );
  }

  try {
    const q    = window._query(
      window._collection(window._db, 'scores'),
      window._orderBy('score', 'desc'),
      window._limit(10)
    );
    const snap = await window._getDocsFromServer(q);

    lbLoading.style.display = 'none';

    if (snap.empty) {
      lbList.innerHTML = '<li style="justify-content:center;color:var(--muted);font-size:.7rem;letter-spacing:2px">no scores yet</li>';
      return;
    }

let i = 0;
snap.forEach((doc) => {
  const row = doc.data();
  const li  = document.createElement('li');
  li.className = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
  const medals = ['🥇','🥈','🥉'];
  li.innerHTML = `
    <span class="lb-rank">${medals[i] || (i+1)}</span>
    <span class="lb-name">${escHtml(row.name)}</span>
    <span class="lb-score">${row.score}</span>
  `;
  lbList.appendChild(li);
  i++;
});
  } catch(e) {
    lbLoading.textContent = 'could not load scores';
    lbLoading.style.color = 'var(--red)';
    lbLoading.style.display = 'block';
  }
}
saveBtn.addEventListener('click', saveScore);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveScore(); });
    // Animate food on start screen (draw loop keeps food pulsing after game starts)
    (function foodLoop() {
      if (running) { draw(); }
      requestAnimationFrame(foodLoop);
    })();