/* Key-mapping to Display Grid
                                    V-- Columns --V
    +---+--------+-----+------+---+---+---+-------+---+---+----+------+----+-----+-----------+
    | 0 |    1   |  2  |   3  | 4 | 5 | 6 |   7   | 8 | 9 | 10 |  11  | 12 |  13 |     14    |
    +---+--------+-----+------+---+---+---+-------+---+---+----+------+----+-----+-----------+
    | 1 |   Esc  |  1  |   2  | 3 | 4 | 5 |   6   | 7 | 8 |  9 |   0  |  - |  =  | backspace |
R   +---+--------+-----+------+---+---+---+-------+---+---+----+------+----+-----+-----------+
O   | 2 |   tab  |  q  |   w  | e | r | t |   y   | u | i |  o |   p  |  [ |  ]  |     \     |
W   +---+--------+-----+------+---+---+---+-------+---+---+----+------+----+-----+-----------+
    | 3 |  caps  |  a  |   s  | d | f | g |   h   | j | k |  l |   ;  |  ' |     |   enter   |
    +---+--------+-----+------+---+---+---+-------+---+---+----+------+----+-----+-----------+
    | 4 | lShift |     |   z  | x | c | v |   b   | n | m |  , |   .  |  / |     |   rShift  |
    +---+--------+-----+------+---+---+---+-------+---+---+----+------+----+-----+-----------+
    | 5 |  lCtrl | win | lAlt |   |   |   | Space |   |   |    | rAlt | fn | fn2 |   rCtrl   |
    +---+--------+-----+------+---+---+---+-------+---+---+----+------+----+-----+-----------+
*/


// Takes care of Obstacles and some colors
//Columns          1  2  3  4  5  6  7  8  9  10  11  12  13  14        Rows
let gameGrid = [ [ 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0],    // 1
                 [ 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0],    // 2
                 [ 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0],    // 3
                 [ 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0],    // 4
                 [ 3, 3, 3, 3, 3, 3, 3, 3, 3,  3,  3,  3,  3,  3]   ] // 5

// 0 = Background
// 1 = Player
// 2 = Obstacles
// 3 = Green Ground
// 4 = Game Over Red
let colorCodes = [[0,0,0],
                  [0,255,255],
                  [255,0,255],
                  [0,255,0],
                  [255,0,0]]

// Probability Bias
// Higher probability = Low Chance of spawn
let probBias = [100,  // Floor 4
                75,  // Floor 3
                50,  // Floor 2
                10,] // Floor 1

// Style Config
canvasScale = 40
let cnv = 0;
let isEnabled = true;

// Game Config
let lastSpawnFrame = 0
let spawnDelay = [3,3,3,4] // spawns obstacle after lastSpawn + spawnDelay

let playerStartPos = [3,3] // Denoted as (x,y)
let playerPos = [3,3]
let isJumping = false
let jumpStartFrame = 0
let jumpHeight = [0,1,2,1,0]

let isGameOver = false
let goAnimStep = 0;

let scoreDisplay = 0;

// Frame Rate mapping with Frame Count
let frameLevel = [0,200,400,800,1600,3200,6400]
let fpsLevel =   [5,  6,  7,  8,   9,   9,   9]

function toggleBridge(){
    isEnabled = !isEnabled
    if(isEnabled){
        document.getElementById("toggleButton").innerHTML = "Pause"
        document.getElementById("toggleButton").style.backgroundColor = 'red'
    }else{
        document.getElementById("toggleButton").innerHTML = "Resume"
        document.getElementById("toggleButton").style.backgroundColor = '#1ec94c'
    }
}

function setup(){
    cnv = createCanvas(14*canvasScale,5*canvasScale);
    scoreDisplay = document.getElementById("score");
}

// Bridge to the node app
const socket = io('http://localhost:2930')

function sendGrid(colorGrid){
    socket.emit('color-grid',colorGrid)
}

function draw(){
    background(0);

    // Calculating Canvas FPS
    currentFPS = fpsLevel[0]
    for(let i = 0; i < frameLevel.length-1; i++){
        if(frameCount < frameLevel[i+1]){
            currentFPS = fpsLevel[i]
            break;
        }
    }
    frameRate(currentFPS);

    //Game Code
    if(!isGameOver && isEnabled){

        //Jump Calculations
        if(isJumping){
            if(frameCount - jumpStartFrame < jumpHeight.length){
                playerPos[1] = playerStartPos[1] - jumpHeight[frameCount - jumpStartFrame];
            }
            else{
                isJumping = false;
            }
        }
        
        // Shifting & Appending
        for(let i = 0; i < 4; i++){
            //Shifting the board
            gameGrid[i].shift();

            // Appending based on probability of obstacle
            obstacleProb = Math.floor(Math.random() * probBias[i])
            if(obstacleProb == 5 && lastSpawnFrame + spawnDelay[i] < frameCount){
                // Appending obstacle
                gameGrid[i].push(2);
                lastSpawnFrame = frameCount
            }
            else{
                // Appending background
                gameGrid[i].push(0);
            }
        }

        // Updating score
        scoreDisplay.innerHTML = "Score : " + frameCount

    }else if(isGameOver){
        frameRate(5);
        // Animation : Chaning colors at player to indicate death
        for(let k = playerPos[1]-1; k <= playerPos[1]+1;k++){
            for(let l = playerPos[0]-1;l <= playerPos[0]+1;l++){
                if(k > -1 && k < 5 && l > -1 && l < 14){
                    gameGrid[k][l] = (goAnimStep % 2) * 4
                }
            }
        }
        goAnimStep++;
    }

    // Player Obstacle Collision Detection
    if (gameGrid[playerPos[1]][playerPos[0]] == 2){
        isGameOver = true;
        console.log("Game Over!");
    }

    // Render game board on canvas
    for(let j = 0; j < 5; j++){
        for(let i = 0; i < 14; i++){
            fill(colorCodes[gameGrid[j][i]]);
            if(i == playerPos[0] && j == playerPos[1] && !isGameOver){
                fill(colorCodes[1]);
            }
            rect(i * (width/14), j * (height/5), (width/14), (height/5));
        }
    }

    //fill(255,0,0);
    //circle(mouseX,mouseY,100);
    
    // Build up Grid from canvas colors
    let renderGrid = []
    for(let j = 0; j < height; j += height/5){
        gridRow = []
        for(let i = 0; i < width; i += width/14){
            x = i + (width/14) / 2
            y = j + (height/5) / 2

            let color = cnv.get(x,y)
            gridRow.push( [ color[0],color[1],color[2] ] )
            
            //Debug
            fill(255);
            circle(x,y,7);
        }
        renderGrid.push(gridRow);
    }

    // Send Grid
    if(isEnabled){
        sendGrid(renderGrid)
    }
}

function keyPressed(){
    // Detecting Jump
    if(keyCode == 32 && !isJumping){
        jumpStartFrame = frameCount;
        isJumping = true;
        console.log("Jump Detected");
    }
    if(keyCode == 32 && isGameOver){
        location.reload();
    }
}