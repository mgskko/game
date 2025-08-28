// 사이드바 UI 시스템
import { CONFIG } from '../config.js';

// 임시로 하드코딩 (디버깅용)
const DEFAULT_PARTICIPANTS = [
    { id: "bonah.fide", name: "유지우" },
    { id: "claire.hk", name: "김희경" },
    { id: "emma.kang", name: "강경임" },
    { id: "genie.lamp", name: "심진희" },
    { id: "izzy.so", name: "송현경" },
    { id: "jadey.yoon", name: "이지윤" },
    { id: "jully.lee", name: "이정은" },
    { id: "karel.kang", name: "강기곤" },
    { id: "kent.coach", name: "장한일" },
    { id: "kimberly.lim", name: "임수연" },
    { id: "kuma.mon", name: "고슬기" },
    { id: "luci.dor", name: "김연희" },
    { id: "maddison.ko", name: "고명석" },
    { id: "miya.0", name: "이다솜" },
    { id: "nathan.kwon", name: "권성원" },
    { id: "noah.se", name: "신송은" },
    { id: "tomtom.s", name: "신은영" },
    { id: "william.lim", name: "임원국" },
    { id: "zo.7", name: "지영은" }
];

export class Sidebar {
    constructor() {
        this.participantList = document.getElementById('participantList');
        this.selectedCount = document.getElementById('selectedCount');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.targetCountInput = document.getElementById('targetCount');
        this.seedInput = document.getElementById('seedInput');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.selectedParticipants = new Set();
        this.initialize();
    }
    
    // 사이드바 초기화
    initialize() {
        try {
            console.log('사이드바 초기화 시작...');
            this.renderParticipantList();
            this.bindEvents();
            this.updateUI();
            console.log('사이드바 초기화 완료');
        } catch (error) {
            console.error('사이드바 초기화 오류:', error);
        }
    }
    
    // 참가자 목록 렌더링
    renderParticipantList() {
        try {
            console.log('참가자 목록 렌더링 시작...');
            console.log('DEFAULT_PARTICIPANTS:', DEFAULT_PARTICIPANTS);
            console.log('participantList 요소:', this.participantList);
            
            if (!this.participantList) {
                console.error('participantList 요소를 찾을 수 없습니다!');
                return;
            }
            
            if (!DEFAULT_PARTICIPANTS || DEFAULT_PARTICIPANTS.length === 0) {
                console.error('DEFAULT_PARTICIPANTS가 정의되지 않았습니다!');
                return;
            }
            
            this.participantList.innerHTML = '';
            
            // 알파벳 순으로 정렬
            const sortedParticipants = [...DEFAULT_PARTICIPANTS].sort((a, b) => 
                a.id.localeCompare(b.id)
            );
            
            console.log('정렬된 참가자:', sortedParticipants);
            
            sortedParticipants.forEach(participant => {
                const item = this.createParticipantItem(participant);
                this.participantList.appendChild(item);
            });
            
            console.log('참가자 목록 렌더링 완료');
        } catch (error) {
            console.error('참가자 목록 렌더링 오류:', error);
        }
    }
    
    // 참가자 아이템 생성
    createParticipantItem(participant) {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.dataset.id = participant.id;
        
        const checkbox = document.createElement('div');
        checkbox.className = 'radio-checkbox';
        checkbox.dataset.id = participant.id;
        
        const info = document.createElement('div');
        info.className = 'participant-info';
        
        const idSpan = document.createElement('span');
        idSpan.className = 'participant-id';
        idSpan.textContent = participant.id;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'participant-name';
        nameSpan.textContent = participant.name;
        
        info.appendChild(idSpan);
        info.appendChild(nameSpan);
        
        item.appendChild(checkbox);
        item.appendChild(info);
        
        // 클릭 이벤트
        item.addEventListener('click', () => {
            this.toggleParticipant(participant.id);
        });
        
        return item;
    }
    
    // 참가자 선택/해제 토글
    toggleParticipant(participantId) {
        if (this.selectedParticipants.has(participantId)) {
            this.selectedParticipants.delete(participantId);
        } else {
            this.selectedParticipants.add(participantId);
        }
        
        this.updateParticipantUI();
        this.updateUI();
    }
    
    // 참가자 UI 업데이트
    updateParticipantUI() {
        const items = this.participantList.querySelectorAll('.participant-item');
        
        items.forEach(item => {
            const participantId = item.dataset.id;
            const checkbox = item.querySelector('.radio-checkbox');
            
            if (this.selectedParticipants.has(participantId)) {
                item.classList.add('selected');
                checkbox.classList.add('checked');
            } else {
                item.classList.remove('selected');
                checkbox.classList.remove('checked');
            }
        });
    }
    
    // 전체 선택/해제
    toggleSelectAll() {
        if (this.selectedParticipants.size === DEFAULT_PARTICIPANTS.length) {
            // 모두 선택된 경우 전체 해제
            this.selectedParticipants.clear();
        } else {
            // 모두 선택
            DEFAULT_PARTICIPANTS.forEach(p => this.selectedParticipants.add(p.id));
        }
        
        this.updateParticipantUI();
        this.updateUI();
    }
    
