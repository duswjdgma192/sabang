const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const menuInput = document.getElementById('menuInput');
const updateBtn = document.getElementById('updateBtn');
const startBtn = document.getElementById('startBtn');
const resultModal = document.getElementById('resultModal');
const resultText = document.getElementById('resultText');
const closeModalBtn = document.getElementById('closeModalBtn');

let menus = [];
let totalCount = 0;
let currentRotation = 0;
let isSpinning = false;

// Color palette
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#F1948A', '#82E0AA', '#85C1E9'];

function parseInput() {
    const rawText = menuInput.value;
    const items = rawText
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');

    const counts = {};
    items.forEach((item) => {
        counts[item] = (counts[item] || 0) + 1;
    });

    menus = Object.keys(counts).map((key) => ({
        name: key,
        count: counts[key],
    }));

    totalCount = items.length;
}

function drawRoulette() {
    if (menus.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    let startAngle = currentRotation;

    menus.forEach((menu, index) => {
        const sliceAngle = (menu.count / totalCount) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // Draw Slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.stroke();

        // Draw Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Poppins';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(menu.name, radius - 20, 5);
        ctx.restore();

        startAngle = endAngle;
    });
}

function spin() {
    if (isSpinning) return;
    if (menus.length === 0) {
        alert('메뉴를 먼저 입력해주세요!');
        return;
    }

    isSpinning = true;
    startBtn.disabled = true;
    updateBtn.disabled = true;

    // Random spin duration and speed
    const spinDuration = 3000 + Math.random() * 2000; // 3-5 seconds
    const spinAngle = (10 + Math.random() * 10) * 2 * Math.PI; // At least 10 full rotations

    const start = performance.now();
    const startRotation = currentRotation;

    function animate(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        currentRotation = startRotation + spinAngle * ease;
        drawRoulette();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            startBtn.disabled = false;
            updateBtn.disabled = false;
            showResult();
        }
    }

    requestAnimationFrame(animate);
}

function showResult() {
    // Normalize rotation to 0-2PI
    const normalizedRotation = currentRotation % (2 * Math.PI);

    // The pointer is at the top (3/2 PI or -PI/2).
    // We need to find which slice is at that position.
    // Since we draw clockwise from currentRotation, the slice at the top is determined by:
    // (startAngle + sliceAngle) > target > startAngle
    // But everything is rotated by currentRotation.

    // Let's think in reverse. If we rotate the wheel by R, the pointer (at -PI/2)
    // corresponds to an angle of (-PI/2 - R) on the unrotated wheel.

    let pointerAngle = (1.5 * Math.PI - normalizedRotation) % (2 * Math.PI);
    if (pointerAngle < 0) pointerAngle += 2 * Math.PI;

    let currentAngle = 0;
    let winner = null;

    for (const menu of menus) {
        const sliceAngle = (menu.count / totalCount) * 2 * Math.PI;
        if (pointerAngle >= currentAngle && pointerAngle < currentAngle + sliceAngle) {
            winner = menu.name;
            break;
        }
        currentAngle += sliceAngle;
    }

    if (winner) {
        resultText.textContent = winner;
        resultModal.classList.remove('hidden');
        // Simple confetti or celebration effect could go here
    }
}

updateBtn.addEventListener('click', () => {
    parseInput();
    if (menus.length > 0) {
        startBtn.disabled = false;
        drawRoulette();
    } else {
        startBtn.disabled = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

startBtn.addEventListener('click', spin);

closeModalBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
});

// Initial draw if there's default text (optional)
// parseInput();
// drawRoulette();
