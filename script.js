// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: 'AIzaSyAYbxVQM6yKtSVaoQToiGcQIDe7X1BJDfo',
    authDomain: 'sabang-6519f.firebaseapp.com',
    databaseURL: 'https://sabang-6519f-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'sabang-6519f',
    storageBucket: 'sabang-6519f.firebasestorage.app',
    messagingSenderId: '760848505752',
    appId: '1:760848505752:web:fda74fa2b3d0fce458a9ed',
    measurementId: 'G-CYRX1TKBTF',
};

// Initialize Firebase (Compat)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const COLLECTION_NAME = 'lunch_history';

const menuInput = document.getElementById('menuInput');
const updateBtn = document.getElementById('updateBtn');
const startBtn = document.getElementById('startBtn');
const resultModal = document.getElementById('resultModal');
const resultText = document.getElementById('resultText');
const closeModalBtn = document.getElementById('closeModalBtn');
const likeBtn = document.getElementById('likeBtn');
const likePopup = document.getElementById('likePopup');

// Slot Elements
const slotReel = document.getElementById('slotReel');

// Stats Elements
const statsBtn = document.getElementById('statsBtn');
const backBtn = document.getElementById('backBtn');
const mainContent = document.querySelector('.main-content');
const statsSection = document.getElementById('statsSection');
const statsList = document.getElementById('statsList');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const searchStatsBtn = document.getElementById('searchStatsBtn');

let menus = [];
let isSpinning = false;
let currentWinner = null;
let currentDocId = null;

// --- Helper Functions ---

function generateDocId() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

// --- Slot Machine Logic ---

function parseInput() {
    const rawText = menuInput.value;
    const items = rawText
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');
    menus = items;
}

function createReelStrip() {
    slotReel.innerHTML = '';
    if (menus.length === 0) {
        slotReel.innerHTML = '<div class="slot-item">EMPTY</div>';
        return;
    }

    const uniqueMenus = [...new Set(menus)];
    const displayList = [];
    for (let i = 0; i < 50; i++) {
        displayList.push(...uniqueMenus);
    }

    displayList.forEach((menu) => {
        const div = document.createElement('div');
        div.className = 'slot-item';
        div.textContent = menu;
        slotReel.appendChild(div);
    });
}

function spin() {
    if (isSpinning) return;
    if (menus.length === 0) {
        alert('Please enter menus first!');
        return;
    }

    isSpinning = true;
    startBtn.disabled = true;
    updateBtn.disabled = true;

    const randomIndex = Math.floor(Math.random() * menus.length);
    currentWinner = menus[randomIndex];

    slotReel.style.transition = 'none';
    slotReel.style.transform = 'translateY(0)';

    slotReel.innerHTML = '';
    const uniqueMenus = [...new Set(menus)];
    const fragment = document.createDocumentFragment();

    const ITEM_HEIGHT = 200;
    const SPIN_CYCLES = 30;

    for (let i = 0; i < SPIN_CYCLES; i++) {
        const menu = uniqueMenus[Math.floor(Math.random() * uniqueMenus.length)];
        const div = document.createElement('div');
        div.className = 'slot-item';
        div.textContent = menu;
        fragment.appendChild(div);
    }

    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'slot-item';
    winnerDiv.textContent = currentWinner;
    fragment.appendChild(winnerDiv);

    slotReel.appendChild(fragment);
    slotReel.offsetHeight;

    const totalHeight = SPIN_CYCLES * ITEM_HEIGHT;

    slotReel.style.transition = 'transform 3s cubic-bezier(0.1, 0.9, 0.2, 1)';
    slotReel.style.transform = `translateY(-${totalHeight}px)`;

    setTimeout(async () => {
        isSpinning = false;
        startBtn.disabled = false;
        updateBtn.disabled = false;
        await showResult();
    }, 3000);
}

async function showResult() {
    if (currentWinner) {
        currentDocId = await saveHistory(currentWinner);
        resultText.textContent = currentWinner;
        resultModal.classList.remove('hidden');
    }
}

// --- Firebase Logic (Compat) ---

async function saveHistory(menuName) {
    const docId = generateDocId();
    try {
        await db.collection(COLLECTION_NAME).doc(docId).set({
            menu: menuName,
            date: new Date().toISOString(),
            liked: false,
        });
        console.log('Document written with ID: ', docId);
        return docId;
    } catch (e) {
        console.error('Error adding document: ', e);
        alert('Error saving result to database. Check console.');
        return null;
    }
}

