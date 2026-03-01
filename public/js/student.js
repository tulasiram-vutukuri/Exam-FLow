async function loadAvailableExams() {
    const availableExams = document.getElementById('availableExams');
    if (!availableExams) return;

    try {
        const response = await fetch('/api/student/available-exams');
        const exams = await response.json();

        if (exams.length === 0) {
            availableExams.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border-radius: 16px; border: 1px dashed var(--border);">
                    <p style="color: var(--text-muted); font-weight: 500;">No exams available at the moment.</p>
                </div>
            `;
            return;
        }

        availableExams.innerHTML = exams.map(exam => {
            const now = new Date();
            const start = new Date(exam.scheduled_at);
            const isSoon = now < start;

            return `
                <div class="exam-card animate-slide-up">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <h3 style="font-weight: 700; font-size: 1.1rem;">${exam.title}</h3>
                        <span class="badge ${isSoon ? 'badge-warning' : 'badge-success'}">
                            ${isSoon ? 'UPCOMING' : 'AVAILABLE'}
                        </span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                        <p style="margin-bottom: 0.5rem;"><i class="far fa-calendar-alt" style="color: var(--secondary); margin-right: 0.5rem;"></i> ${start.toLocaleString()}</p>
                        <p><i class="far fa-clock" style="color: var(--accent); margin-right: 0.5rem;"></i> ${exam.duration} Minutes</p>
                    </div>
                    <button onclick="document.getElementById('examCode').value = '${exam.exam_code}'; document.getElementById('examCode').focus();" class="btn btn-secondary" style="width: 100%; font-size: 0.8rem; border-color: var(--primary); color: var(--primary);">
                        Enter Exam
                    </button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

// Start Exam Form
const startExamForm = document.getElementById('startExamForm');
if (startExamForm) {
    startExamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('examCode').value.toUpperCase();
        const errorEl = document.getElementById('examError');

        try {
            const response = await fetch(`/api/student/exam/${code}`);
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('currentExam', JSON.stringify(data));
                window.location.href = 'attend-exam.html';
            } else {
                errorEl.innerText = data.message;
                errorEl.style.display = 'block';
            }
        } catch (error) {
            errorEl.innerText = 'Error starting exam';
            errorEl.style.display = 'block';
        }
    });
}

// Attend Exam Logic
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval;

if (window.location.pathname.includes('attend-exam.html')) {
    const examData = JSON.parse(localStorage.getItem('currentExam'));
    if (!examData) {
        window.location.href = 'student-dashboard.html';
    } else {
        document.getElementById('examTitle').innerText = examData.exam.title;
        showQuestion(0);
        startTimer(examData.exam.duration);
    }
}

