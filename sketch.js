// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0;
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// Array to hold our fireworks
let fireworks = [];
// Gravity variable
let gravity;

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;

    if (data && data.type === 'H5P_SCORE_RESULT') {

        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;

        console.log("新的分數已接收:", scoreText);

        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製
        // ----------------------------------------
        if (typeof redraw === 'function') {
            loop(); // Start the draw loop to see animations
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() {
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2);
    gravity = createVector(0, 0.2);
    background(0);
}

// Particle class for the fireworks
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hu;

        if (this.firework) {
            this.vel = createVector(0, random(-12, -8));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9);
            this.lifespan -= 4;
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    done() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB);
        if (!this.firework) {
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
    }
}

// Firework class
class Firework {
    constructor() {
        this.hu = random(255);
        this.firework = new Particle(random(width), height, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }

    done() {
        return this.exploded && this.particles.length === 0;
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();

            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }
}


function draw() {
    colorMode(RGB);
    background(0, 0, 0, 25); // Add a trail effect

    // Calculate percentage
    let percentage = (finalScore / maxScore) * 100;

    if (finalScore === 100 && maxScore === 100) {
        if (random(1) < 0.03) {
            fireworks.push(new Firework());
        }

        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) {
                fireworks.splice(i, 1);
            }
        }
        // Optionally, display a congratulatory message
        textSize(80);
        textAlign(CENTER, CENTER);
        fill(255, 215, 0); // Gold color
        text("恭喜！滿分！", width / 2, height / 2);
    } else {
        background(255); // Clear background for other scores
        textSize(80);
        textAlign(CENTER);

        // -----------------------------------------------------------------
        // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
        // -----------------------------------------------------------------
        if (percentage >= 90) {
            fill(0, 200, 50);
            text("恭喜！優異成績！", width / 2, height / 2 - 50);
        } else if (percentage >= 60) {
            fill(255, 181, 35);
            text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        } else if (percentage >= 0) {
            fill(200, 0, 0);
            text("需要加強努力！", width / 2, height / 2 - 50);
        } else {
            fill(150);
            text(scoreText || "等待成績中...", width / 2, height / 2);
        }

        // 顯示具體分數
        textSize(50);
        fill(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);

        // -----------------------------------------------------------------
        // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
        // -----------------------------------------------------------------
        if (percentage >= 90) {
            fill(0, 200, 50, 150);
            noStroke();
            circle(width / 2, height / 2 + 150, 150);
        } else if (percentage >= 60) {
            fill(255, 181, 35, 150);
            rectMode(CENTER);
            rect(width / 2, height / 2 + 150, 150, 150);
        }
        noLoop(); // Stop the draw loop if not a perfect score
    }
}
