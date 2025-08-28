// 게임 엔진 - 메인 루프 및 상태 관리
import { CONFIG } from '../config.js';
import { World } from './world.js';
import { GameSystems } from './systems.js';
import { Renderer } from './render.js';
import { RNG } from '../rng.js';

export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.rng = new RNG();
        this.world = new World(this.rng);
        this.systems = new GameSystems(this.world, this.rng);
        
        this.gameState = 'ready'; // ready, running, paused, ended
        this.lastFrameTime = 0;
        this.animationId = null;
        this.selectedParticipants = [];
        this.targetCount = 1;
        this.seed = '';
        
        this.initialize();
    }
    
    // 게임 초기화
    initialize() {
        this.gameState = 'ready';
        this.lastFrameTime = 0;
        this.selectedParticipants = [];
        this.targetCount = 1;
        this.seed = '';
    }
    
    // 게임 시작
    start(participants, targetCount, seed = '') {
        if (this.gameState === 'running') return;
        
        this.selectedParticipants = participants;
        this.targetCount = targetCount;
        this.seed = seed;
        
        // 시드 설정
        if (seed !== '') {
            this.rng.setSeed(seed);
        } else {
            this.rng.setSeed(null);
        }
        
        // 월드 설정
        this.world.setSelectedParticipants(participants);
        this.systems.setTargetCount(targetCount);
        
        // 게임 초기화
        this.world.initialize();
        this.gameState = 'running';
        this.lastFrameTime = performance.now();
        
        if (!this.animationId) {
            this.gameLoop();
        }
    }
    
    // 게임 일시정지/재개
    togglePause() {
        if (this.gameState === 'running') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'running';
            this.lastFrameTime = performance.now();
        }
    }
    
    // 게임 재시작
    restart() {
        this.stop();
        this.start(this.selectedParticipants, this.targetCount, this.seed);
    }
    
    // 게임 정지
    stop() {
        this.gameState = 'ended';
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // 게임 루프
    gameLoop(currentTime = performance.now()) {
        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
        
        if (this.gameState !== 'running') return;
        
        // 프레임 제한 체크
        if (CONFIG.frameCap > 0) {
            const frameInterval = 1000 / CONFIG.frameCap;
            if (currentTime - this.lastFrameTime < frameInterval) return;
        }
        
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // 게임 업데이트
        this.update(deltaTime);
        
        // 렌더링
        this.render();
    }
    
    // 게임 업데이트
    update(deltaTime) {
        const now = Date.now();
        
        // 월드 업데이트
        this.world.update(now);
        
        // 시스템 업데이트
        this.systems.update(now);
        
        // 게임 상태 체크
        this.checkGameState();
    }
    
    // 게임 상태 체크
    checkGameState() {
        const gameState = this.systems.checkGameState();
        
        if (gameState === 'ended') {
            this.gameState = 'ended';
            this.handleGameEnd();
        }
    }
    
    // 게임 종료 처리
    handleGameEnd() {
        const winners = this.systems.determineWinners();
        
        if (winners.winners.length > 0) {
            // 우승자 결정 이벤트 로그
            let message = '';
            if (winners.type === 'target_reached') {
                message = `🎯 목표 달성! ${winners.winners.length}명 생존`;
            } else if (winners.type === 'time_limit') {
                message = `⏰ 시간 종료! 상위 ${winners.winners.length}명 우승`;
            }
            
            this.systems.addEvent('winner', message, winners);
        } else {
            this.systems.addEvent('winner', '💀 모든 참가자 사망...', winners);
        }
    }
    
    // 렌더링
    render() {
        this.renderer.render(this.world);
    }
    
    // 게임 상태 반환
    getGameState() {
        return this.gameState;
    }
    
    // 월드 상태 반환
    getWorld() {
        return this.world;
    }
    
    // 시스템 상태 반환
    getSystems() {
        return this.systems;
    }
    
    // 게임 정보 반환
    getGameInfo() {
        return {
            state: this.gameState,
            survivorCount: this.world.getSurvivorCount(),
            elapsedTime: this.world.getElapsedTime(),
            remainingTime: this.world.getRemainingTime(),
            participantCount: this.world.getCells().length,
            itemCount: this.world.getItems().length,
            targetCount: this.targetCount,
            selectedParticipants: this.selectedParticipants
        };
    }
    
    // 참가자 통계 반환
    getParticipantStats() {
        return this.world.getParticipantStats();
    }
    
    // 이벤트 로그 반환
    getEventLog() {
        return this.systems.getEvents();
    }
    
    // 우승자 정보 반환
    getWinners() {
        return this.systems.determineWinners();
    }
}
