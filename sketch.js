// 角色4攻擊動畫
let standAttackSheet;
const STAND_ATTACK_FRAMES = 6;
let standAttackFrameW, standAttackFrameH;
let standAttackFrameIndex = 0;
let standAttackFrameTimer = 0;
let standAttackFrameDelay = 3;
let standIsAttacking = false;
let isHitAndMoving = false;

// 武器角色
let toolSheet;
const TOOL_FRAMES = 8;
let toolFrameW, toolFrameH;
let toolFrameIndex = 0;
let toolFrameTimer = 0;
let toolFrameDelay = 6;
let toolActive = false;
let toolX = 0, toolY = 0;
let toolSpeed = 12;
let toolFacing = 1;
let gameState = 'start';
// Global quiz variables
let questions = [];
let quizTable; // 用來儲存 CSV 資料
let availableQuestions = [];
let currentQuestion;
let feedbackText = ""; // Used to show feedback temporarily
let questionsAnswered = 0;
const QUESTIONS_PER_BG = 3;
let isTransitioningLevel = false;
let transitionStep = 0;
let originalPosX;
let score = 0;
let timer = 5;
let startTime;
let finalTime = 0;
let waitingForNextQuestion = false;
let nextQuestionDelayTime = 0;

// Sprite and animation variables
const FRAMES = 8;
let walkSheet, runSheet, attackSheet;
let currentSheet;
let currentFrames = FRAMES;
let frameW, frameH;
let frameIndex = 0;
let frameDelay = 6;
let frameTimer = 0;

let posX, posY;
let speed = 4;
let scaleFactor = 3;
let facing = 1;

// Attack settings
const ATTACK_FRAMES = 16;
let attacking = false;
let prevSheet = null;
let prevFrames = FRAMES;

// NPC character (character 2)
let stopSheet;
let smileSheet;
let fallSheet;
const STOP_FRAMES = 7;
const SMILE_FRAMES = 8;
const FALL_FRAMES = 11;
let stopFrameW, stopFrameH;
let smileFrameW, smileFrameH;
let fallFrameW, fallFrameH;
let stopFrameIndex = 0;
let stopFrameTimer = 0;
let stopFrameDelay = 6;
let fallFrameIndex = 0;
let fallFrameTimer = 0;
let npcIsFalling = false;
let wasNear = false;

// New standing character (to the right of character 1)
let standSheet;
const STAND_FRAMES = 8;
let standFrameW, standFrameH;
let standFrameIndex = 0;
let standFrameTimer = 0;
let standFrameDelay = 6;
let standX;

// Dialogue and input
// let inputBox = null; // 移除輸入框
let btnO, btnX, startButton, replayButton; // 新增 O/X 按鈕與重玩按鈕
const nearThreshold = 250;

// Variables for cycling background
let bgImages = [];
let currentBgIndex = 0;
let canChangeBg = true;

