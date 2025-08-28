// 게임 엔티티 정의
import { CONFIG } from '../config.js';

// 아이템 타입 열거
export const ItemType = {
    SPEED: 'speed',
    REVIVE: 'revive',
    SHURIKEN: 'shuriken'
};

// 세포(참가자) 클래스
export class Cell {
    constructor(id, label, x, y, radius = CONFIG.initialRadius) {
        this.id = id;
        this.label = label; // id + name
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.radius = radius;
        this.alive = true;
        this.effects = {
            speedUntil: 0,      // 스피드 버프 만료 시간
            shurikenUntil: 0,   // 표창 버프 만료 시간
            invincibleUntil: 0  // 무적 시간 (부활 직후)
        };
        this.lastGrowAt = 0;    // 마지막 성장 시간
        this.deathTime = 0;     // 사망 시간
    }
    
    // 버프 적용
    applyEffect(type, untilTs) {
        switch (type) {
            case ItemType.SPEED:
                this.effects.speedUntil = Math.max(this.effects.speedUntil, untilTs);
                break;
            case ItemType.SHURIKEN:
                this.effects.shurikenUntil = Math.max(this.effects.shurikenUntil, untilTs);
                break;
        }
    }
    
    // 성장
    grow(amount) {
        this.radius = Math.min(this.radius + amount, CONFIG.maxRadius);
        this.lastGrowAt = Date.now();
    }
    
    // 사망
    kill(byId) {
        this.alive = false;
        this.deathTime = Date.now();
    }
    
    // 부활
    revive() {
        this.alive = true;
        this.radius = CONFIG.initialRadius;
        this.vel = { x: 0, y: 0 };
        this.effects = { speedUntil: 0, shurikenUntil: 0, invincibleUntil: 0 };
        this.invincibleUntil = Date.now() + CONFIG.reviveInvincibleMs;
    }
    
    // 현재 속도 계산 (버프 반영)
    getCurrentSpeed() {
        const now = Date.now();
        if (now < this.effects.speedUntil) {
            return CONFIG.baseSpeed * CONFIG.speedItemMultiplier;
        }
        return CONFIG.baseSpeed;
    }
    
    // 표창 버프 활성 여부
    hasShuriken() {
        return Date.now() < this.effects.shurikenUntil;
    }
    
    // 무적 상태 여부
    isInvincible() {
        return Date.now() < this.effects.invincibleUntil;
    }
    
    // 버프 만료 처리
    updateEffects(now) {
        if (this.effects.speedUntil < now) {
            this.effects.speedUntil = 0;
        }
        if (this.effects.shurikenUntil < now) {
            this.effects.shurikenUntil = 0;
        }
        if (this.effects.invincibleUntil < now) {
            this.effects.invincibleUntil = 0;
        }
    }
    
    // 위치 업데이트
    updatePosition() {
        const speed = this.getCurrentSpeed();
        const speedMagnitude = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        
        if (speedMagnitude > 0) {
            // 속도 정규화 후 현재 속도 적용
            const normalizedX = this.vel.x / speedMagnitude;
            const normalizedY = this.vel.y / speedMagnitude;
            
            this.pos.x += normalizedX * speed;
            this.pos.y += normalizedY * speed;
        }
    }
    
    // 벽 경계 처리
    handleWallCollision() {
        const margin = this.radius;
        
        if (this.pos.x - margin < CONFIG.canvas.margin) {
            this.pos.x = CONFIG.canvas.margin + margin;
            this.vel.x = Math.abs(this.vel.x) * 0.5; // 벽에 부딪히면 속도 감소
        } else if (this.pos.x + margin > CONFIG.canvas.width - CONFIG.canvas.margin) {
            this.pos.x = CONFIG.canvas.width - CONFIG.canvas.margin - margin;
            this.vel.x = -Math.abs(this.vel.x) * 0.5;
        }
        
        if (this.pos.y - margin < CONFIG.canvas.margin) {
            this.pos.y = CONFIG.canvas.margin + margin;
            this.vel.y = Math.abs(this.vel.y) * 0.5;
        } else if (this.pos.y + margin > CONFIG.canvas.height - CONFIG.canvas.margin) {
            this.pos.y = CONFIG.canvas.height - CONFIG.canvas.margin - margin;
            this.vel.y = -Math.abs(this.vel.y) * 0.5;
        }
    }
}

