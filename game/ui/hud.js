// HUD 시스템 - 게임 정보 표시
export class HUD {
    constructor() {
        this.survivorCount = document.getElementById('survivorCount');
        this.elapsedTime = document.getElementById('elapsedTime');
        this.remainingTime = document.getElementById('remainingTime');
        this.eventLog = document.getElementById('eventLog');
        this.winnerSection = document.getElementById('winnerSection');
        this.winnerList = document.getElementById('winnerList');
        this.downloadCsvBtn = document.getElementById('downloadCsvBtn');
        
        this.updateInterval = null;
        this.initialize();
    }
    
    // HUD 초기화
    initialize() {
        this.startUpdateLoop();
        this.bindEvents();
    }
    
    // 업데이트 루프 시작
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 100); // 100ms마다 업데이트
    }
    
    // 이벤트 바인딩
    bindEvents() {
        this.downloadCsvBtn.addEventListener('click', () => {
            this.downloadCSV();
        });
    }
    
    // HUD 업데이트
    update() {
        // 게임 엔진이 설정되면 실제 데이터로 업데이트
        if (window.gameEngine) {
            this.updateGameInfo();
            this.updateEventLog();
            this.updateWinnerSection();
        }
    }
    
    // 게임 정보 업데이트
    updateGameInfo() {
        const gameInfo = window.gameEngine.getGameInfo();
        
        // 생존자 수
        this.survivorCount.textContent = gameInfo.survivorCount;
        
        // 경과 시간
        const elapsed = gameInfo.elapsedTime;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        this.elapsedTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 남은 시간
        if (gameInfo.remainingTime >= 0) {
            const remaining = gameInfo.remainingTime;
            const remainingMinutes = Math.floor(remaining / 60);
            const remainingSeconds = Math.floor(remaining % 60);
            this.remainingTime.textContent = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            this.remainingTime.textContent = '∞';
        }
    }
    
    // 이벤트 로그 업데이트
    updateEventLog() {
        if (!window.gameEngine) return;
        
        const events = window.gameEngine.getEventLog();
        
        // 로그가 없으면 플레이스홀더 표시
        if (events.length === 0) {
            this.eventLog.innerHTML = '<div class="log-placeholder">게임을 시작하면 이벤트가 표시됩니다.</div>';
            return;
        }
        
        this.eventLog.innerHTML = '';
        
        events.forEach(event => {
            const eventItem = this.createEventItem(event);
            this.eventLog.appendChild(eventItem);
        });
    }
    
    // 이벤트 아이템 생성
    createEventItem(event) {
        const item = document.createElement('div');
        item.className = `event-item ${event.type}`;
        
        const time = new Date(event.timestamp);
        const timeStr = time.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        item.textContent = `[${timeStr}] ${event.message}`;
        
        return item;
    }
    
    // 우승자 섹션 업데이트
    updateWinnerSection() {
        if (!window.gameEngine) return;
        
        const gameState = window.gameEngine.getGameState();
        
        if (gameState === 'ended') {
            this.showWinnerSection();
        } else {
            this.hideWinnerSection();
        }
    }
    
    // 우승자 섹션 표시
    showWinnerSection() {
        if (!window.gameEngine) return;
        
        const winners = window.gameEngine.getWinners();
        this.renderWinnerList(winners);
        this.winnerSection.style.display = 'block';
    }
    
    // 우승자 섹션 숨김
    hideWinnerSection() {
        this.winnerSection.style.display = 'none';
    }
    
    // 우승자 목록 렌더링
    renderWinnerList(winners) {
        this.winnerList.innerHTML = '';
        
        if (winners.winners.length === 0) {
            const noWinnerItem = document.createElement('div');
            noWinnerItem.className = 'winner-item';
            noWinnerItem.innerHTML = `
                <div class="winner-rank">-</div>
                <div class="winner-info">
                    <div class="winner-name">우승자 없음</div>
                    <div class="winner-details">모든 참가자가 사망했습니다.</div>
                </div>
            `;
            this.winnerList.appendChild(noWinnerItem);
            return;
        }
        
        winners.winners.forEach((winner, index) => {
            const winnerItem = this.createWinnerItem(winner, index + 1);
            this.winnerList.appendChild(winnerItem);
        });
    }
    
    // 우승자 아이템 생성
    createWinnerItem(winner, rank) {
        const item = document.createElement('div');
        item.className = 'winner-item';
        
        const rankDiv = document.createElement('div');
        rankDiv.className = 'winner-rank';
        rankDiv.textContent = rank;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'winner-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'winner-name';
        nameDiv.textContent = winner.label;
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'winner-details';
        detailsDiv.textContent = `최종 크기: ${winner.radius}`;
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(detailsDiv);
        
        item.appendChild(rankDiv);
        item.appendChild(infoDiv);
        
        return item;
    }
    
    // CSV 다운로드
    downloadCSV() {
        if (!window.gameEngine) return;
        
        const winners = window.gameEngine.getWinners();
        const gameInfo = window.gameEngine.getGameInfo();
        
        if (winners.winners.length === 0) {
            alert('다운로드할 우승자 정보가 없습니다.');
            return;
        }
        
        // CSV 데이터 생성
        const csvData = this.generateCSVData(winners, gameInfo);
        
        // 파일 다운로드
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `winners-${timestamp}.csv`;
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
    
    // CSV 데이터 생성
    generateCSVData(winners, gameInfo) {
        const headers = ['rank', 'id', 'name', 'radius', 'seed', 'finishedAt'];
        const rows = [headers.join(',')];
        
        winners.winners.forEach((winner, index) => {
            const rank = index + 1;
            const id = winner.label.split(' (')[0]; // id 부분만 추출
            const name = winner.label.match(/\(([^)]+)\)/)?.[1] || ''; // 한글 이름 추출
            const radius = winner.radius;
            const seed = gameInfo.selectedParticipants.length > 0 ? (gameInfo.seed || '시간기반') : '';
            const finishedAt = new Date().toISOString();
            
            const row = [rank, id, name, radius, seed, finishedAt].join(',');
            rows.push(row);
        });
        
        return rows.join('\n');
    }
    
    // HUD 정리
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.downloadCsvBtn) {
            this.downloadCsvBtn.removeEventListener('click', this.downloadCSV);
        }
    }
}
