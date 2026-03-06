let allBoundaries = [];
let selectedEntry = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../Data/boundaries.json');
        allBoundaries = await response.json();
        setupFilters();
    } catch (error) {
        console.error("Error loading data:", error);
    }
});

function setupFilters() {
    const boardSel = document.getElementById('filter-board');
    const subjectSel = document.getElementById('filter-subject');
    const yearSel = document.getElementById('filter-year');
    
    // 1. Fill Boards
    const boards = [...new Set(allBoundaries.map(b => b.examBoard))].sort();
    boardSel.innerHTML = '<option value="">Select Board</option>';
    boards.forEach(b => boardSel.innerHTML += `<option value="${b}">${b}</option>`);

    // 2. Board Change ➔ Update Subjects
    boardSel.addEventListener('change', () => {
        const filtered = allBoundaries.filter(x => x.examBoard === boardSel.value);
        const subjects = [...new Set(filtered.map(s => s.subject))].sort();
        
        subjectSel.innerHTML = '<option value="">Select Subject</option>';
        subjects.forEach(s => subjectSel.innerHTML += `<option value="${s}">${s}</option>`);
        
        subjectSel.disabled = false;
        yearSel.innerHTML = '<option value="">Select Year</option>';
        yearSel.disabled = true;
        resetDisplay();
    });

    // 3. Subject Change ➔ Update Years
    subjectSel.addEventListener('change', () => {
        const filtered = allBoundaries.filter(x => 
            x.examBoard === boardSel.value && x.subject === subjectSel.value
        );
        const years = [...new Set(filtered.map(y => y.year))].sort((a,b) => b-a);
        
        yearSel.innerHTML = '<option value="">Select Year</option>';
        years.forEach(y => yearSel.innerHTML += `<option value="${y}">${y}</option>`);
        
        yearSel.disabled = false;
        resetDisplay();
    });

    // 4. Year Change ➔ Show Table
    yearSel.addEventListener('change', displayBoundaries);
}

function resetDisplay() {
    document.getElementById('boundaries-body').innerHTML = '<tr><td colspan="3" style="padding: 40px; text-align: center;">Selection required</td></tr>';
    document.getElementById('calc-section').style.display = 'none';
}

function displayBoundaries() {
    const board = document.getElementById('filter-board').value;
    const subject = document.getElementById('filter-subject').value;
    const year = parseInt(document.getElementById('filter-year').value);

    selectedEntry = allBoundaries.find(b => 
        b.examBoard === board && b.subject === subject && b.year === year
    );

    const body = document.getElementById('boundaries-body');
    const calcSection = document.getElementById('calc-section');
    body.innerHTML = '';

    if (selectedEntry) {
        calcSection.style.display = 'block';
        selectedEntry.boundaries.forEach(row => {
            const pct = Math.round((row.mark / selectedEntry.maxMark) * 100);
            body.innerHTML += `
                <tr style="border-bottom: 1px solid #1f1f1f;">
                    <td style="padding: 15px; font-weight: bold; color: #3b82f6;">${row.grade}</td>
                    <td style="padding: 15px;">${row.mark} / ${selectedEntry.maxMark}</td>
                    <td style="padding: 15px; color: #9ca3af;">${pct}%</td>
                </tr>`;
        });
    }
}

window.calculateGrade = function() {
    const score = parseInt(document.getElementById('user-score').value);
    if (isNaN(score) || !selectedEntry) return;

    let grade = "U";
    for (const b of selectedEntry.boundaries) {
        if (score >= b.mark) {
            grade = b.grade;
            break;
        }
    }
    document.getElementById('grade-result').innerHTML = `Estimated Grade: <span style="color: #3b82f6; font-size: 1.5rem;">${grade}</span>`;
};