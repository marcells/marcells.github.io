var PONGGERS = {};

PONGGERS.Helpers = (function() {
    return {
        stayOnTable: function(table, player) {
            var maximumPlayerYValue = table.geometry.height / 2.0 - player.geometry.height / 2;

            if(player.position.y > maximumPlayerYValue) {
                player.position.y = maximumPlayerYValue;
            }

            if(player.position.y < maximumPlayerYValue * -1) {
                player.position.y = maximumPlayerYValue *-1;
            }
        }
    };
})();

PONGGERS.HumanPlayer = function(gameOptions, table, player, keyboard, up, down) {
    var privates = {
        gameOptions: gameOptions,
        table: table,
        player: player,
        keyboard: keyboard,
        up: up,
        down: down
    };

    this.update = function() {
        var speed = gameOptions.playerSpeed;

        var ifKeyPressedMovePlayer = function(key, player, direction) {
            if (keyboard.pressed(key)) {
                player.position.y += (direction === "up" ? speed : -speed);
            }
        };

        ifKeyPressedMovePlayer(privates.up, privates.player, "up");
        ifKeyPressedMovePlayer(privates.down, privates.player, "down");

        PONGGERS.Helpers.stayOnTable(privates.table, privates.player);
    };
};

PONGGERS.AiPlayer = function(gameOptions, table, ball, player) {
    var privates = {
        gameOptions: gameOptions,
        table: table,
        ball: ball,
        player: player
    };

    this.update = function() {
        var speed = gameOptions.playerSpeed;

        var moveIntoDirectionOfBall = function(ball, player) {
            var ballDifference = player.position.y - ball.position.y;

            if(Math.abs(player.position.x - ball.position.x) < 500 && Math.abs(ballDifference) > speed) {
                if(ballDifference > 0) {
                    player.position.y -= speed;
                }
                else {
                    player.position.y += speed;
                }
            }
        };

        moveIntoDirectionOfBall(privates.ball, privates.player);
        PONGGERS.Helpers.stayOnTable(privates.table, privates.player);
    };
};

