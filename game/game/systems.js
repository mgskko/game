// 게임 시스템 관리
import { CONFIG } from '../config.js';
import { ItemType, CollisionDetector } from './entities.js';

export class GameSystems {
    constructor(world, rng) {
        this.world = world;
        this.rng = rng;
        this.lastItemSpawn = 0;
        this.itemIdCounter = 0;
        this.events = [];
        this.targetCount = 1;
    }
    
    // 목표 인원 수 설정
    setTargetCount(count) {
        this.targetCount = Math.max(1, count);
    }
    
    // 이벤트 로그 추가
    addEvent(type, message, data = {}) {
        const event = {
            type,
            message,
            data,
            timestamp: Date.now()
        };
        
        this.events.unshift(event);
        
        // 최근 10개만 유지
        if (this.events.length > 10) {
            this.events = this.events.slice(0, 10);
        }
        
        return event;
    }
    
    // 이벤트 로그 반환
    getEvents() {
        return this.events;
    }
    
    // 모든 시스템 업데이트
    update(now) {
        this.updateEffects(now);
        this.updateMovement();
        this.updateCollisions(now);
        this.updateItems(now);
        this.spawnItems(now);
    }
    
    // 버프 효과 업데이트
    updateEffects(now) {
        for (const cell of this.world.cells) {
            cell.updateEffects(now);
        }
    }
    
    // 이동 시스템 업데이트
    updateMovement() {
        for (const cell of this.world.cells) {
            if (!cell.alive) continue;
            
            cell.updatePosition();
            cell.handleWallCollision();
        }
    }
    
    // 충돌 시스템 업데이트
    updateCollisions(now) {
        // 세포 간 충돌
        for (let i = 0; i < this.world.cells.length; i++) {
            for (let j = i + 1; j < this.world.cells.length; j++) {
                const cell1 = this.world.cells[i];
                const cell2 = this.world.cells[j];
                
                if (!cell1.alive || !cell2.alive) continue;
                
                const collision = CollisionDetector.handleCellCollision(cell1, cell2, now);
                if (collision) {
                    this.handleCellCollision(collision);
                }
            }
        }
        
        // 세포와 아이템 충돌
        for (const cell of this.world.cells) {
            if (!cell.alive) continue;
            
            for (let i = this.world.items.length - 1; i >= 0; i--) {
                const item = this.world.items[i];
                const collision = CollisionDetector.handleItemCollision(cell, item);
                if (collision) {
                    this.handleItemCollection(collision);
                    this.world.items.splice(i, 1);
                }
            }
        }
    }
    
    // 세포 충돌 처리
    handleCellCollision(collision) {
        switch (collision.type) {
            case 'kill':
                if (collision.method === 'shuriken') {
                    this.addEvent('kill', 
                        `${collision.killer.label} ▶ ${collision.victim.label} (표창)`,
                        { type: 'kill', method: 'shuriken' }
                    );
                } else {
                    this.addEvent('kill', 
                        `${collision.killer.label} ▶ ${collision.victim.label} (크기)`,
                        { type: 'kill', method: 'size', growth: collision.growthAmount }
                    );
                }
                break;
                
            case 'mutual_kill':
                this.addEvent('kill', 
                    `${collision.cell1.label} ↔ ${collision.cell2.label} (표창 상호 파괴)`,
                    { type: 'mutual_kill', cell1: collision.cell1, cell2: collision.cell2 }
                );
                break;
        }
    }
    
