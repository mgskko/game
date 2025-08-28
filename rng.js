// 시드 기반 난수 생성기 (Linear Congruential Generator)
class RNG {
    constructor(seed = null) {
        if (seed === null || seed === "") {
            // 시드가 없으면 현재 시간 기반
            this.seed = Date.now();
        } else {
            // 문자열 시드를 숫자로 변환
            this.seed = this.hashString(seed);
        }
        this.current = this.seed;
    }
    
    // 문자열을 해시하여 숫자로 변환
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        return Math.abs(hash);
    }
    
    // 0~1 사이의 난수 생성
    random() {
        // LCG: X(n+1) = (a * X(n) + c) mod m
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        
        this.current = (a * this.current + c) % m;
        return this.current / m;
    }
    
    // min ~ max 사이의 난수 생성 (정수)
    randRange(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
    
    // min ~ max 사이의 난수 생성 (실수)
    randFloat(min, max) {
        return this.random() * (max - min) + min;
    }
    
    // 배열에서 랜덤 선택
    choice(array) {
        if (array.length === 0) return null;
        return array[Math.floor(this.random() * array.length)];
    }
    
    // 가중치 기반 선택
    weightedChoice(choices, weights) {
        if (choices.length === 0) return null;
        if (choices.length !== weights.length) {
            throw new Error("Choices and weights arrays must have the same length");
        }
        
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = this.random() * totalWeight;
        
        for (let i = 0; i < choices.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return choices[i];
            }
        }
        
        return choices[choices.length - 1]; // 부동소수점 오차 방지
    }
    
    // 시드 재설정
    reset() {
        this.current = this.seed;
    }
    
    // 새로운 시드 설정
    setSeed(newSeed) {
        if (newSeed === null || newSeed === "") {
            this.seed = Date.now();
        } else {
            this.seed = this.hashString(newSeed);
        }
        this.current = this.seed;
    }
}

export { RNG };
