let pastPapersData = [];

// Define unique neon colors for subjects
const subjectColors = {
    'Mathematics': '#3b82f6',        // Blue
    'Core Maths': '#60a5fa',         // Light Blue
    'English Language': '#f59e0b',   // Amber
    'Geography': '#10b981',          // Emerald Green
    'Sociology': '#ec4899',          // Pink
    'Chemistry': '#8b5cf6',          // Purple
    'Physics': '#6366f1',            // Indigo
    'Applied Science': '#14b8a6',    // Teal
    'Business Studies': '#475569',   // Slate Blue
    'Information Technology': '#0ea5e9' // Sky Blue
};

// Fallback color
const defaultColor = '#3b82f6';

const hierarchy = {
    'A-Level': { boards: ['AQA', 'OCR A'], subjects: { 'AQA': ['English Language', 'Geography', 'Mathematics', 'Sociology'], 'OCR A': ['Chemistry', 'Physics'] } },
    'AS-Level': { boards: ['AQA', 'OCR A'], subjects: { 'AQA': ['Core Maths', 'English Language', 'Geography', 'Mathematics'], 'OCR A': ['Chemistry', 'Physics'] } },
    'BTEC': { boards: ['Edexcel'], subjects: { 'Edexcel': ['Applied Science', 'Business Studies', 'Information Technology'] } }
};

async function init() {
    try {
        const res = await fetch('/Data/papers.json');
        pastPapersData = await res.json();
        setupListeners();
        renderResults();
    } catch (e) { console.error("Could not load papers.json", e); }
}

function setupListeners() {
    const q = document.getElementById('filter-qualification');
    const b = document.getElementById('filter-exam-board');
    const s = document.getElementById('filter-subject');
    const y = document.getElementById('filter-year');

    q.addEventListener('change', () => {
        b.value = 'all'; s.value = 'all'; y.value = 'all';
        s.disabled = true; y.disabled = true;
        updateBoardOptions(q.value);
        renderResults();
    });
    
    b.addEventListener('change', () => {
        s.value = 'all'; y.value = 'all';
        y.disabled = true;
        updateSubjectOptions(q.value, b.value);
        renderResults();
    });

    s.addEventListener('change', () => {
        y.value = 'all';
        updateYearOptions(s.value);
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

function updateSubjectOptions(qual, board) {
    const s = document.getElementById('filter-subject');
    s.innerHTML = '<option value="all">Select Subject</option>';
    if(board === 'all') { s.disabled = true; return; }
    s.disabled = false;
    hierarchy[qual].subjects[board].forEach(sub => s.innerHTML += `<option value="${sub}">${sub}</option>`);
}

function updateYearOptions(sub) {
    const y = document.getElementById('filter-year');
    y.innerHTML = '<option value="all">Select Year</option>';
    if(sub === 'all') { y.disabled = true; return; }
    y.disabled = false;
    const years = [...new Set(pastPapersData.filter(p => p.subject === sub).map(p => p.year))].sort((a,b) => b-a);
    years.forEach(year => y.innerHTML += `<option value="${year}">${year}</option>`);
}

function renderResults() {
    const container = document.getElementById('results-container');
    const q = document.getElementById('filter-qualification').value;
    const b = document.getElementById('filter-exam-board').value;
    const s = document.getElementById('filter-subject').value;
    const y = document.getElementById('filter-year').value;

    if (q === 'all') {
        container.innerHTML = `<div class="empty-state"><p>Please select a qualification to begin searching.</p></div>`;
        document.getElementById('results-count').innerText = "";
        return;
    }

    let filtered = pastPapersData.filter(p => p.qualification === q);
    if (b !== 'all') filtered = filtered.filter(p => p.examBoard === b);
    if (s !== 'all') filtered = filtered.filter(p => p.subject === s);
    if (y !== 'all') filtered = filtered.filter(p => p.year == y);

    document.getElementById('results-count').innerText = `${filtered.length} papers matching your selection`;

    container.innerHTML = filtered.map(p => {
        // Get the specific color for this subject, or default
        const color = subjectColors[p.subject] || defaultColor;

        return `
        <article class="paper-card card" style="--subject-color: ${color}">
            <h3>${p.subject}</h3>
            <p style="color:var(--text-tertiary); font-size:0.8rem; margin-bottom:5px;">${p.examBoard} • ${p.year}</p>
            <p style="font-weight:600;">${p.paperTitle}</p>
            <div class="paper-actions">
                <a href="${p.paperUrl}" target="_blank" class="action-btn">Question Paper</a>
                <a href="${p.insertUrl || '#'}" target="_blank" class="action-btn ${!p.insertUrl ? 'disabled' : ''}" ${!p.insertUrl ? 'tabindex="-1"' : ''}>Insert</a>
                <a href="${p.markSchemeUrl || '#'}" target="_blank" class="action-btn ${!p.markSchemeUrl ? 'disabled' : ''}" ${!p.markSchemeUrl ? 'tabindex="-1"' : ''}>Mark Scheme</a>
                <a href="${p.examinerReportUrl || '#'}" target="_blank" class="action-btn ${!p.examinerReportUrl ? 'disabled' : ''}" ${!p.examinerReportUrl ? 'tabindex="-1"' : ''}>Examiner Report</a>
            </div>
        </article>
        `;
    }).join('');
}

init();