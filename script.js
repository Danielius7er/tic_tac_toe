    const state = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      gameActive: true,
      mode: 'pvp', // 'pvp' ou 'ai'
      scores: { X: 0, O: 0 },
      winCombo: null
    };

    // Combinações vencedoras
    const WIN_COMBOS = [
      [0,1,2], [3,4,5], [6,7,8], // linhas
      [0,3,6], [1,4,7], [2,5,8], // colunas
      [0,4,8], [2,4,6]           // diagonais
    ];

    /* ================================================
       REFERÊNCIAS DO DOM
       ================================================ */
    const boardEl = document.getElementById('board');
    const winLineSvg = document.getElementById('win-line-svg');
    const turnIndicator = document.getElementById('turn-indicator');
    const turnDot = document.getElementById('turn-dot');
    const turnText = document.getElementById('turn-text');
    const scoreXEl = document.getElementById('score-x');
    const scoreOEl = document.getElementById('score-o');
    const xCard = document.getElementById('x-card');
    const oCard = document.getElementById('o-card');
    const oLabel = document.getElementById('o-label');
    const resultOverlay = document.getElementById('result-overlay');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultSubtitle = document.getElementById('result-subtitle');
    const toastEl = document.getElementById('toast');

    function buildBoard() {
      boardEl.innerHTML = '';
      for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('aria-label', `Célula ${i + 1}, vazia`);
        cell.dataset.index = i;

        // Símbolo fantasma (preview no hover)
        const ghost = document.createElement('span');
        ghost.classList.add('ghost-symbol', 'x');
        ghost.textContent = 'X';
        cell.appendChild(ghost);

        // Símbolo real
        const symbol = document.createElement('span');
        symbol.classList.add('cell-symbol');
        cell.appendChild(symbol);

        cell.addEventListener('click', () => handleCellClick(i));
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCellClick(i);
          }
        });

        boardEl.appendChild(cell);
      }
    }

    /* LÓGICA DO JOGO */
    function handleCellClick(index) {
      if (!state.gameActive || state.board[index] !== null) return;
      if (state.mode === 'ai' && state.currentPlayer === 'O') return;

      makeMove(index);
    }

    function makeMove(index) {
      state.board[index] = state.currentPlayer;

      const cell = boardEl.children[index];
      const symbol = cell.querySelector('.cell-symbol');
      const ghost = cell.querySelector('.ghost-symbol');

      symbol.textContent = state.currentPlayer;
      symbol.classList.add(state.currentPlayer.toLowerCase(), 'placed');
      cell.classList.add('taken');
      cell.setAttribute('aria-label', `Célula ${index + 1}, ${state.currentPlayer}`);
      ghost.style.display = 'none';

      // Verificar vitória
      const winCombo = checkWin(state.currentPlayer);
      if (winCombo) {
        handleWin(state.currentPlayer, winCombo);
        return;
      }

      // Verificar empate
      if (state.board.every(c => c !== null)) {
        handleDraw();
        return;
      }

      // Trocar jogador
      switchPlayer();
    }

    function checkWin(player) {
      for (const combo of WIN_COMBOS) {
        if (combo.every(i => state.board[i] === player)) {
          return combo;
        }
      }
      return null;
    }

    function handleWin(player, combo) {
      state.gameActive = false;
      state.winCombo = combo;
      state.scores[player]++;

      // Atualizar scores
      updateScores();

      // Marcar células vencedoras
      combo.forEach((i, idx) => {
        setTimeout(() => {
          boardEl.children[i].classList.add('winner-cell');
        }, idx * 100);
      });

      // Desenhar linha vencedora
      setTimeout(() => drawWinLine(combo), 200);

      // Desativar outras células
      document.querySelectorAll('.cell').forEach(c => c.classList.add('game-over'));

      // Mostrar resultado com atraso dramático
      setTimeout(() => {
        const isAI = state.mode === 'ai' && player === 'O';
        resultIcon.textContent = '👑';
        resultTitle.textContent = isAI ? 'A Máquina Venceu' : `Jogador ${player} Venceu`;
        resultSubtitle.textContent = isAI ? 'A inteligência artificial prevaleceu' : 'Vitória brilhante e merecida';
        resultOverlay.classList.add('show');
        spawnCelebrationParticles();
      }, 1200);

      // Toast
      showToast(`${player} venceu a rodada!`);
    }

    function handleDraw() {
      state.gameActive = false;

      document.querySelectorAll('.cell').forEach(c => {
        c.classList.add('game-over', 'draw-cell');
      });

      setTimeout(() => {
        resultIcon.textContent = '⚖️';
        resultTitle.textContent = 'Empate';
        resultSubtitle.textContent = 'Nenhum dos lados cedeu';
        resultOverlay.classList.add('show');
      }, 800);

      showToast('Empate! Ninguém venceu.');
    }

    function switchPlayer() {
      state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
      updateTurnIndicator();

      // Se for modo AI e for a vez do O
      if (state.mode === 'ai' && state.currentPlayer === 'O' && state.gameActive) {
        setTimeout(aiMove, 500);
      }
    }

    function updateTurnIndicator() {
      turnDot.className = `turn-dot ${state.currentPlayer.toLowerCase()}-dot`;
      const isAI = state.mode === 'ai' && state.currentPlayer === 'O';
      turnText.textContent = isAI ? 'Máquina pensando...' : `Vez do ${state.currentPlayer}`;

      // Atualizar card ativo
      xCard.classList.toggle('active', state.currentPlayer === 'X');
      oCard.classList.toggle('active', state.currentPlayer === 'O');

      // Atualizar fantasmas
      document.querySelectorAll('.ghost-symbol').forEach(g => {
        if (g.style.display !== 'none') {
          g.textContent = state.currentPlayer;
          g.className = `ghost-symbol ${state.currentPlayer.toLowerCase()}`;
        }
      });
    }

    function updateScores() {
      scoreXEl.textContent = state.scores.X;
      scoreOEl.textContent = state.scores.O;

      // Animação de incremento
      const el = state.currentPlayer === 'X' ? scoreXEl : scoreOEl;
      el.style.transform = 'scale(1.4)';
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
      el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }

    /* IA (Minimax) */
    function aiMove() {
      if (!state.gameActive) return;

      const bestMove = minimax(state.board.slice(), 'O', 0);
      if (bestMove.index !== undefined) {
        makeMove(bestMove.index);
      }
    }

    function minimax(board, player, depth) {
      const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null);

      // Verificar estados terminais
      if (checkWinOnBoard(board, 'X')) return { score: -10 + depth };
      if (checkWinOnBoard(board, 'O')) return { score: 10 - depth };
      if (available.length === 0) return { score: 0 };

      const moves = [];

      for (const idx of available) {
        const move = { index: idx };
        board[idx] = player;

        const result = minimax(board, player === 'O' ? 'X' : 'O', depth + 1);
        move.score = result.score;

        board[idx] = null;
        moves.push(move);
      }

      // Escolher melhor jogada
      let bestMove;
      if (player === 'O') {
        let bestScore = -Infinity;
        for (const m of moves) {
          if (m.score > bestScore) { bestScore = m.score; bestMove = m; }
        }
      } else {
        let bestScore = Infinity;
        for (const m of moves) {
          if (m.score < bestScore) { bestScore = m.score; bestMove = m; }
        }
      }

      return bestMove;
    }

    function checkWinOnBoard(board, player) {
      return WIN_COMBOS.some(combo => combo.every(i => board[i] === player));
    }

    /* ================================================
       LINHA VENCEDORA (SVG)
       ================================================ */
    function drawWinLine(combo) {
      winLineSvg.innerHTML = '';
      const cells = [...boardEl.children];
      const boardRect = boardEl.getBoundingClientRect();

      const startCell = cells[combo[0]].getBoundingClientRect();
      const endCell = cells[combo[2]].getBoundingClientRect();

      const x1 = startCell.left + startCell.width / 2 - boardRect.left;
      const y1 = startCell.top + startCell.height / 2 - boardRect.top;
      const x2 = endCell.left + endCell.width / 2 - boardRect.left;
      const y2 = endCell.top + endCell.height / 2 - boardRect.top;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      winLineSvg.appendChild(line);
    }

    /* ================================================
       REINICIAR JOGO
       ================================================ */
    function restartGame() {
      state.board = Array(9).fill(null);
      state.currentPlayer = 'X';
      state.gameActive = true;
      state.winCombo = null;

      winLineSvg.innerHTML = '';
      resultOverlay.classList.remove('show');

      buildBoard();
      updateTurnIndicator();
    }

    function resetScores() {
      state.scores = { X: 0, O: 0 };
      scoreXEl.textContent = '0';
      scoreOEl.textContent = '0';
      showToast('Placar zerado');
      restartGame();
    }

    /* ================================================
       MODO DE JOGO
       ================================================ */
    function setMode(mode) {
      state.mode = mode;

      document.querySelectorAll('.mode-btn').forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
      });

      oLabel.textContent = mode === 'ai' ? 'Machine' : 'Player';
      restartGame();
    }

    /* ================================================
       TOAST
       ================================================ */
    let toastTimeout;
    function showToast(message) {
      toastEl.textContent = message;
      toastEl.classList.add('show');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2500);
    }

    /* ================================================
       PARTÍCULAS DE FUNDO (Canvas)
       ================================================ */
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.life = Math.random() * 600 + 200;
        this.maxLife = this.life;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;
        if (this.life <= 0 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        const fade = Math.min(1, this.life / (this.maxLife * 0.2));
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity * fade})`;
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animateParticles);
    }

    /* PARTÍCULAS DE CELEBRAÇÃO */
    let celebrationParticles = [];

    class CelebrationParticle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.gravity = 0.08;
        this.opacity = 1;
        this.decay = Math.random() * 0.02 + 0.008;
        this.color = Math.random() > 0.5 ? '#ffd700' : '#d4af37';
        this.rotation = Math.random() * 360;
        this.rotSpeed = (Math.random() - 0.5) * 10;
      }
      update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.99;
        this.opacity -= this.decay;
        this.rotation += this.rotSpeed;
      }
      draw(ctx) {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        // Desenhar losango (diamante)
        ctx.beginPath();
        const s = Math.max(0.1, this.size);
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.6, 0);
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.6, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(s * 0.6, 0);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    function spawnCelebrationParticles() {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      for (let i = 0; i < 60; i++) {
        celebrationParticles.push(new CelebrationParticle(cx, cy));
      }
    }

    // Sobrescrever loop de partículas para incluir celebração
    function animateAll() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Partículas de fundo
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Partículas de celebração
      celebrationParticles.forEach(p => {
        p.update();
        p.draw(ctx);
      });
      celebrationParticles = celebrationParticles.filter(p => p.opacity > 0);

      requestAnimationFrame(animateAll);
    }

    /* EVENT LISTENERS*/
    document.getElementById('btn-restart').addEventListener('click', restartGame);
    document.getElementById('btn-reset-scores').addEventListener('click', resetScores);
    document.getElementById('btn-play-again').addEventListener('click', restartGame);

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // Fechar overlay com Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && resultOverlay.classList.contains('show')) {
        restartGame();
      }
    });

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });

    /* INICIALIZAÇÃO*/
    resizeCanvas();
    initParticles();
    buildBoard();
    updateTurnIndicator();
    animateAll();
