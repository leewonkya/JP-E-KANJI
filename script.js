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

// Biến lưu trữ phần tử đang được kéo (dùng chung cho cả chuột và cảm ứng)
let draggedElement = null; 
let currentPieces = []; // Khởi tạo lại để đảm bảo không bị lỗi reference


// === CÁC BIẾN MỚI CHO ÂM THANH (WEB SPEECH API) ===
let audioEnabled = true; // Mặc định bật âm thanh
const synth = window.speechSynthesis;
// Tìm giọng Nhật Bản (ja-JP) để phát âm chính xác
let voice = null;
if (synth) {
    synth.onvoiceschanged = () => {
        voice = synth.getVoices().find(v => v.lang === 'ja-JP') || null;
    };
    if (synth.getVoices().length > 0) {
        voice = synth.getVoices().find(v => v.lang === 'ja-JP') || null;
    }
}

// === HÀM PHÁT ÂM MỚI ===
function speakKana(kana) {
    if (!audioEnabled || !synth) return;

    // Hủy bỏ giọng nói đang chạy (nếu có)
    if (synth.speaking) {
        synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(kana);
    utterance.lang = 'ja-JP';
    
    
    if (voice) {
        utterance.voice = voice;
    }
    utterance.rate = 0.8;

    synth.speak(utterance);
}


// Hàm Khởi tạo Dữ liệu
function initializeData() {
    // Thu thập dữ liệu từ các file dictionaries/
    if (typeof N5_WORDS !== 'undefined') allWords['N5'] = N5_WORDS;
    if (typeof N4_WORDS !== 'undefined') allWords['N4'] = N4_WORDS;
    if (typeof N3_WORDS !== 'undefined') allWords['N3'] = N3_WORDS;
    // Thêm các level khác ở đây (N3, N2, N1)
    
    // Nếu chưa có dữ liệu, thêm một mảng trống để tránh lỗi
    ['N2', 'N1'].forEach(level => {
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

// =======================================================
// === 1. LOGIC XỬ LÝ CHUỘT (DRAG & DROP API) - Desktop ===
// =======================================================

function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.textContent); 
    e.target.style.opacity = '0.4'; 
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    // Thêm hiệu ứng drag-over chỉ khi đang kéo qua drop zone
    if (e.currentTarget.id === 'drop-zone') {
        dropZone.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.currentTarget.id === 'drop-zone') {
        dropZone.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    if (draggedElement) {
        if (e.currentTarget.id === 'drop-zone') {
            // Thêm vào drop zone
            dropZone.appendChild(draggedElement);
            // Cần cập nhật currentPieces sau khi thả
            currentPieces = updateCurrentPieces(); 
        } 
    }
}

// =======================================================
// === 2. LOGIC XỬ LÝ CẢM ỨNG (TOUCH EVENTS) - Mobile ===
// =======================================================

let touchStartX, touchStartY; // Tọa độ ban đầu
const DROP_THRESHOLD = 50; // Ngưỡng pixel để xác định việc thả

function handleTouchStart(e) {
    // Chỉ xử lý khi có một ngón tay chạm vào
    if (e.touches.length === 1 && e.target.classList.contains('kanji-piece')) {
        e.preventDefault(); // Ngăn cuộn trang
        draggedElement = e.target;
        
        // Lưu tọa độ ban đầu
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        
        // Bắt đầu hiệu ứng kéo
        draggedElement.style.opacity = '0.4';
        draggedElement.style.position = 'absolute';
        draggedElement.style.zIndex = '1000';
    }
}

function handleTouchMove(e) {
    if (!draggedElement) return;
    e.preventDefault();

    // Di chuyển phần tử theo ngón tay
    const touch = e.touches[0];
    draggedElement.style.left = touch.clientX - (draggedElement.offsetWidth / 2) + 'px';
    draggedElement.style.top = touch.clientY - (draggedElement.offsetHeight / 2) + 'px';
    
    // Kiểm tra và thêm hiệu ứng drag-over khi di chuyển qua dropZone
    const dropZoneRect = dropZone.getBoundingClientRect();
    const isOverDropZone = touch.clientX > dropZoneRect.left && 
                           touch.clientX < dropZoneRect.right && 
                           touch.clientY > dropZoneRect.top && 
                           touch.clientY < dropZoneRect.bottom;

    if (isOverDropZone) {
        dropZone.classList.add('drag-over');
    } else {
        dropZone.classList.remove('drag-over');
    }
}

function handleTouchEnd(e) {
    if (!draggedElement) return;
    
    // Vô hiệu hóa hiệu ứng kéo
    draggedElement.style.opacity = '1';
    draggedElement.style.position = ''; // Khôi phục position
    draggedElement.style.zIndex = '';
    draggedElement.style.left = '';
    draggedElement.style.top = '';

    dropZone.classList.remove('drag-over');

    // Lấy tọa độ cuối cùng (dựa vào last changed touch)
    const touch = e.changedTouches[0];
    
    // 1. Kiểm tra nếu tọa độ cuối nằm trong Drop Zone
    const dropZoneRect = dropZone.getBoundingClientRect();
    if (touch.clientX > dropZoneRect.left && 
        touch.clientX < dropZoneRect.right && 
        touch.clientY > dropZoneRect.top && 
        touch.clientY < dropZoneRect.bottom) 
    {
        // Thả thành công vào Drop Zone
        dropZone.appendChild(draggedElement);
        currentPieces = updateCurrentPieces();
    } else if (draggedElement.parentElement.id === 'drop-zone') {
        // Nếu không thả vào vùng hợp lệ, nhưng nó đang ở trong dropZone, 
        // ta giữ nguyên nó ở đó.
    } else {
        // Nếu không thả vào vùng hợp lệ, trả về puzzlePiecesZone (Vùng mặc định)
        puzzlePiecesZone.appendChild(draggedElement);
    }
    
    draggedElement = null;
}


// =======================================================
// === 3. GÁN SỰ KIỆN (CHUNG) ===
// =======================================================

function addDragDropListeners() {
    // 1. Gán sự kiện Chuột (Desktop)
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('kanji-piece')) handleDragStart(e);
    });
    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('kanji-piece')) handleDragEnd(e);
    });

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // 2. Gán sự kiện Cảm ứng (Mobile)
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);


    // 3. Xử lý click để di chuyển ngược lại (UX Improvement)
    dropZone.onclick = function(event) {
        if (event.target.classList.contains('kanji-piece')) {
            const piece = event.target;
            puzzlePiecesZone.appendChild(piece);
            currentPieces = updateCurrentPieces(); // Cập nhật lại mảng
        }
    };
    
    // 4. Sự kiện click để chuyển từ puzzle zone sang drop zone (UX Improvement)
    puzzlePiecesZone.onclick = function(event) {
        if (event.target.classList.contains('kanji-piece')) {
            const piece = event.target;
            dropZone.appendChild(piece);
            currentPieces = updateCurrentPieces(); // Cập nhật lại mảng
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
    
    if (attemptedWord === currentWord.kanji) {
        feedbackElement.style.color = 'green';
        feedbackElement.textContent = `CHÍNH XÁC! Bạn đã ghép được từ: ${currentWord.kanji} (${currentWord.reading}).`;

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

function speakNewWorld() {
    speakKana(currentWord.reading);
}

// Khởi tạo Game
initializeData();
addDragDropListeners();