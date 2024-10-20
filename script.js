class Card {
    constructor(x, y, z, width, height, imageId) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width;
        this.height = height;
        this.imageId = imageId;
        this.isRevealed = false;
        this.rotationAngle = 0;
        this.borderRadius = 4;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        if (this.rotationAngle <= Math.PI / 2) {
            // First half of the rotation
            ctx.rotate(this.rotationAngle);
            ctx.scale(Math.cos(this.rotationAngle), 1);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
            
            // Draw the back of the card with rounded corners
            ctx.beginPath();
            ctx.moveTo(this.x + this.borderRadius, this.y);
            ctx.lineTo(this.x + this.width - this.borderRadius, this.y);
            ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.borderRadius);
            ctx.lineTo(this.x + this.width, this.y + this.height - this.borderRadius);
            ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - this.borderRadius, this.y + this.height);
            ctx.lineTo(this.x + this.borderRadius, this.y + this.height);
            ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.borderRadius);
            ctx.lineTo(this.x, this.y + this.borderRadius);
            ctx.quadraticCurveTo(this.x, this.y, this.x + this.borderRadius, this.y);
            ctx.closePath();
            
            ctx.fillStyle = '#007bff';
            ctx.fill();

            // Draw the red heart
            this.drawHeart(ctx, this.x + this.width / 2, this.y + this.height / 3, this.width / 2);
        } else {
            // Second half of the rotation
            ctx.rotate(Math.PI - this.rotationAngle);
            ctx.scale(-Math.cos(this.rotationAngle), 1);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
            
            // Draw the image
            const img = new Image();
            img.src = `assets/${this.imageId}.jpg`;
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }

        ctx.restore();
    }

    drawHeart(ctx, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
        ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 3/4, x, y + size);
        ctx.bezierCurveTo(x, y + size * 3/4, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
    }

    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cards = [];
        this.revealedCards = [];
        this.isAnimating = false;

        this.cardWidth = 100;
        this.cardHeight = 150;
        this.gridColumns = 3;
        this.gridRows = 4;
        this.spacing = 10;

        // Calculate canvas size based on grid and card dimensions
        this.canvas.width = this.gridColumns * (this.cardWidth + this.spacing) + this.spacing;
        this.canvas.height = this.gridRows * (this.cardHeight + this.spacing) + this.spacing;

        this.victoryMessage = document.getElementById('victoryMessage');
        this.playAgainButton = document.getElementById('playAgain');
        this.playAgainButton.addEventListener('click', () => this.resetGame());

        this.matchedPairs = 0;
        this.totalPairs = (this.gridColumns * this.gridRows) / 2; // Set totalPairs correctly

        this.initializeCards();
        this.addEventListeners();
        this.draw();
    }

    initializeCards() {
        let imageIds = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
        this.shuffleArray(imageIds);

        for (let i = 0; i < this.gridRows; i++) {
            for (let j = 0; j < this.gridColumns; j++) {
                const x = j * (this.cardWidth + this.spacing) + this.spacing;
                const y = i * (this.cardHeight + this.spacing) + this.spacing;
                const z = 0;
                const imageId = imageIds[i * this.gridColumns + j];
                this.cards.push(new Card(x, y, z, this.cardWidth, this.cardHeight, imageId));
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    addEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
            const touch = e.touches[0];
            this.handleClick(touch);
        });
    }

    handleClick(e) {
        if (this.isAnimating) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (const card of this.cards) {
            if (card.contains(x, y) && !card.isRevealed) {
                this.revealCard(card);
                break;
            }
        }
    }

    revealCard(card) {
        this.isAnimating = true;
        this.animateCardFlip(card, true, () => {
            this.revealedCards.push(card);
            if (this.revealedCards.length === 2) {
                this.checkMatch();
            } else {
                this.isAnimating = false;
            }
        });
    }

    animateCardFlip(card, reveal, callback) {
        const flipDuration = 500; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / flipDuration, 1);
            card.rotationAngle = reveal ? Math.PI * progress : Math.PI * (1 - progress);

            this.draw();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                card.rotationAngle = reveal ? Math.PI : 0;
                card.isRevealed = reveal;
                callback();
            }
        };

        animate();
    }

    checkMatch() {
        const [card1, card2] = this.revealedCards;

        if (card1.imageId === card2.imageId) {
            this.matchedPairs++;
            this.revealedCards = [];
            this.isAnimating = false;

            if (this.matchedPairs === this.totalPairs) {
                setTimeout(() => this.showVictoryMessage(), 500); // Add a small delay before showing the message
            }
        } else {
            setTimeout(() => {
                this.animateCardFlip(card1, false, () => {
                    this.animateCardFlip(card2, false, () => {
                        this.revealedCards = [];
                        this.isAnimating = false;
                    });
                });
            }, 1000);
        }
    }

    showVictoryMessage() {
        this.victoryMessage.classList.remove('hidden');
    }

    resetGame() {
        this.victoryMessage.classList.add('hidden');
        this.matchedPairs = 0;
        this.cards = [];
        this.revealedCards = [];
        this.isAnimating = false;
        this.initializeCards();
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const card of this.cards) {
            card.draw(this.ctx);
        }
    }
}

new Game();