PONGGERS.main = (function() {
    var game = { };
    var meshes = { };
    var gameOptions = { 
        defaultSpeedX : 5, 
        defaultSpeedY : -5, 
        playerSpeed : 10 };

    var currentCameraIndex = 1, allCameras = ['table', 'top'];
    var incX, incY;
    
    var load = function() {
        init();
        animate();
    };

    var init = function() {
        game.clock = new THREE.Clock();
        game.keyboard = new THREEx.KeyboardState();
        game.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
        game.scene = new THREE.Scene();

        game.renderer = new THREE.WebGLRenderer( { antialias: true} );
        game.renderer.setSize(window.innerWidth - 350, window.innerHeight );

        addGameElements(game.scene);
        
        setCamera('table');
        game.controls = new THREE.TrackballControls(game.camera);
        game.controls.target.set(0, 0, 0);

        resetBall(meshes.ball, gameOptions);

        setPlayer('human');
        setOpponent('computer');

        document.getElementById('game').appendChild(game.renderer.domElement);
    }

    var animate = function() {
        requestAnimationFrame(animate);

        moveAndRotateBall(meshes.ball);
        checkAndCorrectIfBallIsOnTable(meshes.ball);
        
        render();
    }

    var render = function() {
        game.controls.update(game.clock.getDelta());
        game.playerOne.update();
        game.playerTwo.update();

        game.renderer.render(game.scene, game.camera);
    }

    var setCamera = function(target) {
        var cameraSettings = {
            table : function() { 
                game.camera.position.set(-100, -1000, 500);
            },
            top : function() { 
                game.camera.position.set(0, 0, 1000);
            }
        };

        cameraSettings[target]();
        game.camera.lookAt(game.scene.position);
    }

    var nextCamera = function() {
        var currentCamera = allCameras[currentCameraIndex++];

        if(currentCameraIndex >= allCameras.length) {
            currentCameraIndex = 0;
        }

        setCamera(currentCamera);
    }

    setPlayer = function(type) {
        var players = {
            human : new PONGGERS.HumanPlayer(gameOptions, meshes.table, meshes.playerOne, game.keyboard, "q", "a"),
            computer : new PONGGERS.AiPlayer(gameOptions, meshes.table, meshes.ball, meshes.playerOne)
        };

        game.playerOne = players[type];
    }

    setOpponent = function(type) {
        var opponents = {
            human : new PONGGERS.HumanPlayer(gameOptions, meshes.table, meshes.playerTwo, game.keyboard, "up", "down"),
            computer : new PONGGERS.AiPlayer(gameOptions, meshes.table, meshes.ball, meshes.playerTwo)
        };

        game.playerTwo = opponents[type];
    }

    var moveAndRotateBall = function(ball) {
        ball.position.x += incX;
        ball.position.y += incY;

        ball.rotation.x += incX;
        ball.rotation.y += incY;
    }

    var resetBall = function(ball, gameOptions) {
        ball.position.x = 0;
        ball.position.y = 0;
        incX = gameOptions.defaultSpeedX;
        incY = gameOptions.defaultSpeedY;
    }

    var checkAndCorrectIfBallIsOnTable = function(ball) {
        var radius = ball.boundRadius;
        var playerWidth = meshes.playerOne.geometry.width;
        var halfTableWidth = meshes.table.geometry.width / 2.0;
        var halfTableHeight = meshes.table.geometry.height / 2.0;

        var playerCaughtBall = function(player, ball) {
            return ball.position.y > player.position.y - player.geometry.height / 2.0 - ball.geometry.radius &&
                ball.position.y < player.position.y + player.geometry.height / 2.0 +  ball.geometry.radius;
        };

        var amplitudeOfSheer = function(player, ball) {
            var top = player.position.y + player.geometry.height / 2.0;
            var bottom = player.position.y - player.geometry.height / 2.0;
            var middle = ball.position.y;

            var normalizedTop = top - bottom;
            var normalizedMiddle = middle - bottom;

            return ((normalizedMiddle / normalizedTop) - 0.5) * 2.0;
        };

        if(ball.position.x >= halfTableWidth - radius - playerWidth) {
            if(playerCaughtBall(meshes.playerTwo, ball)) {
                ball.position.x = halfTableWidth - radius - playerWidth;
                incX *= -1;
                incY += amplitudeOfSheer(meshes.playerTwo, ball) * 5.0;
            }
            else {
                resetBall(ball, gameOptions);
            }
        }

        if(ball.position.x <= -halfTableWidth + radius + playerWidth) {
            if(playerCaughtBall(meshes.playerOne, ball)) {
                ball.position.x = -halfTableWidth + radius + playerWidth;
                incX *= -1;
                incY += amplitudeOfSheer(meshes.playerOne, ball) * 5.0;
            } 
            else {
                resetBall(ball, gameOptions);
            }
        }

        if(ball.position.y >= halfTableHeight - radius) {
            ball.position.y = halfTableHeight - radius;
            incY *= -1;
        }

        if(ball.position.y <= -halfTableHeight + radius) {
            ball.position.y = -halfTableHeight + radius;
            incY *= -1;
        }
    }

    var addGameElements = function(scene) {
        var addTable, addBall, addLights, addPlayerOne, addPlayerTwo;

        addLights = function(scene) {
            var light = new THREE.PointLight(0xffffff, 1, 10000);
            light.position.set(-1000, -1000, 1000);
            scene.add(light);

            var light2 = new THREE.PointLight(0xffffff, 1, 10000);
            light2.position.set(1000, 1000, 1000);
            scene.add(light2);
        };

        addTable = function(scene) {
            var tableTexture = THREE.ImageUtils.loadTexture('scripts/textures/metal-texture.jpg');
            var borderTexture = THREE.ImageUtils.loadTexture('scripts/textures/wood-texture.jpg');

            meshes.table = new THREE.Mesh(
                new THREE.CubeGeometry(1000, 500, 50), 
                new THREE.MeshLambertMaterial ( { color: 0xcccccc, wireframe: false, map: tableTexture } ));
            scene.add(meshes.table);
            
            var border = new THREE.Mesh(
                new THREE.CubeGeometry(1000, 5, 75), 
                new THREE.MeshLambertMaterial ( { color: 0xffe4b5, wireframe: false, map: borderTexture } ));
            border.position.y = -252.5;
            scene.add(border);

            var border2 = new THREE.Mesh(
                new THREE.CubeGeometry(1000, 5, 75), 
                new THREE.MeshLambertMaterial ( { color: 0xffe4b5, wireframe: false, map: borderTexture } ));
            border2.position.y = 252.5;
            scene.add(border2);
        };

        addBall = function(scene) {
            meshes.ball = new THREE.Mesh(
                new THREE.SphereGeometry(25, 16, 16), 
                new THREE.MeshLambertMaterial ( { color: 0xeeeeee, wireframe: false } ));
            meshes.ball.position.z = 50;
            scene.add(meshes.ball);
        };

        addPlayers = function(scene) {
            var playerTexture = THREE.ImageUtils.loadTexture('scripts/textures/metallic-holes-texture.jpg');
            playerTexture.wrapS = playerTexture.wrapT = THREE.RepeatWrapping;
            playerTexture.repeat.set(2, 2);

            addPlayerOne = function(screne) {
                meshes.playerOne = new THREE.Mesh(
                    new THREE.CubeGeometry(25, 150, 25), 
                    new THREE.MeshLambertMaterial ( { color: 0xff0000, wireframe: false, map: playerTexture } ));
                meshes.playerOne.position.set(-487.5,0,50);
                scene.add(meshes.playerOne);
            };

            addPlayerTwo = function(screne) {                        
                meshes.playerTwo = new THREE.Mesh(
                    new THREE.CubeGeometry(25, 150, 25), 
                    new THREE.MeshLambertMaterial ( { color: 0x0000ff, wireframe: false, map: playerTexture } ));
                meshes.playerTwo.position.set(487.5,0,50);
                scene.add(meshes.playerTwo);
            };

            addPlayerOne(scene);
            addPlayerTwo(scene);
        };

        addLights(scene);
        addTable(scene);
        addBall(scene);
        addPlayers(scene);
    }
    
    /* Public */
    return {
        load: load,
        nextCamera: nextCamera,
        setPlayer: setPlayer,
        setOpponent: setOpponent,
        resetBall: function() {
            resetBall(meshes.ball, gameOptions)
        }    
    }
})();