// Khai báo các biến DOM
const levelSelection = document.getElementById('level-selection');
const gameContainer = document.getElementById('game-container');
const targetMeaning = document.getElementById('target-meaning');
const targetReading = document.getElementById('target-reading');
const puzzlePiecesZone = document.getElementById('puzzle-pieces');
const dropZone = document.getElementById('drop-zone');
const checkButton = document.getElementById('check-btn');
const feedbackElement = document.getElementById('feedback');
const currentLevelDisplay = document.getElementById('current-level');

let allWords = {}; 
let currentWord = null;
let selectedLevel = null;
let draggedElement = null; // Biến lưu trữ phần tử đang được kéo

// Hàm Khởi tạo Dữ liệu
function initializeData() {
    // Thu thập dữ liệu từ các file dictionaries/
    if (typeof N5_WORDS !== 'undefined') allWords['N5'] = N5_WORDS;
    if (typeof N4_WORDS !== 'undefined') allWords['N4'] = N4_WORDS;
    // Thêm các level khác ở đây (N3, N2, N1)
    
    // Nếu chưa có dữ liệu, thêm một mảng trống để tránh lỗi
    ['N3', 'N2', 'N1'].forEach(level => {
        if (!allWords[level]) allWords[level] = [{ word: "準備中", kanjis: ["準", "備", "中"], reading: "じゅんびちゅう", meaning: "Đang được chuẩn bị" }];
    });
}

// Hàm cập nhật mảng currentPieces dựa trên các phần tử trong dropZone
function updateCurrentPieces() {
    let pieces = [];
    dropZone.querySelectorAll('.kanji-piece').forEach(piece => {
        pieces.push(piece.textContent);
    });
    return pieces;
}

// Hàm Xử lý Kéo Thả (Drag and Drop Handlers)
function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.textContent); 
    e.target.style.opacity = '0.4'; // Hiệu ứng đang kéo
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault(); // Cần thiết để cho phép thả (drop)
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    if (draggedElement) {
        // Kiểm tra nếu phần tử đang được kéo đến từ puzzlePiecesZone
        if (draggedElement.parentElement.id === 'puzzle-pieces') {
            // Thêm vào drop zone
            dropZone.appendChild(draggedElement);
        } else if (draggedElement.parentElement.id === 'drop-zone') {
            // Logic sắp xếp lại trong drop zone (cần phức tạp hơn, tạm thời chỉ cho phép di chuyển)
            // Để đơn giản, chỉ cho phép thả từ puzzle-pieces sang drop-zone
            // Thả vào drop zone
            dropZone.appendChild(draggedElement);
        }
    }
}

// Hàm gắn các Event Listeners D&D vào các mảnh ghép và khu vực drop
function addDragDropListeners() {
    // 1. Dùng event delegation cho các mảnh ghép (dragstart, dragend)
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('kanji-piece')) {
            handleDragStart(e);
        }
    });
    
    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('kanji-piece')) {
            handleDragEnd(e);
        }
    });

    // 2. Event cho Drop Zone
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // 3. Xử lý click (di chuyển ngược lại từ DropZone về PuzzleZone) - Cải thiện UX
    dropZone.onclick = function(event) {
        if (event.target.classList.contains('kanji-piece')) {
            const piece = event.target;
            puzzlePiecesZone.appendChild(piece);
        }
    };
}


// Hàm Bắt đầu game/Chuyển màn
function startGame(level) {
    selectedLevel = level;
    currentLevelDisplay.textContent = level;
    levelSelection.style.display = 'none';
    gameContainer.style.display = 'block';

    loadNewWord();
}

// Hàm Tải từ vựng mới
function loadNewWord() {
    if (!allWords[selectedLevel] || allWords[selectedLevel].length === 0) {
        feedbackElement.style.color = 'red';
        feedbackElement.textContent = `Không có từ vựng cho cấp độ ${selectedLevel}!`;
        return;
    }

    // Chọn ngẫu nhiên một từ
    const randomIndex = Math.floor(Math.random() * allWords[selectedLevel].length);
    currentWord = allWords[selectedLevel][randomIndex];
    
    // Xóa nội dung cũ
    dropZone.innerHTML = '';
    puzzlePiecesZone.innerHTML = '';
    feedbackElement.textContent = '';

    // 1. Hiển thị thông tin mục tiêu
    targetMeaning.textContent = currentWord.meaning;
    targetReading.textContent = currentWord.reading;

    // 2. Tạo các mảnh ghép (Kanji)
    let pieces = [...currentWord.kanjis]; 
    
    // SỬ DỤNG LODASH ĐỂ XÁO TRỘN:
    const shuffledPieces = _.shuffle(pieces); 

    shuffledPieces.forEach(kanji => {
        const piece = document.createElement('div');
        piece.textContent = kanji;
        piece.classList.add('kanji-piece');
        piece.setAttribute('draggable', true); // Đặt draggable="true"
        puzzlePiecesZone.appendChild(piece);
    });
}

// Xử lý Sự kiện: Kiểm Tra Từ Vựng
checkButton.addEventListener('click', () => {
    // Lấy chuỗi từ hiện tại trong dropZone
    const attemptedWord = updateCurrentPieces().join('');
    
    if (attemptedWord === currentWord.word) {
        feedbackElement.style.color = 'green';
        feedbackElement.textContent = `CHÍNH XÁC! Bạn đã ghép được từ: ${currentWord.word} (${currentWord.reading}).`;
        
        // Cập nhật điểm và chuyển sang từ mới
        document.getElementById('current-score').textContent = parseInt(document.getElementById('current-score').textContent) + 10;
        setTimeout(loadNewWord, 2000); // Tải từ mới sau 2 giây
    } else {
        feedbackElement.style.color = 'red';
        feedbackElement.textContent = `SAI! Từ bạn ghép là "${attemptedWord}". Hãy kiểm tra thứ tự và các mảnh ghép.`;
    }
});

// Xử lý Sự kiện: Chọn Level
document.querySelectorAll('.level-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const level = e.target.getAttribute('data-level');
        startGame(level);
    });
});

// Khởi tạo Game
initializeData();
addDragDropListeners();