function startTimer(durationMinutes) {
    let timeLeft = durationMinutes * 60;
    const timerEl = document.getElementById('timer');

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        timerEl.innerText = `Time Left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting your exam...');
            submitExam();
        }
        timeLeft--;
    }, 1000);
}

function showQuestion(index) {
    const examData = JSON.parse(localStorage.getItem('currentExam'));
    const questions = examData.questions;
    const qContainer = document.getElementById('questionContainer');
    const q = questions[index];

    qContainer.innerHTML = `
        <div class="card animate-slide-up" style="margin-top: 1.5rem; border-left: 6px solid var(--primary);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <span style="color: var(--text-muted); font-weight: 700; font-size: 0.9rem;">QUESTION ${index + 1} OF ${questions.length}</span>
                <span class="badge badge-info" id="timer">Loading...</span>
            </div>
            <p style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); line-height: 1.4; margin-bottom: 2.5rem;">${q.question}</p>
            
            <div style="display: grid; gap: 1rem;">
                ${['A', 'B', 'C', 'D'].map(opt => {
        const optKey = `option_${opt.toLowerCase()}`;
        const isSelected = userAnswers[q.id] === opt;
        return `
                        <label class="option-label" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: ${isSelected ? 'var(--bg-main)' : '#fff'};">
                            <input type="radio" name="q_${q.id}" value="${opt}" ${isSelected ? 'checked' : ''} style="accent-color: var(--primary); width: 1.2rem; height: 1.2rem;">
                            <span style="font-weight: 600; font-size: 1rem;">${opt}. ${q[optKey]}</span>
                        </label>
                    `;
    }).join('')}
            </div>
        </div>
        <div style="display: flex; gap: 1.5rem; margin-top: 2.5rem;">
            ${index > 0 ? `<button onclick="navigateQuestion(${index - 1})" class="btn btn-secondary" style="flex: 1; padding: 1rem;">Previous</button>` : ''}
            ${index < questions.length - 1
            ? `<button onclick="navigateQuestion(${index + 1})" class="btn btn-primary" style="flex: 1; padding: 1rem;">Save & Next <i class="fas fa-chevron-right"></i></button>`
            : `<button onclick="submitExam()" class="btn btn-primary" style="flex: 1; padding: 1rem; background: var(--secondary-gradient);">Submit Examination <i class="fas fa-check-double"></i></button>`
        }
        </div>
    `;

    document.querySelectorAll('.option-label').forEach(label => {
        label.onclick = function () {
            this.querySelector('input').checked = true;
            saveAnswer(q.id);
            // Refresh visuals
            document.querySelectorAll('.option-label').forEach(l => {
                l.style.borderColor = 'var(--border)';
                l.style.background = '#fff';
            });
            this.style.borderColor = 'var(--primary)';
            this.style.background = 'var(--bg-main)';
        };
    });
}

function saveAnswer(qId) {
    const selected = document.querySelector(`input[name="q_${qId}"]:checked`);
    if (selected) {
        userAnswers[qId] = selected.value;
    }
}

function navigateQuestion(newIndex) {
    const examData = JSON.parse(localStorage.getItem('currentExam'));
    const qId = examData.questions[currentQuestionIndex].id;
    saveAnswer(qId);
    currentQuestionIndex = newIndex;
    showQuestion(currentQuestionIndex);
}

async function submitExam() {
    const examData = JSON.parse(localStorage.getItem('currentExam'));
    const qId = examData.questions[currentQuestionIndex].id;
    saveAnswer(qId);

    try {
        const response = await fetch('/api/student/submit-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_username: localStorage.getItem('username'),
                exam_id: examData.exam.id,
                answers: userAnswers
            })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('lastScore', data.score);
            localStorage.setItem('lastTotal', data.total);
            localStorage.setItem('lastResultId', data.result_id);
            window.location.href = 'result.html';
        }
    } catch (error) {
        alert('Error submitting exam');
    }
}

async function loadPastResults() {
    const pastResultsBody = document.getElementById('pastResultsBody');
    if (!pastResultsBody) return;

    const username = localStorage.getItem('username');
    try {
        const response = await fetch(`/api/student/past-results/${username}`);
        const results = await response.json();

        // Update Stats
        if (document.getElementById('statExamsTaken')) {
            document.getElementById('statExamsTaken').innerText = results.length;
            const avg = results.length > 0
                ? (results.reduce((acc, r) => acc + (r.score / r.total), 0) / results.length * 100).toFixed(1)
                : 0;
            document.getElementById('statAvgScore').innerText = `${avg}%`;
        }

        if (results.length === 0) {
            pastResultsBody.innerHTML = '<tr><td colspan="4" style="padding: 3rem; text-align: center; color: var(--text-muted);">No results found. Start your first exam!</td></tr>';
            return;
        }

        pastResultsBody.innerHTML = results.map(res => `
            <tr>
                <td style="font-weight: 700;">${res.title}</td>
                <td>
                    <span style="font-weight: 800; color: var(--primary);">${res.score}</span> / ${res.total}
                </td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">${new Date(res.submitted_at).toLocaleDateString()}</td>
                <td>
                    <a href="result-details.html?id=${res.id}" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">
                        <i class="fas fa-search"></i> Details
                    </a>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading past results:', error);
    }
}

// Initialize
if (document.getElementById('availableExams')) {
    loadAvailableExams();
    loadPastResults();
}
if (document.getElementById('pastResultsBody') && !document.getElementById('availableExams')) {
    loadPastResults();
}
