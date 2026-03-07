let boundariesData = [];

// Neon colors mapped to Exam Boards
const boardColors = {
    'AQA': '#ff3d00',    // Red-Orange
    'OCR A': '#00b0ff',  // Bright Blue
    'Edexcel': '#00e676' // Neon Green
};
const defaultColor = '#3b82f6';

const hierarchy = {
    'A-Level': { boards: ['AQA', 'OCR A'] },
    'AS-Level': { boards: ['AQA', 'OCR A'] },
    'BTEC': { boards: ['Edexcel'] }
};

async function init() {
    try {
        const res = await fetch('/Data/boundaries.json');
        boundariesData = await res.json();
        setupListeners();
        renderResults();
    } catch (e) { console.error("Could not load boundaries.json", e); }
}

function setupListeners() {
    const q = document.getElementById('filter-qualification');
    const b = document.getElementById('filter-exam-board');
    const y = document.getElementById('filter-year');

    q.addEventListener('change', () => {
        b.value = 'all'; y.value = 'all';
        y.disabled = true;
        updateBoardOptions(q.value);
        renderResults();
    });
    
    b.addEventListener('change', () => {
        y.value = 'all';
        updateYearOptions(q.value, b.value);
        renderResults();
    });

    y.addEventListener('change', renderResults);
}

function updateBoardOptions(qual) {
    const b = document.getElementById('filter-exam-board');
    b.innerHTML = '<option value="all">Select Exam Board</option>';
    if(qual === 'all') { b.disabled = true; return; }
    b.disabled = false;
    hierarchy[qual].boards.forEach(board => b.innerHTML += `<option value="${board}">${board}</option>`);
}

function updateYearOptions(qual, board) {
    const y = document.getElementById('filter-year');
    y.innerHTML = '<option value="all">Select Year</option>';
    if(board === 'all') { y.disabled = true; return; }
    y.disabled = false;
    const years = [...new Set(boundariesData
        .filter(d => d.qualification === qual && d.examBoard === board)
        .map(d => d.year))]
        .sort((a,b) => b-a);
    years.forEach(year => y.innerHTML += `<option value="${year}">${year}</option>`);
}

function renderResults() {
    const container = document.getElementById('results-container');
    const q = document.getElementById('filter-qualification').value;
    const b = document.getElementById('filter-exam-board').value;
    const y = document.getElementById('filter-year').value;

    if (q === 'all') {
        container.innerHTML = `<div class="empty-state"><p>Please select a qualification to view grade boundaries.</p></div>`;
        document.getElementById('results-count').innerText = "";
        return;
    }

    let filtered = boundariesData.filter(d => d.qualification === q);
    if (b !== 'all') filtered = filtered.filter(d => d.examBoard === b);
    if (y !== 'all') filtered = filtered.filter(d => d.year == y);

    document.getElementById('results-count').innerText = `${filtered.length} document(s) found`;

    container.innerHTML = filtered.map(doc => {
        const color = boardColors[doc.examBoard] || defaultColor;

        return `
        <article class="paper-card card" style="--subject-color: ${color}">
            <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <h3 style="margin:0;">${doc.examBoard}</h3>
                <span style="color: var(--text-tertiary); font-weight: bold;">${doc.year}</span>
            </div>
            <p style="margin-bottom: 20px;">${doc.title}</p>
            <div class="paper-actions">
                <a href="${doc.url}" target="_blank" class="action-btn" style="border-color: var(--subject-color); color: #fff;">
                    Download Grade Boundaries (PDF)
                </a>
            </div>
        </article>
        `;
    }).join('');
}

init();