// 아이템 클래스
export class Item {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type;
        this.pos = { x, y };
        this.radius = CONFIG.itemRadius;
        this.spawnTime = Date.now();
        this.expiresAt = this.spawnTime + CONFIG.itemLifetimeMs;
    }
    
    // 아이템 수명 체크
    isExpired(now) {
        return now > this.expiresAt;
    }
    
    // 아이템 심볼 반환
    getSymbol() {
        switch (this.type) {
            case ItemType.SPEED:
                return '⚡';
            case ItemType.REVIVE:
                return '❤️';
            case ItemType.SHURIKEN:
                return '🎯';
            default:
                return '?';
        }
    }
}

// 충돌 감지 유틸리티
export class CollisionDetector {
    // 두 원의 충돌 감지
    static circlesCollide(circle1, circle2) {
        const dx = circle1.pos.x - circle2.pos.x;
        const dy = circle1.pos.y - circle2.pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (circle1.radius + circle2.radius);
    }
    
    // 세포 간 충돌 처리
    static handleCellCollision(cell1, cell2, now) {
        // 무적 상태인 세포는 충돌에서 제외
        if (cell1.isInvincible() || cell2.isInvincible()) {
            return null;
        }
        
        // 표창 버프가 있는 세포가 상대를 공격
        if (cell1.hasShuriken() && !cell2.hasShuriken()) {
            cell2.kill(cell1.id);
            return { type: 'kill', killer: cell1, victim: cell2, method: 'shuriken' };
        }
        
        if (cell2.hasShuriken() && !cell1.hasShuriken()) {
            cell1.kill(cell2.id);
            return { type: 'kill', killer: cell2, victim: cell1, method: 'shuriken' };
        }
        
        // 둘 다 표창 버프가 있으면 둘 다 사망
        if (cell1.hasShuriken() && cell2.hasShuriken()) {
            cell1.kill(cell2.id);
            cell2.kill(cell1.id);
            return { type: 'mutual_kill', cell1, cell2 };
        }
        
        // 일반적인 크기 기반 충돌
        if (cell1.radius > cell2.radius) {
            const growthAmount = Math.max(1, Math.floor(cell2.radius * 0.3));
            cell1.grow(growthAmount);
            cell2.kill(cell1.id);
            return { type: 'kill', killer: cell1, victim: cell2, method: 'size', growthAmount };
        } else if (cell2.radius > cell1.radius) {
            const growthAmount = Math.max(1, Math.floor(cell1.radius * 0.3));
            cell2.grow(growthAmount);
            cell1.kill(cell2.id);
            return { type: 'kill', killer: cell2, victim: cell1, method: 'size', growthAmount };
        }
        
        // 크기가 같으면 아무 일도 일어나지 않음
        return null;
    }
    
    // 세포와 아이템 충돌 처리
    static handleItemCollision(cell, item) {
        if (CollisionDetector.circlesCollide(cell, item)) {
            return { type: 'item_collect', cell, item };
        }
        return null;
    }
    
    // 안전한 스폰 위치 찾기
    static findSafeSpawnPosition(entities, radius, rng) {
        const maxAttempts = 10;
        const margin = radius + 5;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = rng.randRange(
                CONFIG.canvas.margin + margin, 
                CONFIG.canvas.width - CONFIG.canvas.margin - margin
            );
            const y = rng.randRange(
                CONFIG.canvas.margin + margin, 
                CONFIG.canvas.height - CONFIG.canvas.margin - margin
            );
            
            let safe = true;
            for (const entity of entities) {
                if (entity.alive !== undefined && !entity.alive) continue;
                
                const dx = entity.pos.x - x;
                const dy = entity.pos.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < (entity.radius + radius + 10)) {
                    safe = false;
                    break;
                }
            }
            
            if (safe) {
                return { x, y };
            }
        }
        
        // 안전한 위치를 찾지 못하면 중앙 근처에 배치
        return {
            x: rng.randRange(
                CONFIG.canvas.margin + 100, 
                CONFIG.canvas.width - CONFIG.canvas.margin - 100
            ),
            y: rng.randRange(
                CONFIG.canvas.margin + 100, 
                CONFIG.canvas.height - CONFIG.canvas.margin - 100
            )
        };
    }
}
