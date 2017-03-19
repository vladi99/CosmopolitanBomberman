function createGame(selector) {
    const CELL_SIZE = 37;
    const WALL_CHAR = '*';
    const BRICK_CHAR = '-';

    let canvas = document.querySelector(selector);
    let ctx = canvas.getContext('2d');
    let hero = new Image();
    let bomb = document.getElementById('bomb-image');
    let exitGate = new Image();
    let bombarmanEnemy = new Image();
    let door = { x: 1, y: 1, isDoorPlaced: false };

    let wall = document.getElementById('wall-image');
    let brick = document.getElementById('brick-image');
    const bombCanvas = document.getElementById('bomb-canvas'),
        ctxBomb = bombCanvas.getContext('2d');

    bombCanvas.style.backgroundColor = 'green';
    bombCanvas.style.border = '1px solid blue';

    const enemyDefaultSpeed = 1;
    const wallOffset = 20;
    const bombPixels = 60;

    const field = [
        "***************************",
        "*                         *",
        "* * * * * * * * * * * * * *",
        "*                         *",
        "* * * * * * * * * * * * * *",
        "*                         *",
        "* * * * * * * * * * * * * *",
        "*                         *",
        "* * * * * * * * * * * * * *",
        "*                         *",
        "* * * * * * * * * * * * * *",
        "*                         *",
        "* * * * * * * * * * * * * *",
        "*                         *",
        "***************************"
    ];


    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    (function putBricksRandomly(matrix) {
        for (let i = 0; i < 50; i += 1) {
            // debugger;
            let row = getRandomInt(1, 14);
            let col = getRandomInt(1, 26);
            // debugger;
            if (row % 2 === 0 || col % 2 === 0) {
                i -= 1;
                continue;
            } else {
                matrix[row] = matrix[row].substr(0, col) + BRICK_CHAR + matrix[row].substr(col + 1);
            }

            if (door.isDoorPlaced === false) {
                door.x = col;
                door.y = row;
                door.isDoorPlaced = true;
            }
        }
    })(field);

    let nonWalkables = [];

    for (let i = 0; i < field.length; i++) {
        for (let j = 0; j < field[0].length; j++) {
            let symbol = field[i][j];
            if (symbol === WALL_CHAR) {
                ctxBomb.drawImage(wall, 0, 0, wall.width, wall.height, j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                nonWalkables.push({x: CELL_SIZE * j, y: CELL_SIZE * i});
            } else if (symbol === BRICK_CHAR) {
                ctxBomb.drawImage(brick, 0, 0, brick.width, brick.height, j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                nonWalkables.push({x: CELL_SIZE * j, y: CELL_SIZE * i});
            }

        }
    }

    let bomberManPhysicalBody = {
        x: CELL_SIZE,
        y: CELL_SIZE * 3,
        size: CELL_SIZE,
        speed: CELL_SIZE / 4,
        bomb: 3
    };

    const bomberman = createBomberman({
        context: ctx,
        width: CELL_SIZE,
        height: CELL_SIZE,
    });

    let enemy = {
        x: CELL_SIZE,
        y: CELL_SIZE,
        size: 15,
        speed: 3,
        moveRight: true,
        moveLeft: false
    };

    let dir = 0;
    let keyCodeDirs = {
        37: 2,
        38: 3,
        39: 0,
        40: 1
    };

    let dirDeltas = [{
            x: +bomberManPhysicalBody.speed,
            y: 0
        },
        {
            x: 0,
            y: +bomberManPhysicalBody.speed
        },
        {
            x: -bomberManPhysicalBody.speed,
            y: 0
        },
        {
            x: 0,
            y: -bomberManPhysicalBody.speed
        }
    ];
    /*
     0 => right
     1 => down
     2 => left
     3 => up
     */
    let lastCoordinates = { x: bomberManPhysicalBody.x, y: bomberManPhysicalBody.y };
    document.body.addEventListener("keydown", function(ev) {
        if (!keyCodeDirs.hasOwnProperty(ev.keyCode)) {
            return;
        }

        bomberman.update = bomberman.lastUpdate;

        dir = keyCodeDirs[ev.keyCode];
        updateBomberManPosition(bomberManPhysicalBody, canvas, dirDeltas, dir);
        bomberman.updateSprite(dir);
    });

    // placing bombs
    document.body.addEventListener("keydown", function(ev) {
        if (ev.keyCode === 32 && bomberManPhysicalBody.bomb > 0) {
            bomb.src = '../Images/bomb.png';
            ctxBomb.drawImage(bomb, bomberManPhysicalBody.x, bomberManPhysicalBody.y);
            bomberManPhysicalBody.bomb -= 1;

            setTimeout(function() {
                //TODO Bomb should explode
                alert('boom');
                ctxBomb.clearRect(0, 0, bomberManPhysicalBody.x, bomberManPhysicalBody.y);
            }, 3000);
        }
    });

    document.body.addEventListener('keyup', function(ev) {
        const keyCodes = [37, 38, 39, 40];

        if (keyCodes.indexOf(ev.keyCode) >= 0) {
            bomberman.update = function() {};
        }
    });

    function gameLoop() {
        ctx.clearRect(0, 0, 1000, 800);
        //drawBomberMan();
        bomberman.render({ x: bomberManPhysicalBody.x, y: bomberManPhysicalBody.y }).update();
        //TODO function to be invoked when the block is BLOWN!
        //drawExitGate(exitGate, ctx, door);
        generateEnemy(bombarmanEnemy, ctx, enemy);
        updateEnemyPosition(bombarmanEnemy);
        if (isColide(bomberManPhysicalBody, enemy)) {
            //TODO Game Over
        }
        window.requestAnimationFrame(gameLoop);
    }

    // void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

    function isBetween(item, bound1, bound2) {
        if ((item >= bound1 && item <= bound2) ||
            (item <= bound1 && item >= bound2)) {
            return true;
        }

        return false;
    }

    function isColide(bomberMan, item) {
        if (isBetween(item.x, bomberMan.x + bomberMan.size, bomberMan.x) &&
            isBetween(item.y, bomberMan.y, bomberMan.y + bomberMan.size)) {
            return true;
        }

        return false;
    }

    function drawBomberMan() {
        hero.src = '../Images/bombermanTest.png';
        ctx.drawImage(hero, 0, 18, hero.width, hero.height - 18, bomberMan.x, bomberMan.y, hero.width, hero.height - 18);
    }

    function updateEnemyPosition(bombarmanEnemy) {
        bombarmanEnemy.src = '../Images/enemy.png';

        checkForOutOfBoundaries(enemy);

        if (enemy.moveRight === true && enemy.moveLeft === false) {
            enemy.x += enemyDefaultSpeed;
        }
        if (enemy.moveRight === false && enemy.moveLeft === true) {
            enemy.x -= enemyDefaultSpeed;
        }

        ctx.drawImage(bombarmanEnemy, enemy.x, enemy.y);

        function checkForOutOfBoundaries(enemy) {
            if (enemy.x > canvas.width - wallOffset) {
                enemy.moveRight = false;
                enemy.moveLeft = true;
            }
            if (enemy.x < 0) {
                enemy.moveRight = true;
                enemy.moveLeft = false;
            }
        }
    }

    return {
        start: gameLoop(),
        // loadMaze: putBricksRandomly(field)
    };
}