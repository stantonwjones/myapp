WebpongApp = (function() {
	var canvas = document.getElementById('webpong_canvas');
	var context = canvas.getContext('2d');
    var ball;
    var paddles = [];
    var PADDLE_OFFSET = 30;
    var FREQUENCY = 30;
    var speed = 1000 / FREQUENCY;
    var score = [0,0];

	function init() {
        paddle0 = new Paddle(PADDLE_OFFSET);
        paddle1 = new Paddle(canvas.width - PADDLE_OFFSET);
        paddle0.bindKeys(87, 83);
        paddle1.bindKeys(38, 40);
        paddles = [paddle0, paddle1];
        ball = new Ball();
        setInterval(run, speed);
	}

    function run() {
        context.clearRect(0,0,canvas.width,canvas.height);
        paddles[0].run();
        paddles[1].run();
        ball.run();
    }

	// Ball Object
	function Ball() {
        // Size of the ball
        var radius = 15;
        // Track the interval process
        var process;

		// Position Vector
        var xpos = parseInt(canvas.width) / 2;
        var ypos = parseInt(canvas.height) / 2;

		// Velocity Vector
		var xvel = 2;
		var yvel = 2;

		// function for drawing the ball
        function draw() {
            context.beginPath();
            context.strokeStyle = 'black';
            context.lineWidth = 5;
            context.arc(xpos, ypos, radius, 0, (Math.PI * 2), false);
            context.stroke();
            context.closePath();
		}

		function setNextPosition() {
			xpos = xpos + xvel;
			ypos = ypos + yvel;
		}

        function isTouchingPaddle(paddle) {
            var leftLimit = xpos - radius;
            var rightLimit = xpos + radius;
            var paddleDimensions = paddle.getTopBottomWidthArray();
            var paddleTop = paddleDimensions[0];
            var paddleBot = paddleDimensions[1];
            var horizontalThresh = paddleDimensions[2] / 2;

            if (ypos < paddleBot && ypos > paddleTop) {
                if (leftLimit < paddle.xpos + horizontalThresh && leftLimit > paddle.xpos - horizontalThresh) return true;
                if (rightLimit < paddle.xpos + horizontalThresh && rightLimit > paddle.xpos - horizontalThresh) return true;
            }
            return false;
        }

        function isMovingTowardsPaddle(paddle) {
            return ((paddle.xpos - xpos > 0 && xvel > 0) || (paddle.xpos - xpos < 0 && xvel < 0));
        }

        function paddleCheck() {
            var i = 0;
            while (paddles[i]) {
                if (isMovingTowardsPaddle(paddles[i]) && isTouchingPaddle(paddles[i])) {
                    paddleBounce();
                }
                i++;
            }
        }

        function isTouchingWall() {
            var topLimit = ypos - radius,
                botLimit = ypos + radius,
                leftLimit = xpos - radius,
                rightLimit = xpos + radius;

            if (leftLimit < 0) return 'left';
            if (topLimit < 0) return 'top';
            if (rightLimit > canvas.width) return 'right';
            if (botLimit > canvas.height) return 'bot';
            return null;
        }
        function paddleBounce() {
            xvel *= -1;
        }
        function wallBounce() {
            yvel *= -1;
        }
        function wallCheck() {
            var wallStatus = isTouchingWall();
            if(wallStatus) {
                switch(wallStatus) {
                    case 'top':
                        if (yvel < 0) wallBounce();
                        break;
                    case 'bot':
                        if (yvel > 0) wallBounce();
                        break;
                    case 'left':
                        pointToPlayer(1);
                        break;
                    case 'right':
                        pointToPlayer(0);
                }
            }
        }
        function pointToPlayer(num) {
            score[num] += 1;
            reset();
        }

        // Run the Ball function
        function run() {
            wallCheck();
            paddleCheck();
            setNextPosition();
            draw();
            drawScore();
        }

        // Initiate the Ball
        function init() {
            //set the velocity to a random w/e and run the Ball
        }

        // Reset the Ball
        function reset() {
            ball = new Ball();
        }
        // Draw the score
        function drawScore() {
            context.fillStyle = '#000000';
            context.font = '20px _sans';
            context.TextBaseline = 'top';
            context.textAlign = 'center';
            context.fillText(score[0] + ' | ' + score[1], canvas.width / 2, 15);
        }

        return {
            xpos: xpos,
            ypos: ypos,
            run: run
        }
	}
	
	// Paddle Object
	function Paddle(xPos) {
		// Center Position Vector
		this.xpos = xPos;
		this.ypos = canvas.height / 2;
        var self = this;

		// Only has Y Velocity
		this.yvel = 0;
        this.movement;

		var width = 50;
		var depth = 5;

		// Draw the paddle
		this.draw = function() {
            context.strokeStyle = 'black';
            context.lineWidth = 5;
            context.lineCap = 'round';
            context.beginPath();
            context.moveTo(self.xpos, self.ypos + (width / 2));
            context.lineTo(self.xpos, self.ypos - (width / 2));
            context.stroke();
            context.closePath();
		}
		// movement functions
        this.bindMovementKeys = function(up, down, command) {
            document.addEventListener('keydown', function(key) {
                switch(key.keyCode) {
                    case up:
                        key.preventDefault();
                        self.movement = 'up';
                        break;
                    case down:
                        key.preventDefault();
                        self.movement = 'down';
                        break;
                    case command:
                }
            });
            document.addEventListener('keyup', function(key) {
                switch(key.keyCode) {
                    case up:
                        key.preventDefault();
                        self.movement = null;
                        break;
                    case down:
                        key.preventDefault();
                        self.movement = null;
                        break;
                    case command:
                }
            });
        }
        this.setMovement = function() {
            if (self.movement == 'up') {
                self.yvel = -1;
            } else if (self.movement == 'down') {
                self.yvel = 1;
            } else {
                self.yvel = 0;
            }
        }
        this.getNextPosition = function() {
            self.setMovement();
            // check that we have not hit the vertical borders before allowing paddle to move
            var nextPosition = self.ypos + self.yvel;
            if (nextPosition > width / 2 && nextPosition < canvas.height - width / 2) {
                self.ypos = nextPosition;
            }
        }

        this.run = function() {
            self.getNextPosition();
            self.draw();
        }
        this.getTopBottomWidthArray = function() {
            return[self.ypos - (width / 2), self.ypos + (width / 2), depth];
        }
        return {
            xpos: self.xpos,
            ypos: self.ypos,
            width: self.width,
            run: self.run,
            bindKeys: self.bindMovementKeys,
            getTopBottomWidthArray: self.getTopBottomWidthArray
        }
	}
    return {
        init: init
    }

})();

WebpongApp.init();
