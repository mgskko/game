// 게임 렌더링 시스템
import { CONFIG } from '../config.js';
import { ItemType } from './entities.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupCanvas();
    }
    
    // 캔버스 설정
    setupCanvas() {
        this.canvas.width = CONFIG.canvas.width;
        this.canvas.height = CONFIG.canvas.height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    // 전체 화면 클리어
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 배경 그리기
    drawBackground() {
        // 흰색 배경
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 경계선
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            CONFIG.canvas.margin, 
            CONFIG.canvas.margin, 
            CONFIG.canvas.width - CONFIG.canvas.margin * 2, 
            CONFIG.canvas.height - CONFIG.canvas.margin * 2
        );
    }
    
    // 세포 그리기
    drawCell(cell) {
        if (!cell.alive) return;
        
        const { x, y } = cell.pos;
        const radius = cell.radius;
        
        // 그림자 효과
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 6;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // 세포 채우기
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        if (cell.isInvincible()) {
            // 무적 상태: 반짝이는 효과
            const time = Date.now() * 0.01;
            const alpha = 0.4 + 0.3 * Math.sin(time);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
            gradient.addColorStop(1, `rgba(255, 165, 0, ${alpha})`);
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(1, 'rgba(200, 200, 200, 0.7)');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 그림자 리셋
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 테두리
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 이름 표시
        this.drawCellName(cell);
        
        // 버프 효과 표시
        this.drawCellBuffs(cell);
        
        // 스피드 버프 시 꼬리 효과
        if (Date.now() < cell.effects.speedUntil) {
            this.drawSpeedTrail(cell);
        }
        
        // 무적 상태 점선 링
        if (cell.isInvincible()) {
            this.drawInvincibleRing(cell);
        }
    }
    
    // 세포 이름 그리기
    drawCellName(cell) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 이름을 짧게 표시 (id 앞부분 또는 한글 이름)
        const label = cell.label;
        let displayName = label;
        
        if (label.includes('(')) {
            // 한글 이름 추출
            const match = label.match(/\(([^)]+)\)/);
            if (match) {
                displayName = match[1];
            }
        } else {
            // id 앞부분만 표시
            displayName = label.split('.')[0];
        }
        
        const textWidth = this.ctx.measureText(displayName).width;
        
        // 이름 배경
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(
            cell.pos.x - textWidth / 2 - 4,
            cell.pos.y - cell.radius - 25,
            textWidth + 8,
            20
        );
        
        // 이름 텍스트
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillText(displayName, cell.pos.x, cell.pos.y - cell.radius - 15);
    }
    
    // 세포 버프 효과 그리기
    drawCellBuffs(cell) {
        const now = Date.now();
        let buffCount = 0;
        
        if (now < cell.effects.speedUntil) {
            this.drawBuffIcon(cell, '⚡', '#ffc107', buffCount++);
        }
        
        if (now < cell.effects.shurikenUntil) {
            this.drawBuffIcon(cell, '🎯', '#dc3545', buffCount++);
        }
    }
    
    // 버프 아이콘 그리기
    drawBuffIcon(cell, symbol, color, index) {
        const iconSize = 16;
        const iconX = cell.pos.x + cell.radius + 5 + (index * 20);
        const iconY = cell.pos.y - cell.radius - 15;
        
        // 아이콘 배경
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(iconX, iconY, iconSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 아이콘 텍스트
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, iconX, iconY);
    }
    
    // 스피드 꼬리 효과 그리기
    drawSpeedTrail(cell) {
        const trailLength = 5;
        const trailOpacity = 0.3;
        
        for (let i = 1; i <= trailLength; i++) {
            const opacity = trailOpacity * (1 - i / trailLength);
            const size = cell.radius * (1 - i / trailLength * 0.5);
            
            this.ctx.fillStyle = `rgba(255, 193, 7, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(
                cell.pos.x - cell.vel.x * i * 0.5,
                cell.pos.y - cell.vel.y * i * 0.5,
                size,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }
    
    // 무적 상태 점선 링 그리기
    drawInvincibleRing(cell) {
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.arc(cell.pos.x, cell.pos.y, cell.radius + 8, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 점선 리셋
        this.ctx.setLineDash([]);
    }
    
    // 아이템 그리기
    drawItem(item) {
        const { x, y } = item.pos;
        const radius = item.radius;
        
        // 아이템 심볼
        const symbol = item.getSymbol();
        
        // 아이템 배경 (깜빡이는 효과)
        const time = Date.now() * 0.005;
        const alpha = 0.6 + 0.2 * Math.sin(time);
        
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 아이템 테두리
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 아이템 심볼
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, x, y);
    }
    
    // 전체 렌더링
    render(world) {
        this.clear();
        this.drawBackground();
        
        // 아이템 그리기
        for (const item of world.getItems()) {
            this.drawItem(item);
        }
        
        // 세포 그리기
        for (const cell of world.getCells()) {
            this.drawCell(cell);
        }
    }
}