function preload() {
    // Load quiz data from CSV
    quizTable = loadTable('quiz.csv', 'csv', 'header');

    // Load cycling background images from folder 3/
    bgImages.push(loadImage('3/01.jpg'));
    bgImages.push(loadImage('3/02.jpg'));
    bgImages.push(loadImage('3/03.png'));
    bgImages.push(loadImage('3/04.jpg'));

    // Load character sprites
    walkSheet = loadImage('1/走路/all 1.png');
    runSheet = loadImage('1/跑步/all 2.png');
    attackSheet = loadImage('1/揮刀/all 2.png');
    stopSheet = loadImage('2/stop/all stop.png');
    smileSheet = loadImage('2/smile/all smile.png');
    fallSheet = loadImage('2/fall/all fall.png');
    standSheet = loadImage('4/stand/all stand.png');
    standAttackSheet = loadImage('4/attack/all attack.png');
    toolSheet = loadImage('4/tool/all tool.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    noSmooth();

    // Player setup
    currentSheet = walkSheet;
    frameW = currentSheet.width / FRAMES;
    frameH = currentSheet.height;

    // NPC setup
    stopFrameW = stopSheet.width / STOP_FRAMES; 
    stopFrameH = stopSheet.height;
    smileFrameW = smileSheet.width / SMILE_FRAMES;
    smileFrameH = smileSheet.height;

    fallFrameW = fallSheet.width / FALL_FRAMES;
    fallFrameH = fallSheet.height;

    // Stand character setup (to the right of player)
    standFrameW = standSheet.width / STAND_FRAMES;
    standFrameH = standSheet.height;

    standAttackFrameW = standAttackSheet.width / STAND_ATTACK_FRAMES;
    standAttackFrameH = standAttackSheet.height;

    toolFrameW = toolSheet.width / TOOL_FRAMES;
    toolFrameH = toolSheet.height;

    posX = width / 2 + 100;
    posY = height * 0.8; // Lower character position to 80% of screen height
    originalPosX = posX; // 記錄初始位置
    standX = width / 2 + 350; // Fixed position for Character 4

    // 解析 CSV 資料到 questions 陣列
    for (let r = 0; r < quizTable.getRowCount(); r++) {
        let row = quizTable.getRow(r);
        questions.push({
            question: row.get('question'),
            answer: row.get('answer'),
            correct: row.get('correct_feedback'),
            wrong: row.get('wrong_feedback'),
            hint: row.get('hint')
        });
    }

    // 建立所有按鈕
    startButton = createButton('開始遊戲');
    startButton.position(width / 2 - 100, height / 2 + 50);
    startButton.size(200, 60);
    startButton.style('font-size', '24px');
    startButton.mousePressed(startGame);

    btnO = createButton('O 正確');
    btnO.size(100, 40);
    btnO.mousePressed(() => checkAnswer('O'));
    btnO.hide();
    
    btnX = createButton('X 錯誤');
    btnX.size(100, 40);
    btnX.mousePressed(() => checkAnswer('X'));
    btnX.hide();

    replayButton = createButton('再玩一次');
    replayButton.position(width / 2 - 100, height / 2 + 120);
    replayButton.size(200, 60);
    replayButton.style('font-size', '24px');
    replayButton.mousePressed(resetGame);
    replayButton.hide();
}

function startGame() {
    gameState = 'playing';
    startButton.hide();
    replayButton.hide();
    startTime = millis();
    askQuestion();
}
 
function askQuestion() {
    // 如果可用的問題池是空的，就從主問題列表重新填充
    if (availableQuestions.length === 0) {
        console.log("問題池已空，重新填充！");
        availableQuestions = [...questions]; // 使用展開運算符複製陣列
    }

    if (availableQuestions.length > 0) {
        // 從可用的問題中隨機選一個
        const questionIndex = floor(random(availableQuestions.length));
        currentQuestion = availableQuestions[questionIndex];

        // 從可用池中移除這個問題，避免重複
        availableQuestions.splice(questionIndex, 1);
        timer = 5; // 重置計時器
        feedbackText = ""; // Clear old feedback
    } else {
        console.error("沒有定義任何問題！");
        currentQuestion = null; // 確保不會出錯
    }
}

function checkAnswer(userAnswer) {
    if (!currentQuestion) return;

    let isCorrect = false;
    if (userAnswer === currentQuestion.answer) {
        isCorrect = true;
    }

    if (isCorrect) {
        score += 5; // 答對加5分
        feedbackText = currentQuestion.correct;
    } else {
        if (userAnswer === 'TIMEOUT') {
            feedbackText = "時間到！\n" + currentQuestion.wrong;
        } else {
            feedbackText = currentQuestion.wrong + "\n" + currentQuestion.hint;
        }
        
        // 答錯時觸發角色4攻擊
        if (!standIsAttacking && !toolActive) {
            standIsAttacking = true;
            standAttackFrameIndex = 0;
            standAttackFrameTimer = 0;
        }
    }

    // 無論答對答錯都算回答了一題
    questionsAnswered++;

    if (questionsAnswered >= QUESTIONS_PER_BG) {
        // 該關卡題目做完，觸發過場
        setTimeout(() => {
            isTransitioningLevel = true;
            transitionStep = 1; // 開始往右走
            feedbackText = "";
            btnO.hide();
            btnX.hide();
        }, 2000);
    } else {
        waitingForNextQuestion = true;
        nextQuestionDelayTime = millis() + 2000;
    }
}

function resetGame() {
    score = 0;
    currentBgIndex = 0;
    questionsAnswered = 0;
    posX = originalPosX;
    facing = 1;
    currentSheet = walkSheet;
    
    isTransitioningLevel = false;
    transitionStep = 0;
    waitingForNextQuestion = false;
    
    standIsAttacking = false;
    toolActive = false;
    isHitAndMoving = false;
    attacking = false;
    npcIsFalling = false;
    
    availableQuestions = []; 
    startGame();
}

function draw() {
    // Draw the current background image from the array
    image(bgImages[currentBgIndex], width / 2, height / 2, width, height);

    if (gameState === 'start') {
        // Draw start screen UI
        textAlign(CENTER, CENTER);
        textSize(60);
        fill(255);
        stroke(0);
        strokeWeight(4);
        text('生活常識大考驗', width / 2, height / 2 - 50);
        // The startButton is already displayed from setup()
    } else if (gameState === 'finished') {
        stroke(0);
        strokeWeight(4);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(40);
        text('恭喜通關！', width / 2, height / 2 - 60);
        textSize(30);
        text('總分: ' + score, width / 2, height / 2);
        let elapsed = (finalTime - startTime) / 1000;
        text('總時間: ' + nf(elapsed, 1, 1) + ' 秒', width / 2, height / 2 + 60);
        replayButton.show();
    } else if (gameState === 'playing') {

    if (waitingForNextQuestion) {
        if (millis() > nextQuestionDelayTime) {
            // 檢查是否所有動畫都結束且 NPC 站立 (包含攻擊、武器飛行、跌倒等狀態)
            let isBusy = standIsAttacking || toolActive || isHitAndMoving || attacking || npcIsFalling;
            if (!isBusy) {
                askQuestion();
                waitingForNextQuestion = false;
            }
        }
    }

    // --- Timer Logic ---
    // 只有在靠近NPC、非過場、且正在等待回答(無回饋文字)時倒數
    if (abs(posX - (width / 2 - 200)) < nearThreshold && !isTransitioningLevel && currentQuestion && feedbackText === "") {
        timer -= deltaTime / 1000;
        if (timer <= 0) {
            timer = 0;
            checkAnswer('TIMEOUT');
        }
    }

    // --- Draw Score and Timer ---
    textSize(24);
    textAlign(LEFT, TOP);
    text(`分數: ${score}`, 20, 20);
    text(`時間: ${nf(timer, 1, 1)}`, 20, 50);

    // --- 1. NPC (Character 2) Logic ---
    const npcPosX = width / 2 - 200;
    const npcPosY = posY;
    let isNear = abs(posX - npcPosX) < nearThreshold;

    // 當角色1靠近時，如果角色2是跌倒狀態，則恢復站立
    if (isNear && !wasNear && npcIsFalling) {
        npcIsFalling = false;
    }
    wasNear = isNear;

    let npcFacing = (posX < npcPosX) ? -1 : 1;

    // Draw NPC sprite
    push();
    translate(npcPosX, npcPosY);
    scale(npcFacing, 1);
    
    if (npcIsFalling) {
        image(fallSheet, 0, 0, fallFrameW * scaleFactor, fallFrameH * scaleFactor, fallFrameIndex * fallFrameW, 0, fallFrameW, fallFrameH);
        // Update Fall animation (play once and stop at last frame)
        fallFrameTimer++;
        if (fallFrameTimer >= stopFrameDelay) { // Reuse delay or define new one
            fallFrameTimer = 0;
            if (fallFrameIndex < FALL_FRAMES - 1) {
                fallFrameIndex++;
            }
        }
    } else {
        image(isNear ? smileSheet : stopSheet, 0, 0, (isNear ? smileFrameW : stopFrameW) * scaleFactor, (isNear ? smileFrameH : stopFrameH) * scaleFactor, (stopFrameIndex % (isNear ? SMILE_FRAMES : STOP_FRAMES)) * (isNear ? smileFrameW : stopFrameW), 0, (isNear ? smileFrameW : stopFrameW), (isNear ? smileFrameH : stopFrameH));
        // Update NPC animation
        stopFrameTimer++;
        if (stopFrameTimer >= stopFrameDelay) {
            stopFrameTimer = 0;
            stopFrameIndex++;
        }
    }
    pop();
    
    // --- 2. Dialogue and Input Logic ---
    let textToShow = "";
    const characterHeight = (isNear ? smileFrameH : stopFrameH) * scaleFactor;
    const textY = npcPosY - characterHeight / 2 - 10;
    
    if (isNear && !isTransitioningLevel) {
        textToShow = feedbackText || (currentQuestion ? currentQuestion.question : "Loading...");
        
        // --- UI for Player 1 Input ---
        const labelText = "請作答：";
        textSize(18); // Set size for accurate width measurement
        const labelWidth = textWidth(labelText);
        const PADDING = 15;
        // 計算按鈕區域寬度
        const buttonsWidth = 220; // 100(btn) + 20(gap) + 100(btn)
        const containerWidth = labelWidth + buttonsWidth + (PADDING * 3);
        const containerHeight = 40 + (PADDING * 2); // Button height is 40
        const containerX = posX - containerWidth / 2;
        const containerY = posY - (frameH * scaleFactor / 2) - containerHeight - 10; // 10px above head
        
        push();
        fill('#fff0f3');
        stroke(0);
        strokeWeight(1);
        rect(containerX, containerY, containerWidth, containerHeight, 10);
        pop();

        fill(0);
        noStroke();
        textAlign(LEFT, CENTER);
        const labelX = containerX + PADDING;
        const labelY = containerY + containerHeight / 2;
        text(labelText, labelX, labelY);

        // 設定按鈕位置並顯示
        const btnY = containerY + PADDING;
        btnO.position(labelX + labelWidth + PADDING, btnY);
        btnX.position(labelX + labelWidth + PADDING + 110, btnY); // 100 width + 10 gap

        // 只有在還沒回答(feedbackText為空)時才顯示按鈕
        if (feedbackText === "") {
            if (btnO.elt.style.display === 'none') {
                btnO.show();
                btnX.show();
            }
        } else {
            btnO.hide();
            btnX.hide();
        }
        
    } else {
        textToShow = "靠近我開始測驗！";
        if (btnO.elt.style.display !== 'none') {
            btnO.hide();
            btnX.hide();
        }
    }
    
    // Draw Dialogue Text for NPC
    textSize(20);
    
    // 繪製文字背景框以增加可讀性
    push();
    let lines = textToShow.split('\n');
    let maxW = 0;
    for (let line of lines) {
        let w = textWidth(line);
        if (w > maxW) maxW = w;
    }
    let boxW = maxW + 30;
    let boxH = lines.length * 28 + 10;
    
    rectMode(CENTER);
    fill(255, 240); // 半透明白色背景
    stroke(0);
    strokeWeight(2);
    rect(npcPosX, textY - boxH / 2 + 10, boxW, boxH, 10);
    pop();

    fill(0);
    noStroke();
    textAlign(CENTER, BOTTOM);
    text(textToShow, npcPosX, textY);


    // --- 3. Player (Character 1) Movement ---
    // If attacking, skip movement but continue drawing other elements
    let moving = false;
    
    if (isTransitioningLevel) {
        // --- 過場動畫邏輯 ---
        if (transitionStep === 1) {
            // 步驟1：往右走出螢幕
            const targetX = width + 100;
            if (posX < targetX) {
                posX += speed;
                facing = 1;
                currentSheet = runSheet;
                moving = true;
            } else {
                // 到達右邊緣，切換背景並重置位置到左邊
                if (currentBgIndex === bgImages.length - 1) {
                    gameState = 'finished';
                    finalTime = millis();
                    return;
                }

                currentBgIndex = (currentBgIndex + 1) % bgImages.length;
                questionsAnswered = 0;
                posX = -100; // 從左邊外側開始
                transitionStep = 2;
            }
        } else if (transitionStep === 2) {
            // 步驟2：從左邊走回原位
            if (posX < originalPosX) {
                posX += speed;
                facing = 1;
                currentSheet = runSheet;
                moving = true;
            } else {
                // 到達原位，結束過場，開始新題目
                isTransitioningLevel = false;
                transitionStep = 0;
                currentSheet = walkSheet;
                askQuestion();
            }
        }
    } else if (isHitAndMoving) {
        // 自動走向角色2 (NPC)
        const targetX = npcPosX + 120; // 停在 NPC 右側一點的位置
        const dist = targetX - posX;
        
        if (abs(dist) > speed) {
            posX += (dist > 0 ? speed : -speed);
            facing = (dist > 0 ? 1 : -1);
            currentSheet = runSheet; // 使用跑步動作
            moving = true;
        } else {
            // 到達目標，開始攻擊
            isHitAndMoving = false;
            attacking = true;
            currentSheet = attackSheet;
            frameIndex = 0;
            frameTimer = 0;
        }
    } else if (!attacking) {
        if (keyIsDown(RIGHT_ARROW)) {
            currentSheet = runSheet;
            facing = 1;
            posX += speed;
            moving = true;
        } else if (keyIsDown(LEFT_ARROW)) {
            currentSheet = walkSheet;
            facing = -1;
            posX -= speed;
            moving = true;
        } else {
            frameIndex = 0;
        }
    }
    
    currentFrames = (currentSheet === attackSheet) ? ATTACK_FRAMES : FRAMES;
    frameW = currentSheet.width / currentFrames;
    frameH = currentSheet.height;

    if (!isTransitioningLevel) {
        posX = constrain(posX, (frameW*scaleFactor)/2, width - (frameW*scaleFactor)/2);
    }

    // Draw player sprite
    push();
    translate(posX, posY);
    scale(facing, 1);
    image(currentSheet, 0, 0, frameW * scaleFactor, frameH * scaleFactor, frameIndex * frameW, 0, frameW, frameH);
    pop();

    if (moving || attacking) {
        frameTimer++;
        if (frameTimer >= frameDelay) {
            frameTimer = 0;
            if (attacking) {
                frameIndex++;
                
                // 當攻擊動作播放到一半(第8格)時，觸發NPC跌倒
                if (frameIndex === 8 && !npcIsFalling) {
                    npcIsFalling = true;
                    fallFrameIndex = 0;
                    fallFrameTimer = 0;
                }

                if (frameIndex >= currentFrames) {
                    attacking = false;
                    currentSheet = walkSheet;
                    frameIndex = 0;
                }
            } else {
                frameIndex = (frameIndex + 1) % currentFrames;
            }
        }
    }
    // --- Draw new standing character to the right of Player (Character 1) ---

    // --- 角色4動畫切換 ---
    if (standIsAttacking) {
        push();
        translate(standX, posY);
        image(standAttackSheet, 0, 0, standAttackFrameW * scaleFactor, standAttackFrameH * scaleFactor, standAttackFrameIndex * standAttackFrameW, 0, standAttackFrameW, standAttackFrameH);
        pop();

        standAttackFrameTimer++;
        if (standAttackFrameTimer >= standAttackFrameDelay) {
            standAttackFrameTimer = 0;
            standAttackFrameIndex++;

            // 播放完6格後，產生武器並重置攻擊狀態
            if (standAttackFrameIndex >= STAND_ATTACK_FRAMES) {
                // 產生武器
                toolActive = true;
                toolX = standX; // 從角色4的位置產生
                toolY = posY;
                // 計算朝向角色1的方向
                toolFacing = (posX < standX) ? -1 : 1;
                toolFrameIndex = 0;
                toolFrameTimer = 0;
                // 重置攻擊狀態
                standIsAttacking = false;
                standAttackFrameIndex = 0;
            }
        }
    } else {
        push();
        translate(standX, posY);
        image(standSheet, 0, 0, standFrameW * scaleFactor, standFrameH * scaleFactor, standFrameIndex * standFrameW, 0, standFrameW, standFrameH);
        pop();

        standFrameTimer++;
        if (standFrameTimer >= standFrameDelay) {
            standFrameTimer = 0;
            standFrameIndex = (standFrameIndex + 1) % STAND_FRAMES;
        }
    }

    // --- 武器角色動畫與移動 ---
    if (toolActive) {
        push();
        translate(toolX, toolY);
        scale(toolFacing, 1); // 依照發射方向翻轉圖片
        image(toolSheet, 0, 0, toolFrameW * scaleFactor, toolFrameH * scaleFactor, toolFrameIndex * toolFrameW, 0, toolFrameW, toolFrameH);
        pop();
        toolX += toolSpeed * toolFacing; // 依照方向移動
        toolFrameTimer++;
        if (toolFrameTimer >= toolFrameDelay) {
            toolFrameTimer = 0;
            toolFrameIndex = (toolFrameIndex + 1) % TOOL_FRAMES;
        }
        
        // 碰撞偵測：當武器碰到角色1時
        if (abs(toolX - posX) < 100 && !attacking && !isHitAndMoving) {
            isHitAndMoving = true; // 觸發自動移動狀態
            toolActive = false; // 武器擊中後消失
        }

        // 超出畫面則消失 (左右邊界都判斷)
        if (toolX > width + toolFrameW * scaleFactor || toolX < -toolFrameW * scaleFactor) {
            toolActive = false;
        }
    }
    }
}

function keyPressed() {
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    if (gameState === 'start') {
        startButton.position(width / 2 - 100, height / 2 + 50);
    } else if (gameState === 'finished') {
        replayButton.position(width / 2 - 100, height / 2 + 120);
    }
    posY = height * 0.8; // Adjust Y position on resize as well
}