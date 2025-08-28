// 게임 월드 관리
import { CONFIG } from '../config.js';
import { Cell, CollisionDetector } from './entities.js';
import { AIController } from './ai.js';

export class World {
    constructor(rng) {
        this.rng = rng;
        this.cells = [];
        this.items = [];
        this.aiControllers = [];
        this.gameStartTime = 0;
        this.cellIdCounter = 0;
        this.selectedParticipants = [];
    }
    
    // 선택된 참가자 설정
    setSelectedParticipants(participants) {
        this.selectedParticipants = participants;
    }
    
    // 게임 초기화
    initialize() {
        this.cells = [];
        this.items = [];
        this.aiControllers = [];
        this.cellIdCounter = 0;
        this.gameStartTime = Date.now();
        
        this.spawnParticipants();
    }
    
    // 참가자 스폰
    spawnParticipants() {
        for (const participant of this.selectedParticipants) {
            const spawnPos = CollisionDetector.findSafeSpawnPosition(
                this.cells, 
                CONFIG.initialRadius, 
                this.rng
            );
            
            const cell = new Cell(
                ++this.cellIdCounter,
                `${participant.id} (${participant.name})`,
                spawnPos.x,
                spawnPos.y,
                CONFIG.initialRadius
            );
            
            this.cells.push(cell);
            
            // AI 컨트롤러 생성
            const aiController = new AIController(cell, this.rng);
            this.aiControllers.push(aiController);
        }
    }
    
    // AI 업데이트
    updateAI(now) {
        for (const aiController of this.aiControllers) {
            const otherCells = this.cells.filter(cell => cell.id !== aiController.cell.id);
            aiController.update(now, otherCells);
        }
    }
    
    // 모든 엔터티 업데이트
    update(now) {
        this.updateAI(now);
    }
    
    // 세포 목록 반환
    getCells() {
        return this.cells;
    }
    
    // 아이템 목록 반환
    getItems() {
        return this.items;
    }
    
    // 생존자 수 반환
    getSurvivorCount() {
        return this.cells.filter(cell => cell.alive).length;
    }
    
    // 게임 시작 시간 반환
    getGameStartTime() {
        return this.gameStartTime;
    }
    
    // 게임 경과 시간 반환 (초)
    getElapsedTime() {
        return (Date.now() - this.gameStartTime) / 1000;
    }
    
    // 남은 시간 반환 (초)
    getRemainingTime() {
        if (CONFIG.timeLimitSec <= 0) return -1; // 무한
        return Math.max(0, CONFIG.timeLimitSec - this.getElapsedTime());
    }
    
    // 게임 상태 반환
    getGameState() {
        const survivorCount = this.getSurvivorCount();
        
        if (survivorCount <= 0) {
            return 'ended';
        }
        
        if (CONFIG.timeLimitSec > 0) {
            if (this.getRemainingTime() <= 0) {
                return 'ended';
            }
        }
        
        return 'running';
    }
    
    // 참가자 통계 반환
    getParticipantStats() {
        return this.cells.map(cell => ({
            id: cell.id,
            label: cell.label,
            radius: cell.radius,
            alive: cell.alive,
            effects: { ...cell.effects },
            lastGrowAt: cell.lastGrowAt,
            deathTime: cell.deathTime
        }));
    }
    
    // 게임 리셋
    reset() {
        this.initialize();
    }
    
    // 시드 변경
    changeSeed(newSeed) {
        this.rng.setSeed(newSeed);
        this.reset();
    }
}
