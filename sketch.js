// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 確保這是全域變數
let finalScore = 0;
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 用於儲存煙火物件的陣列
let fireworks = [];
// 重力變數
let gravity;

window.addEventListener('message', function (event) {
    // 這裡可以加入來源驗證，確保訊息是來自可信的來源
    // if (event.origin !== "https://your-h5p-domain.com") return;

    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score;
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫 p5.js 的 loop() 來啟動動畫
        // ----------------------------------------
        if (typeof loop === 'function') {
            loop(); // 啟動 draw() 迴圈以播放動畫
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    gravity = createVector(0, 0.2); // 設定重力向量
    background(0); // 初始背景設為黑色，適合煙火
    
    // 預設情況下不循環繪製，直到收到分數
    noLoop(); 
} 

// =================================================================
// Particle 類別 (組成煙火的粒子)
// =================================================================
class Particle {
    constructor(x, y, hu, isFirework) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework; // 判斷是上升的火箭還是爆炸的粒子
        this.lifespan = 255; // 生命週期，用於淡出效果
        this.hu = hu; // 顏色 (色相)
        this.acc = createVector(0, 0);

        if (this.isFirework) {
            // 如果是上升的火箭，給予向上的初速度
            this.vel = createVector(0, random(-14, -8));
        } else {
            // 如果是爆炸後的粒子，給予隨機方向的速度
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 12)); // 爆炸力道
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            this.vel.mult(0.95); // 模擬空氣阻力
            this.lifespan -= 4; // 生命週期遞減
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
    
    isDone() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB); // 使用 HSB 模式更容易控制顏色
        if (!this.isFirework) {
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan); // 帶透明度的粒子
        } else {
            strokeWeight(4);
            stroke(this.hu, 255, 255); // 實心的火箭
        }
        point(this.pos.x, this.pos.y);
    }
}

// =================================================================
// Firework 類別 (管理單個煙火從發射到爆炸的整個過程)
// =================================================================
class Firework {
    constructor() {
        this.hu = random(255); // 隨機選擇一個顏色
        this.firework = new Particle(random(width), height, this.hu, true); // 從底部隨機位置發射
        this.exploded = false;
        this.particles = [];
    }

    isDone() {
        return this.exploded && this.particles.length === 0;
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();
            
            // 當火箭速度變為向上時，引爆
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].isDone()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    explode() {
        // 產生 100 個爆炸後的粒子
        for (let i = 0; i < 100; i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        for (let p of this.particles) {
            p.show();
        }
    }
}


function draw() { 
    // 計算百分比，並處理 maxScore 為 0 的情況避免除以零
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;

    // =================================================================
    // 主要邏輯：根據分數百分比決定顯示內容
    // =================================================================
    if (percentage >= 90) {
        // --- 顯示煙火特效 ---
        colorMode(RGB);
        background(0, 0, 0, 25); // 使用半透明背景製造拖影效果

        // 每幀都有機率產生一個新的煙火
        if (random(1) < 0.04) {
            fireworks.push(new Firework());
        }
        
        // 更新並顯示所有煙火
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].isDone()) {
                fireworks.splice(i, 1);
            }
        }
        
        // 也可以在這裡疊加一個恭喜的文字
        textSize(60);
        textAlign(CENTER, CENTER);
        fill(255, 215, 0, 200); // 金色帶透明度
        text("太棒了！成績優異！", width / 2, height / 2);
        
    } else {
        // --- 顯示一般成績畫面 ---
        colorMode(RGB);
        background(255); // 清除背景
        textAlign(CENTER);
        
        // A. 根據分數區間改變文本顏色和內容
        if (percentage >= 60) {
            fill(255, 181, 35); 
            textSize(40);
            text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        } else if (percentage > 0) {
            fill(200, 0, 0); 
            textSize(40);
            text("需要加強努力！", width / 2, height / 2 - 50);
        } else {
            fill(150);
            textSize(30);
            // 如果還沒有分數，顯示提示文字
            text(scoreText || "等待成績中...", width / 2, height / 2);
        }

        // 顯示具體分數
        textSize(50);
        fill(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
        
        // B. 根據分數觸發不同的幾何圖形反映
        if (percentage >= 60) {
            fill(255, 181, 35, 150);
            rectMode(CENTER);
            rect(width / 2, height / 2 + 150, 150, 150);
        }
        
        // 因為不是煙火動畫，處理完畢就停止繪圖，節省效能
        noLoop(); 
    }
}
