// 게임 설정 파일
export const DEFAULT_PARTICIPANTS = [
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

export const CONFIG = {
    // 캔버스 설정
    canvas: { 
        width: 1024, 
        height: 640, 
        margin: 24 
    },
    
    // 참가자 설정
    participants: DEFAULT_PARTICIPANTS,
    
    // 세포 크기 설정
    initialRadius: 14,        // 초기 반지름
    minRadius: 8,            // 최소 반지름
    maxRadius: 64,           // 최대 반지름
    
    // 속도 설정
    baseSpeed: 1.6,          // 기본 이동속도 (px/frame)
    speedItemMultiplier: 2.0, // 스피드 아이템 배율
    speedDurationMs: 6000,   // 스피드 지속시간 (6초)
    
    // 표창(공격) 설정
    shurikenDurationMs: 5000, // 표창 지속시간 (5초)
    
    // 부활 설정
    reviveInvincibleMs: 800,  // 부활 직후 무적시간 (0.8초)
    
    // 게임 시간 설정
    timeLimitSec: 0,         // 제한시간 (0이면 무한)
    
    // 아이템 설정
    itemSpawnIntervalMs: 1500, // 아이템 스폰 주기 (1.5초)
    itemLifetimeMs: 12000,    // 아이템 수명 (12초)
    itemRadius: 10,           // 아이템 크기
    
    // 아이템 스폰 가중치 (합=1 권장)
    itemWeights: {
        speed: 0.45,          // 스피드 45%
        revive: 0.25,         // 부활 25%
        shuriken: 0.30        // 표창 30%
    },
    
    // AI 설정
    ai: {
        turnEveryMs: [600, 1400],  // 방향전환 주기 범위 (0.6~1.4초)
        jitter: 0.35,              // 약간의 방향 흔들림
        avoidWallsBias: 0.7        // 벽 회피 성향
    },
    
    // 난수 생성기 설정
    rngSeed: "",              // 빈 문자열이면 시간 기반, 값이 있으면 고정 시드
    
    // 성능 설정
    frameCap: 60              // requestAnimationFrame 기준 상한
};
