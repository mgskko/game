// 메인 게임 파일 - 엔트리 포인트
import { GameEngine } from './game/engine.js';
import { Sidebar } from './ui/sidebar.js';
import { HUD } from './ui/hud.js';

export class CoffeeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.gameEngine = null;
        this.sidebar = null;
        this.hud = null;
        
        this.initialize();
    }
    
    // 게임 초기화
    initialize() {
        try {
            // 게임 엔진 초기화
            this.gameEngine = new GameEngine(this.canvas);
            
            // 전역 객체로 설정 (UI에서 접근하기 위해)
            window.gameEngine = this.gameEngine;
            
            // 사이드바 초기화
            console.log('사이드바 초기화 시작...');
            this.sidebar = new Sidebar();
            console.log('사이드바 초기화 완료');
            
            // HUD 초기화
            console.log('HUD 초기화 시작...');
            this.hud = new HUD();
            console.log('HUD 초기화 완료');
            
            // 게임 상태 변경 감지
            this.setupGameStateObserver();
            
            // 초기 렌더링
            this.gameEngine.render();
            
            console.log('커피뽑기 시뮬레이터가 성공적으로 초기화되었습니다!');
            
        } catch (error) {
            console.error('게임 초기화 중 오류가 발생했습니다:', error);
            this.showError('게임 초기화 실패', error.message);
        }
    }
    
    // 게임 상태 변경 감지 설정
    setupGameStateObserver() {
        // 게임 상태 변경을 주기적으로 체크
        setInterval(() => {
            if (this.gameEngine) {
                const currentState = this.gameEngine.getGameState();
                const previousState = this.previousGameState;
                
                if (previousState !== currentState) {
                    this.onGameStateChange(currentState, previousState);
                    this.previousGameState = currentState;
                }
            }
        }, 100);
        
        this.previousGameState = 'ready';
    }
    
    // 게임 상태 변경 처리
    onGameStateChange(newState, oldState) {
        console.log(`게임 상태 변경: ${oldState} → ${newState}`);
        
        // 사이드바 상태 업데이트
        if (this.sidebar) {
            this.sidebar.onGameStateChange(newState);
        }
        
        // 게임 종료 시 우승자 표시
        if (newState === 'ended') {
            this.handleGameEnd();
        }
    }
    
    // 게임 종료 처리
    handleGameEnd() {
        if (!this.gameEngine) return;
        
        const winners = this.gameEngine.getWinners();
        if (winners && winners.winners.length > 0) {
            console.log(`🏆 게임 종료! 우승자: ${winners.winners.length}명`);
        } else {
            console.log('💀 게임 종료! 우승자 없음');
        }
    }
    
    // 오류 표시
    showError(title, message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        
        errorDiv.innerHTML = `
            <h3>${title}</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: #dc3545;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">확인</button>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    // 게임 정리
    destroy() {
        if (this.hud) {
            this.hud.destroy();
        }
        
        if (this.sidebar) {
            this.sidebar.destroy();
        }
        
        if (this.gameEngine) {
            this.gameEngine.stop();
        }
        
        window.gameEngine = null;
    }
}

// DOM 로드 완료 후 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 게임 시작...');
    
    try {
        // 게임 인스턴스 생성
        window.coffeeGame = new CoffeeGame();
        
        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            if (window.coffeeGame) {
                window.coffeeGame.destroy();
            }
        });
        
        // 개발자 도구용 전역 함수들
        window.debugGame = () => {
            if (window.gameEngine) {
                console.log('=== 게임 디버그 정보 ===');
                console.log('게임 상태:', window.gameEngine.getGameState());
                console.log('게임 정보:', window.gameEngine.getGameInfo());
                console.log('참가자 통계:', window.gameEngine.getParticipantStats());
                console.log('이벤트 로그:', window.gameEngine.getEventLog());
                console.log('우승자 정보:', window.gameEngine.getWinners());
            } else {
                console.log('게임 엔진이 초기화되지 않았습니다.');
            }
        };
        
        window.restartGame = () => {
            if (window.coffeeGame) {
                window.coffeeGame.destroy();
                window.coffeeGame = new CoffeeGame();
            }
        };
        
        console.log('게임 초기화 완료!');
        console.log('디버그 명령어: debugGame(), restartGame()');
        
    } catch (error) {
        console.error('게임 초기화 중 오류 발생:', error);
        alert('게임 초기화에 실패했습니다. 콘솔을 확인해주세요.');
    }
});