    // 아이템 수집 처리
    handleItemCollection(collision) {
        const { cell, item } = collision;
        const now = Date.now();
        
        switch (item.type) {
            case ItemType.SPEED:
                const speedUntil = now + CONFIG.speedDurationMs;
                cell.applyEffect(ItemType.SPEED, speedUntil);
                this.addEvent('item', 
                    `${cell.label} 획득: 스피드 부스트`,
                    { type: 'speed', duration: CONFIG.speedDurationMs }
                );
                break;
                
            case ItemType.SHURIKEN:
                const shurikenUntil = now + CONFIG.shurikenDurationMs;
                cell.applyEffect(ItemType.SHURIKEN, shurikenUntil);
                this.addEvent('item', 
                    `${cell.label} 획득: 표창 (즉사 권능)`,
                    { type: 'shuriken', duration: CONFIG.shurikenDurationMs }
                );
                break;
                
            case ItemType.REVIVE:
                this.handleRevive();
                break;
        }
    }
    
    // 부활 처리
    handleRevive() {
        const deadCells = this.world.cells.filter(cell => !cell.alive);
        if (deadCells.length === 0) return;
        
        // 무작위로 죽은 세포 중 하나 선택
        const revivedCell = this.rng.choice(deadCells);
        const spawnPos = CollisionDetector.findSafeSpawnPosition(
            this.world.cells, 
            CONFIG.initialRadius, 
            this.rng
        );
        
        revivedCell.revive();
        revivedCell.pos = spawnPos;
        
        this.addEvent('revive', 
            `부활: ${revivedCell.label}`,
            { type: 'revive', cell: revivedCell }
        );
    }
    
    // 아이템 스폰
    spawnItems(now) {
        if (now - this.lastItemSpawn < CONFIG.itemSpawnIntervalMs) return;
        
        const itemTypes = Object.keys(CONFIG.itemWeights);
        const weights = Object.values(CONFIG.itemWeights);
        
        const selectedType = this.rng.weightedChoice(itemTypes, weights);
        const spawnPos = CollisionDetector.findSafeSpawnPosition(
            [...this.world.cells, ...this.world.items],
            CONFIG.itemRadius,
            this.rng
        );
        
        const item = {
            id: `item_${++this.itemIdCounter}`,
            type: selectedType,
            pos: spawnPos,
            radius: CONFIG.itemRadius,
            spawnTime: now,
            expiresAt: now + CONFIG.itemLifetimeMs
        };
        
        this.world.items.push(item);
        this.lastItemSpawn = now;
    }
    
    // 아이템 업데이트 (만료 처리)
    updateItems(now) {
        for (let i = this.world.items.length - 1; i >= 0; i--) {
            if (this.world.items[i].expiresAt < now) {
                this.world.items.splice(i, 1);
            }
        }
    }
    
    // 생존자 수 계산
    getSurvivorCount() {
        return this.world.cells.filter(cell => cell.alive).length;
    }
    
    // 목표 인원 달성 체크
    checkTargetReached() {
        return this.getSurvivorCount() <= this.targetCount;
    }
    
    // 우승자 결정
    determineWinners() {
        const aliveCells = this.world.cells.filter(cell => cell.alive);
        
        if (aliveCells.length === 0) {
            return { type: 'all_dead', winners: [] };
        }
        
        if (aliveCells.length <= this.targetCount) {
            // 목표 인원 이하로 생존한 경우
            return { type: 'target_reached', winners: aliveCells };
        } else {
            // 타임리밋 도달 시 최대 크기 기준 상위 N명
            const sortedCells = aliveCells.sort((a, b) => {
                if (b.radius !== a.radius) {
                    return b.radius - a.radius;
                }
                // 동률 시 마지막 성장 시간이 늦은 순
                return b.lastGrowAt - a.lastGrowAt;
            });
            
            return { 
                type: 'time_limit', 
                winners: sortedCells.slice(0, this.targetCount) 
            };
        }
    }
    
    // 게임 상태 체크
    checkGameState() {
        if (this.checkTargetReached()) {
            return 'ended';
        }
        
        if (CONFIG.timeLimitSec > 0) {
            const elapsed = (Date.now() - this.world.gameStartTime) / 1000;
            if (elapsed >= CONFIG.timeLimitSec) {
                return 'ended';
            }
        }
        
        return 'running';
    }
}