    // UI 업데이트
    updateUI() {
        const selectedCount = this.selectedParticipants.size;
        this.selectedCount.textContent = selectedCount;
        
        // 전체 선택 버튼 텍스트 업데이트
        if (selectedCount === DEFAULT_PARTICIPANTS.length) {
            this.selectAllBtn.textContent = '전체 해제';
        } else {
            this.selectAllBtn.textContent = '전체 선택';
        }
        
        // 목표 인원 수 입력 제한
        const maxTarget = Math.max(1, selectedCount - 1);
        this.targetCountInput.max = maxTarget;
        
        // 현재 목표 인원 수가 최대값을 초과하면 조정
        if (parseInt(this.targetCountInput.value) > maxTarget) {
            this.targetCountInput.value = maxTarget;
        }
        
        // 시작 버튼 활성화/비활성화
        const canStart = selectedCount >= 2 && 
                        parseInt(this.targetCountInput.value) >= 1 && 
                        parseInt(this.targetCountInput.value) < selectedCount;
        
        this.startBtn.disabled = !canStart;
        
        // 게임 진행 중일 때는 입력 비활성화
        const gameRunning = window.gameEngine && 
                           window.gameEngine.getGameState() === 'running';
        
        this.targetCountInput.disabled = gameRunning;
        this.seedInput.disabled = gameRunning;
        
        // 참가자 선택 비활성화
        const participantItems = this.participantList.querySelectorAll('.participant-item');
        participantItems.forEach(item => {
            item.style.pointerEvents = gameRunning ? 'none' : 'auto';
            if (gameRunning) {
                item.style.opacity = '0.6';
            } else {
                item.style.opacity = '1';
            }
        });
    }
    
    // 이벤트 바인딩
    bindEvents() {
        // 전체 선택 버튼
        this.selectAllBtn.addEventListener('click', () => {
            this.toggleSelectAll();
        });
        
        // 목표 인원 수 입력
        this.targetCountInput.addEventListener('input', () => {
            this.updateUI();
        });
        
        // 시작 버튼
        this.startBtn.addEventListener('click', () => {
            this.handleStart();
        });
        
        // 일시정지/재개 버튼
        this.pauseBtn.addEventListener('click', () => {
            this.handlePause();
        });
        
        // 재시작 버튼
        this.restartBtn.addEventListener('click', () => {
            this.handleRestart();
        });
    }
    
    // 시작 처리
    handleStart() {
        if (!window.gameEngine) return;
        
        const selectedParticipants = DEFAULT_PARTICIPANTS.filter(p => 
            this.selectedParticipants.has(p.id)
        );
        
        const targetCount = parseInt(this.targetCountInput.value);
        const seed = this.seedInput.value.trim();
        
        if (selectedParticipants.length < 2 || targetCount < 1 || targetCount >= selectedParticipants.length) {
            alert('올바른 설정을 확인해주세요.');
            return;
        }
        
        window.gameEngine.start(selectedParticipants, targetCount, seed);
        this.updateUI();
    }
    
    // 일시정지/재개 처리
    handlePause() {
        if (!window.gameEngine) return;
        
        window.gameEngine.togglePause();
        this.updatePauseButton();
    }
    
    // 재시작 처리
    handleRestart() {
        if (!window.gameEngine) return;
        
        window.gameEngine.restart();
        this.updateUI();
    }
    
    // 일시정지 버튼 텍스트 업데이트
    updatePauseButton() {
        if (!window.gameEngine) return;
        
        const gameState = window.gameEngine.getGameState();
        if (gameState === 'paused') {
            this.pauseBtn.textContent = '재개';
        } else if (gameState === 'running') {
            this.pauseBtn.textContent = '일시정지';
        }
    }
    
    // 게임 상태 변경 시 UI 업데이트
    onGameStateChange(newState) {
        this.updateUI();
        this.updatePauseButton();
        
        // 게임 종료 시 입력 활성화
        if (newState === 'ended') {
            this.targetCountInput.disabled = false;
            this.seedInput.disabled = false;
            
            const participantItems = this.participantList.querySelectorAll('.participant-item');
            participantItems.forEach(item => {
                item.style.pointerEvents = 'auto';
                item.style.opacity = '1';
            });
        }
    }
    
    // 선택된 참가자 목록 반환
    getSelectedParticipants() {
        return DEFAULT_PARTICIPANTS.filter(p => this.selectedParticipants.has(p.id));
    }
    
    // 목표 인원 수 반환
    getTargetCount() {
        return parseInt(this.targetCountInput.value);
    }
    
    // 시드 반환
    getSeed() {
        return this.seedInput.value.trim();
    }
    
    // 사이드바 정리
    destroy() {
        // 이벤트 리스너 제거
        this.selectAllBtn.removeEventListener('click', this.toggleSelectAll);
        this.targetCountInput.removeEventListener('input', this.updateUI);
        this.startBtn.removeEventListener('click', this.handleStart);
        this.pauseBtn.removeEventListener('click', this.handlePause);
        this.restartBtn.removeEventListener('click', this.handleRestart);
    }
}