async function likeCurrentWinner() {
    if (!currentDocId) {
        alert('No record found to like.');
        return;
    }

    try {
        await db.collection(COLLECTION_NAME).doc(currentDocId).update({
            liked: true,
        });

        // Visual Effects
        triggerFireworks();
        showLikePopup();

        likeBtn.disabled = true;

        // Auto close after 1 second
        setTimeout(() => {
            resultModal.classList.add('hidden');
            likePopup.classList.remove('show');
            likeBtn.disabled = false;
        }, 1000);
    } catch (e) {
        console.error('Error updating document: ', e);
        alert('Error updating like.');
    }
}

function triggerFireworks() {
    const duration = 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            zIndex: 9999, // Ensure it's above everything
        });
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            zIndex: 9999, // Ensure it's above everything
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    })();
}

function showLikePopup() {
    likePopup.classList.add('show');
}

async function renderStats() {
    statsList.innerHTML = '<li style="text-align:center; color:#fff;">Loading data...</li>';

    try {
        const querySnapshot = await db.collection(COLLECTION_NAME).orderBy('date', 'desc').get();

        const history = [];
        querySnapshot.forEach((doc) => {
            history.push(doc.data());
        });

        const fromVal = dateFrom.value;
        const toVal = dateTo.value;

        let fromDate = null;
        let toDate = null;

        if (fromVal) {
            fromDate = new Date(fromVal);
            fromDate.setHours(0, 0, 0, 0);
        }
        if (toVal) {
            toDate = new Date(toVal);
            toDate.setHours(23, 59, 59, 999);
        }

        const filteredHistory = history.filter((entry) => {
            const entryDate = new Date(entry.date);

            if (fromDate && entryDate < fromDate) return false;
            if (toDate && entryDate > toDate) return false;

            return true;
        });

        const statsMap = {};
        filteredHistory.forEach((entry) => {
            if (!statsMap[entry.menu]) {
                statsMap[entry.menu] = { wins: 0, likes: 0 };
            }
            statsMap[entry.menu].wins += 1;
            // Check for 'liked' or 'linked' (typo handling)
            if (entry.liked || entry.linked) {
                statsMap[entry.menu].likes += 1;
            }
        });

        const sortedMenus = Object.keys(statsMap).sort((a, b) => {
            if (statsMap[b].wins !== statsMap[a].wins) {
                return statsMap[b].wins - statsMap[a].wins;
            }
            return statsMap[b].likes - statsMap[a].likes;
        });

        statsList.innerHTML = '';
        if (sortedMenus.length === 0) {
            statsList.innerHTML = '<li style="text-align:center; color:#fff;">No records found for this period.</li>';
            return;
        }

        sortedMenus.forEach((menu, index) => {
            const data = statsMap[menu];
            const li = document.createElement('li');
            li.className = 'stat-item';

            let rankEmoji = '🔹';
            if (index === 0) rankEmoji = '🥇';
            if (index === 1) rankEmoji = '🥈';
            if (index === 2) rankEmoji = '🥉';

            li.innerHTML = `
                <span class="stat-rank">${rankEmoji}</span>
                <span class="stat-name">${menu}</span>
                <div class="stat-info">
                    <span class="stat-badge wins">🏆 ${data.wins}</span>
                    <span class="stat-badge likes">❤️ ${data.likes}</span>
                </div>
            `;
            statsList.appendChild(li);
        });
    } catch (e) {
        console.error('Error fetching documents: ', e);
        statsList.innerHTML = '<li style="text-align:center; color:red;">Error loading data. Check console.</li>';
    }
}

// --- Event Listeners ---

updateBtn.addEventListener('click', () => {
    parseInput();
    if (menus.length > 0) {
        startBtn.disabled = false;
        createReelStrip();
    } else {
        startBtn.disabled = true;
        slotReel.innerHTML = '<div class="slot-item">READY</div>';
    }
});

startBtn.addEventListener('click', spin);

likeBtn.addEventListener('click', likeCurrentWinner);

closeModalBtn.addEventListener('click', () => {
    resultModal.classList.add('hidden');
    likeBtn.disabled = false; // Reset for next time
});

// const dateFilter = document.getElementById('dateFilter'); // Removed

// ... (rest of the code)

statsBtn.addEventListener('click', () => {
    // Default to "Today" if no dates selected
    if (!dateFrom.value && !dateTo.value) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        dateFrom.value = todayStr;
        dateTo.value = todayStr;
    }
    renderStats();
    mainContent.classList.add('hidden');
    statsSection.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    statsSection.classList.add('hidden');
    mainContent.classList.remove('hidden');
});

searchStatsBtn.addEventListener('click', renderStats);

// Make date inputs open picker on click
dateFrom.addEventListener('click', function () {
    this.showPicker();
});
dateTo.addEventListener('click', function () {
    this.showPicker();
});

slotReel.innerHTML = '<div class="slot-item">READY</div>';
