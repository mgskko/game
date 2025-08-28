// AI 시스템 - 세포들의 자동 이동 제어
import { CONFIG } from '../config.js';

export class AIController {
    constructor(cell, rng) {
        this.cell = cell;
        this.rng = rng;
        this.lastDirectionChange = 0;
        this.nextDirectionChangeDelay = this.getRandomDirectionDelay();
        this.targetDirection = this.getRandomDirection();
        this.currentDirection = this.targetDirection;
    }
    
    // 랜덤 방향 전환 지연 시간 계산
    getRandomDirectionDelay() {
        const [min, max] = CONFIG.ai.turnEveryMs;
        return this.rng.randRange(min, max);
    }
    
    // 랜덤 방향 생성
    getRandomDirection() {
        const angle = this.rng.randFloat(0, Math.PI * 2);
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
    }
    
    // 벽 회피 방향 계산
    getWallAvoidanceDirection() {
        const margin = this.cell.radius + 20;
        let avoidX = 0;
        let avoidY = 0;
        
        // 왼쪽 벽에 가까우면 오른쪽으로
        if (this.cell.pos.x < CONFIG.canvas.margin + margin) {
            avoidX = 1;
        }
        // 오른쪽 벽에 가까우면 왼쪽으로
        else if (this.cell.pos.x > CONFIG.canvas.width - CONFIG.canvas.margin - margin) {
            avoidX = -1;
        }
        
        // 위쪽 벽에 가까우면 아래로
        if (this.cell.pos.y < CONFIG.canvas.margin + margin) {
            avoidY = 1;
        }
        // 아래쪽 벽에 가까우면 위로
        else if (this.cell.pos.y > CONFIG.canvas.height - CONFIG.canvas.margin - margin) {
            avoidY = -1;
        }
        
        return { x: avoidX, y: avoidY };
    }
    
    // 다른 세포 회피 방향 계산
    getCellAvoidanceDirection(otherCells) {
        let avoidX = 0;
        let avoidY = 0;
        const avoidRadius = this.cell.radius + 30;
        
        for (const other of otherCells) {
            if (!other.alive || other.id === this.cell.id) continue;
            
            const dx = this.cell.pos.x - other.pos.x;
            const dy = this.cell.pos.y - other.pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < avoidRadius) {
                // 거리가 가까우면 반대 방향으로 회피
                const strength = (avoidRadius - distance) / avoidRadius;
                avoidX += (dx / distance) * strength;
                avoidY += (dy / distance) * strength;
            }
        }
        
        // 회피 벡터 정규화
        const magnitude = Math.sqrt(avoidX * avoidX + avoidY * avoidY);
        if (magnitude > 0) {
            avoidX /= magnitude;
            avoidY /= magnitude;
        }
        
        return { x: avoidX, y: avoidY };
    }
    
    // 방향 업데이트
    updateDirection(now, otherCells) {
        // 방향 전환 시간 체크
        if (now - this.lastDirectionChange > this.nextDirectionChangeDelay) {
            this.targetDirection = this.getRandomDirection();
            this.nextDirectionChangeDelay = this.getRandomDirectionDelay();
            this.lastDirectionChange = now;
        }
        
        // 벽 회피
        const wallAvoidance = this.getWallAvoidanceDirection();
        
        // 다른 세포 회피
        const cellAvoidance = this.getCellAvoidanceDirection(otherCells);
        
        // 최종 방향 계산 (가중치 적용)
        let finalX = this.targetDirection.x;
        let finalY = this.targetDirection.y;
        
        // 벽 회피 가중치
        if (wallAvoidance.x !== 0 || wallAvoidance.y !== 0) {
            finalX = finalX * (1 - CONFIG.ai.avoidWallsBias) + wallAvoidance.x * CONFIG.ai.avoidWallsBias;
            finalY = finalY * (1 - CONFIG.ai.avoidWallsBias) + wallAvoidance.y * CONFIG.ai.avoidWallsBias;
        }
        
        // 세포 회피 가중치
        if (cellAvoidance.x !== 0 || cellAvoidance.y !== 0) {
            finalX = finalX * 0.7 + cellAvoidance.x * 0.3;
            finalY = finalY * 0.7 + cellAvoidance.y * 0.3;
        }
        
        // 방향 정규화
        const magnitude = Math.sqrt(finalX * finalX + finalY * finalY);
        if (magnitude > 0) {
            finalX /= magnitude;
            finalY /= magnitude;
        }
        
        // 약간의 흔들림 추가
        const jitter = CONFIG.ai.jitter;
        finalX += (this.rng.random() - 0.5) * jitter;
        finalY += (this.rng.random() - 0.5) * jitter;
        
        // 다시 정규화
        const jitterMagnitude = Math.sqrt(finalX * finalX + finalY * finalY);
        if (jitterMagnitude > 0) {
            finalX /= jitterMagnitude;
            finalY /= jitterMagnitude;
        }
        
        this.currentDirection = { x: finalX, y: finalY };
    }
    
    // 속도 벡터 업데이트
    updateVelocity() {
        const speed = this.cell.getCurrentSpeed();
        this.cell.vel.x = this.currentDirection.x * speed;
        this.cell.vel.y = this.currentDirection.y * speed;
    }
    
    // AI 업데이트 (매 프레임 호출)
    update(now, otherCells) {
        if (!this.cell.alive) return;
        
        this.updateDirection(now, otherCells);
        this.updateVelocity();
    }
}
