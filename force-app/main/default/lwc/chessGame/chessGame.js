import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class CatChess extends NavigationMixin(LightningElement) {
    // Game Flow States
    @track isGameStarted = false;
    @track isGameOver = false;
    @track gameOverMessage = '';
    
    // Core Engine States
    @track currentTurn = 'White'; // 'White' or 'Black'
    @track isAiThinking = false;
    @track selectedCoords = null;
    @track validMoves = [];
    @track lastMovePath = [];
    
    // Visual FX States
    @track isDangerFlash = false;
    @track isScreenShaking = false;
    @track isSlashActive = false;
    @track isKillTextShow = false;
    @track strikeText = '';
    @track textStyleClass = '';
    @track specialState = ''; // 'CHECK', 'CHECKMATE', 'STALEMATE'

    // Static Asset Reference Mappings
    pieceNames = {
        'p': 'Void Kitten',      'n': 'Masked Horse',    'b': 'Midnight Wolf', 
        'r': 'Shadow Elephant',   'q': 'Vampire Queen',   'k': 'Void Overlord',
        'P': 'Daylight Kitten',  'N': 'Unicorn Knight',  'B': 'Cunning Fox',      
        'R': 'Roring Bull',       'Q': 'Calico Tigress Queen', 'K': 'Sphynx Lion King'
    };

    catPieces = {
        'p': '🐈‍⬛', 'n': '🦓', 'b': '🐺', 'r': '🐘', 'q': '👸🏼', 'k': '🤴🏻',
        'P': '🐈', 'N': '🦄', 'B': '🦊', 'R': '🦬', 'Q': '🐯', 'K': '🦁'
    };

    pieceValues = {
        'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 1000,
        'P': 10, 'N': 30, 'B': 30, 'R': 50, 'Q': 90, 'K': 1000
    };

    // Master Grid Board Internal Data Matrix
    @track boardState = [];

    // Synthesized Audio Context Box
    audioCtx = null;

    connectedCallback() {
        this.initializeBoardData();
    }

    initializeBoardData() {
        this.boardState = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];
        this.currentTurn = 'White';
        this.selectedCoords = null;
        this.validMoves = [];
        this.lastMovePath = [];
        this.isAiThinking = false;
        this.isGameOver = false;
        this.gameOverMessage = '';
    }

    // Dynamic Reactive View Layer Row Map Compiler
    get boardRows() {
        let rows = [];
        for (let r = 0; r < 8; r++) {
            let cells = [];
            for (let c = 0; c < 8; c++) {
                const piece = this.boardState[r][c];
                const isLight = (r + c) % 2 === 0;
                
                // Class evaluation
                let classList = ['square', isLight ? 'light' : 'dark'];
                if (this.selectedCoords && this.selectedCoords.row === r && this.selectedCoords.col === c) {
                    classList.push('selected');
                }
                if (this.lastMovePath.some(p => p.row === r && p.col === c)) {
                    classList.push('path-trail');
                }

                const hasPiece = piece !== '';
                let pieceClassName = '';
                let pieceStyle = '';
                
                if (hasPiece) {
                    const isWhitePiece = piece === piece.toUpperCase();
                    pieceClassName = 'piece-token';
                    pieceStyle = isWhitePiece 
                        ? 'filter: drop-shadow(2px 2px 2px #fff);' 
                        : 'filter: drop-shadow(0px 0px 4px #00ffff) drop-shadow(2px 2px 2px #000);';
                }

                const isHighlighted = this.validMoves.some(m => m.row === r && m.col === c);

                cells.push({
                    id: `${r}-${c}`,
                    row: r,
                    col: c,
                    className: classList.join(' '),
                    hasPiece: hasPiece,
                    pieceIcon: hasPiece ? this.catPieces[piece] : '',
                    pieceName: hasPiece ? this.pieceNames[piece] : '',
                    pieceClassName: pieceClassName,
                    pieceStyle: pieceStyle,
                    isHighlighted: isHighlighted
                });
            }
            rows.push({ id: `row-${r}`, cells: cells });
        }
        return rows;
    }

    get currentTurnDisplay() {
        if (this.isAiThinking && !this.isGameOver) {
            return 'Black (AI Thinking...)';
        }
        if (this.specialState === 'CHECK') {
            return `${this.currentTurn} (⚠️ IN CHECK!)`;
        }
        return this.currentTurn;
    }

    // FX Classes Compute Layers
    get computedFxOverlayClass() {
        return `fx-overlay ${this.isDangerFlash ? 'danger-flash' : ''}`;
    }

    get computedScratchClass() {
        return `scratch-container ${this.isSlashActive ? 'slash-active' : ''}`;
    }

    get computedKillTextClass() {
        return `arcade-text ${this.textStyleClass} ${this.isKillTextShow ? 'show' : ''}`;
    }

    get computedGameContainerClass() {
        return `game-container ${this.isScreenShaking ? 'shake' : ''}`;
    }

    // Action Control Handlers
    handleStartGame() {
        this.isGameStarted = true;
        this.initAudioEngine();
    }

    handleRetry() {
        this.initializeBoardData();
        this.specialState = '';
    }

    navigateToHome() {
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'home'
            }
        });
    }

    handleSquareClick(event) {
        if (this.currentTurn === 'Black' || this.isAiThinking || this.isGameOver) return;

        const row = parseInt(event.currentTarget.dataset.row, 10);
        const col = parseInt(event.currentTarget.dataset.col, 10);
        const piece = this.boardState[row][col];
        const pieceColor = piece ? (piece === piece.toUpperCase() ? 'White' : 'Black') : null;

        // Execute move if clicking on a highlighted destination square
        if (this.validMoves.some(m => m.row === row && m.col === col)) {
            this.executeMove(this.selectedCoords.row, this.selectedCoords.col, row, col);
            return;
        }

        // Faction click confirmation selection
        if (pieceColor === this.currentTurn) {
            this.selectedCoords = { row, col };
            this.validMoves = this.calculateLegalMoves(row, col, piece, true);
        } else {
            this.selectedCoords = null;
            this.validMoves = [];
        }
    }

    executeMove(fromRow, fromCol, toRow, toCol) {
        this.isAiThinking = true;
        this.lastMovePath = this.generatePathArray(fromRow, fromCol, toRow, toCol);

        const rawAttackerToken = this.boardState[fromRow][fromCol];
        const targetPiece = this.boardState[toRow][toCol];
        const isCapture = targetPiece !== '';

        this.playWalkSound();
        let moveDuration = 400;

        // Perform programmatic move computation array swaps
        setTimeout(() => {
            let pieceToMove = this.boardState[fromRow][fromCol];
            
            // Pawn Promotion Handler Rules
            if (pieceToMove.toLowerCase() === 'p' && (toRow === 0 || toRow === 7)) {
                pieceToMove = pieceToMove === 'P' ? 'Q' : 'q';
            }

            this.boardState[toRow][toCol] = pieceToMove;
            this.boardState[fromRow][fromCol] = '';

            if (isCapture) {
                this.triggerCombatFX(rawAttackerToken);
            }

            setTimeout(() => {
                this.selectedCoords = null;
                this.validMoves = [];

                // Swap Active Faction Turn
                this.currentTurn = this.currentTurn === 'White' ? 'Black' : 'White';

                const nextPlayerIsWhite = (this.currentTurn === 'White');
                const inCheck = this.isKingInCheck(nextPlayerIsWhite);
                const hasMoves = this.playerHasAnyLegalMoves(nextPlayerIsWhite);

                if (inCheck && !hasMoves) {
                    this.specialState = 'CHECKMATE';
                    this.triggerSpecialStateFX("CHECKMATE");
                    this.gameOverMessage = `💥 CHECKMATE! ${nextPlayerIsWhite ? 'Black (AI)' : 'White (You)'} wins!`;
                    this.isGameOver = true;
                    this.isAiThinking = false;
                    return;
                } else if (inCheck) {
                    this.specialState = 'CHECK';
                    this.triggerSpecialStateFX("CHECK");
                } else if (!hasMoves) {
                    this.specialState = 'STALEMATE';
                    this.triggerSpecialStateFX("STALEMATE");
                    this.gameOverMessage = "Stalemate! The cats called a draw.";
                    this.isGameOver = true;
                    this.isAiThinking = false;
                    return;
                } else {
                    this.specialState = '';
                }

                this.isAiThinking = false;

                // Handle Automated AI Response Hook Cycle
                if (this.currentTurn === 'Black' && !this.isGameOver) {
                    this.isAiThinking = true;
                    // eslint-disable-next-line @lwc/lwc/no-async-operation
                    setTimeout(() => {
                        this.makeAiMove();
                    }, 800);
                }
            }, isCapture ? 600 : 50);

        }, moveDuration - 50);
    }

    generatePathArray(fromR, fromC, toR, toC) {
        let path = [];
        let rowStep = Math.sign(toR - fromR);
        let colStep = Math.sign(toC - fromC);
        let currentR = fromR, currentC = fromC;
        while (currentR !== toR || currentC !== toC) {
            path.push({ row: currentR, col: currentC });
            if (currentR !== toR) currentR += rowStep;
            if (currentC !== toC) currentC += colStep;
        }
        path.push({ row: toR, col: toC });
        return path;
    }

    // --- 🤖 AI ENGINE AUTOMATION MATRIX ---
    makeAiMove() {
        let allLegalMoves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.boardState[row][col];
                if (piece && piece === piece.toLowerCase()) {
                    const moves = this.calculateLegalMoves(row, col, piece, true);
                    moves.forEach(m => {
                        allLegalMoves.push({ from: { row, col }, to: m });
                    });
                }
            }
        }
        
        if (allLegalMoves.length === 0) {
            this.isAiThinking = false;
            return;
        }

        let bestMove = null;
        let bestScore = -Infinity;

        allLegalMoves.forEach(move => {
            let score = 0;
            const targetPiece = this.boardState[move.to.row][move.to.col];
            if (targetPiece) {
                score += this.pieceValues[targetPiece] * 10;
            }
            score += move.to.row; // Positional bias for pushing pieces forward
            score += Math.random() * 2; // Inject tactical variance
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        });

        if (bestMove) {
            this.executeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
        } else {
            this.isAiThinking = false;
        }
    }

    // --- MOVE CALCULATOR FRAMEWORK VECTOR LOGIC ---
    calculateLegalMoves(row, col, piece, filterChecks = true) {
        let moves = [];
        const type = piece.toLowerCase();
        const isWhite = piece === piece.toUpperCase();

        if (type === 'p') {
            const dir = isWhite ? -1 : 1;
            const startRow = isWhite ? 6 : 1;
            if (this.isEmpty(row + dir, col)) {
                moves.push({ row: row + dir, col });
                if (row === startRow && this.isEmpty(row + 2 * dir, col)) {
                    moves.push({ row: row + 2 * dir, col });
                }
            }
            if (this.isEnemy(row + dir, col - 1, isWhite)) moves.push({ row: row + dir, col: col - 1 });
            if (this.isEnemy(row + dir, col + 1, isWhite)) moves.push({ row: row + dir, col: col + 1 });
        }
        else if (type === 'n') {
            const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
            offsets.forEach(([rO, cO]) => {
                const targetR = row + rO, targetC = col + cO;
                if (this.onBoard(targetR, targetC) && (!this.boardState[targetR][targetC] || this.isEnemy(targetR, targetC, isWhite))) {
                    moves.push({ row: targetR, col: targetC });
                }
            });
        }
        if (type === 'b' || type === 'q') {
            const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
            dirs.forEach(([rD, cD]) => {
                let r = row + rD, c = col + cD;
                while (this.onBoard(r, c)) {
                    if (this.isEmpty(r, c)) {
                        moves.push({ row: r, col: c });
                    } else {
                        if (this.isEnemy(r, c, isWhite)) moves.push({ row: r, col: c });
                        break;
                    }
                    r += rD; c += cD;
                }
            });
        }
        if (type === 'r' || type === 'q') {
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            dirs.forEach(([rD, cD]) => {
                let r = row + rD, c = col + cD;
                while (this.onBoard(r, c)) {
                    if (this.isEmpty(r, c)) {
                        moves.push({ row: r, col: c });
                    } else {
                        if (this.isEnemy(r, c, isWhite)) moves.push({ row: r, col: c });
                        break;
                    }
                    r += rD; c += cD;
                }
            });
        }
        if (type === 'k') {
            for (let rD = -1; rD <= 1; rD++) {
                for (let cD = -1; cD <= 1; cD++) {
                    if (rD === 0 && cD === 0) continue;
                    const targetR = row + rD, targetC = col + cD;
                    if (this.onBoard(targetR, targetC) && (!this.boardState[targetR][targetC] || this.isEnemy(targetR, targetC, isWhite))) {
                        moves.push({ row: targetR, col: targetC });
                    }
                }
            }
        }

        if (filterChecks) {
            return moves.filter(m => {
                const originalSource = this.boardState[row][col];
                const originalDestination = this.boardState[m.row][m.col];
                
                this.boardState[m.row][m.col] = originalSource;
                this.boardState[row][col] = '';
                
                const kingInDanger = this.isKingInCheck(isWhite);
                
                this.boardState[row][col] = originalSource;
                this.boardState[m.row][m.col] = originalDestination;
                
                return !kingInDanger;
            });
        }
        return moves;
    }

    isKingInCheck(isWhiteKing) {
        let kingRow = -1, kingCol = -1;
        const targetKingToken = isWhiteKing ? 'K' : 'k';
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.boardState[r][c] === targetKingToken) {
                    kingRow = r; kingCol = c; break;
                }
            }
            if (kingRow !== -1) break;
        }
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.boardState[r][c];
                if (piece && (piece === piece.toUpperCase()) !== isWhiteKing) {
                    const enemyMoves = this.calculateLegalMoves(r, c, piece, false);
                    if (enemyMoves.some(em => em.row === kingRow && em.col === kingCol)) return true;
                }
            }
        }
        return false;
    }

    playerHasAnyLegalMoves(isWhitePlayer) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.boardState[r][c];
                if (piece && (piece === piece.toUpperCase()) === isWhitePlayer) {
                    const moves = this.calculateLegalMoves(r, c, piece, true);
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }

    onBoard(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    isEmpty(r, c) { return this.onBoard(r, c) && this.boardState[r][c] === ''; }
    isEnemy(r, c, isWhiteSelf) {
        if (!this.onBoard(r, c) || this.boardState[r][c] === '') return false;
        const isTargetWhite = this.boardState[r][c] === this.boardState[r][c].toUpperCase();
        return isWhiteSelf !== isTargetWhite;
    }

    // --- 🌋 COMBAT FX ENGINE & ANIMATION MATRIX CONTROLLERS ---
    triggerCombatFX(attackerToken) {
        this.isDangerFlash = true;
        this.isScreenShaking = true;

        let strikeTextStr = "🐾 MEOW KILL! 🐾";
        let styleClass = "text-cat";
        const isTigerAttacking = (attackerToken === 'R' || attackerToken === 'r');
        
        this.playKillSound(isTigerAttacking);

        switch (attackerToken) {
            case 'P': strikeTextStr = "🐾 MEOW KILL! 🐾"; styleClass = "text-cat"; break;
            case 'N': strikeTextStr = "✨ MYSTICAL STRIKE! ✨"; styleClass = "text-unicorn"; break;
            case 'B': strikeTextStr = "🦁 Cunning Cut! 🦁"; styleClass = "text-lion"; break;
            case 'R': strikeTextStr = "🐯 Roaring Bullll 🐯"; styleClass = "text-tiger"; this.isSlashActive = true; break;
            case 'Q': strikeTextStr = "🦊 SLY DECEPTION! 🦊"; styleClass = "text-fox"; break;
            case 'K': strikeTextStr = "👑 ROYAL EXECUTION! 👑"; styleClass = "text-king"; break;
            case 'p': strikeTextStr = "🐾 MEOW KILL! 🐾"; styleClass = "text-cat"; break;
            case 'n': strikeTextStr = "🥷 TRICKSTER AMBUSH! 🥷"; styleClass = "text-bandit"; break;
            case 'b': strikeTextStr = "🐾 SHADOW POUNCE! 🐾"; styleClass = "text-panther"; break;
            case 'r': strikeTextStr = "🐺 Thundhaaer KILL! 🐺"; styleClass = "text-wolf"; break;
            case 'q': strikeTextStr = "🩸 Queen BLOOD DRAIN ! 🩸"; styleClass = "text-vampire"; break;
            case 'k': strikeTextStr = "🎩 TOTAL DOMINATION! 🎩"; styleClass = "text-overlord"; break;
        }

        this.strikeText = strikeTextStr;
        this.textStyleClass = styleClass;
        this.isKillTextShow = true;
        
        this.speakWord(strikeTextStr);

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this.isDangerFlash = false;
            this.isScreenShaking = false;
            this.isKillTextShow = false;
            this.isSlashActive = false;
        }, 700);
    }

    triggerSpecialStateFX(state) {
        this.isDangerFlash = true;
        this.isScreenShaking = true;

        this.playWarningAlarm(state === "CHECKMATE");

        if (state === "CHECKMATE") {
            this.strikeText = "💥 CHECKMATE! 💥";
            this.textStyleClass = "text-checkmate";
            this.isKillTextShow = true;
            this.speakWord("Checkmate! Game Over.");
        } else if (state === "CHECK") {
            this.strikeText = "⚠️ KING UNDER ATTACK! ⚠️";
            this.textStyleClass = "text-check"; // Fixed trailing bracket bugs here
            this.isKillTextShow = true;
            this.speakWord("Warning! Your King is in check.");
        } else if (state === "STALEMATE") {
            this.strikeText = "🤝 STALEMATE! 🤝";
            this.textStyleClass = "text-overlord";
            this.isKillTextShow = true;
            this.speakWord("Stalemate! The match is drawn.");
        }

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this.isDangerFlash = false;
            this.isScreenShaking = false;
            this.isKillTextShow = false;
        }, 1000);
    }

    // --- 🔊 WEB AUDIO API retro FREQUENCY GENERATOR SYNTHESIZERS ---
    initAudioEngine() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playWalkSound() {
        this.initAudioEngine();
        if (!this.audioCtx) return;
        
        const now = this.audioCtx.currentTime;
        let osc = this.audioCtx.createOscillator();
        let gain = this.audioCtx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playKillSound(isTiger) {
        this.initAudioEngine();
        if (!this.audioCtx) return;
        
        const now = this.audioCtx.currentTime;
        if (isTiger) {
            let osc1 = this.audioCtx.createOscillator();
            let gain1 = this.audioCtx.createGain();
            let filter = this.audioCtx.createBiquadFilter();
            
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(90, now);
            osc1.frequency.linearRampToValueAtTime(40, now + 0.5);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);
            
            gain1.gain.setValueAtTime(0.5, now);
            gain1.gain.linearRampToValueAtTime(0.01, now + 0.5);
            
            osc1.connect(filter);
            filter.connect(gain1);
            gain1.connect(this.audioCtx.destination);
            
            osc1.start(now);
            osc1.stop(now + 0.5);
        } else {
            let osc2 = this.audioCtx.createOscillator();
            let gain2 = this.audioCtx.createGain();
            
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(600, now);
            osc2.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            
            gain2.gain.setValueAtTime(0.4, now);
            gain2.gain.linearRampToValueAtTime(0.01, now + 0.3);
            
            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            
            osc2.start(now);
            osc2.stop(now + 0.3);
        }
    }

    playWarningAlarm(isCheckmate) {
        this.initAudioEngine();
        if (!this.audioCtx) return;
        
        const now = this.audioCtx.currentTime;
        if (isCheckmate) {
            for (let i = 0; i < 3; i++) {
                let osc = this.audioCtx.createOscillator();
                let gain = this.audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(900 + (i * 50), now);
                osc.frequency.linearRampToValueAtTime(200, now + 0.8);
                
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.8);
                
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.8);
            }
        } else {
            let osc = this.audioCtx.createOscillator();
            let gain = this.audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.setValueAtTime(800, now + 0.15);
            
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
            
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    }

    speakWord(text) {
        // Regex dynamic mask to strip emojis/Unicode character sets from payload string
        const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '');
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            let utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.1;
            utterance.pitch = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    }
}