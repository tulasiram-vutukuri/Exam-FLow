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

    timerInterval = setInterval(() => {
        updateTimerDisplay(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Submitting your exam...');
            submitExam();
        }
        timeLeft--;
    }, 1000);
}

function updateTimerDisplay(timeLeft) {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerEl.innerText = `Time Left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
}

function showQuestion(index) {
    const examData = JSON.parse(localStorage.getItem('currentExam'));
    if (!examData || !examData.questions) return;

    const questions = examData.questions;
    const qContainer = document.getElementById('questionContainer');

    if (questions.length === 0) {
        qContainer.innerHTML = `
            <div style="text-align: center; padding: 5rem; background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border);">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--accent); margin-bottom: 1rem;"></i>
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">No Questions Available</h2>
                <p style="color: var(--text-muted);">This examination currently has no questions. Please contact your instructor.</p>
                <button onclick="window.location.href='student-dashboard.html'" class="btn btn-primary" style="margin-top: 2rem;">Back to Dashboard</button>
            </div>
        `;
        return;
    }

    if (!questions[index]) return;

    const q = questions[index];
    currentQuestionIndex = index;

    qContainer.innerHTML = `
        <div class="exam-layout animate-slide-up" style="margin-top: 2rem;">
            <!-- Left: Question Numbers -->
            <div class="question-numbers">
                <div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                    <span id="timer" class="badge badge-info" style="font-size: 0.8rem; padding: 0.5rem; display: block; text-align: center;">--:--</span>
                </div>
                ${questions.map((_, i) => `
                    <div class="q-num-btn ${i === index ? 'active' : ''} ${userAnswers[questions[i].id] ? 'answered' : ''}" 
                         onclick="navigateQuestion(${i})"
                         style="${userAnswers[questions[i].id] && i !== index ? 'border-color: var(--accent); color: var(--accent);' : ''}">
                        ${i + 1}
                    </div>
                `).join('')}
            </div>

            <!-- Middle: Question Section -->
            <div class="question-section">
                <span style="color: var(--accent); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; display: block;">
                    Question ${index + 1} of ${questions.length}
                </span>
                <h2 style="font-size: 1.5rem; font-weight: 600; color: var(--text-main); line-height: 1.4;">
                    ${q.question}
                </h2>
            </div>

            <!-- Right: Options Section -->
            <div class="options-section">
                ${['A', 'B', 'C', 'D'].map(opt => {
        const optKey = `option_${opt.toLowerCase()}`;
        const isSelected = userAnswers[q.id] === opt;
        return `
                        <label class="option-card ${isSelected ? 'selected' : ''}" onclick="selectOption('${q.id}', '${opt}')">
                            <input type="radio" name="q_${q.id}" value="${opt}" ${isSelected ? 'checked' : ''} style="display: none;">
                            <span style="font-weight: 500; font-size: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                                <span style="width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; background: ${isSelected ? 'var(--accent)' : 'transparent'}; color: ${isSelected ? 'white' : 'inherit'}; border-color: ${isSelected ? 'var(--accent)' : 'var(--border)'};">
                                    ${opt}
                                </span>
                                ${q[optKey]}
                            </span>
                        </label>
                    `;
    }).join('')}
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    ${index > 0 ? `<button type="button" onclick="navigateQuestion(${index - 1})" class="btn btn-secondary" style="flex: 1;">Previous</button>` : ''}
                    ${index < questions.length - 1
            ? `<button type="button" onclick="navigateQuestion(${index + 1})" class="btn btn-primary" style="flex: 1;">Next Question</button>`
            : `<button type="button" onclick="submitExam()" class="btn btn-primary" style="flex: 1;">Finish Exam</button>`
        }
                </div>
            </div>
        </div>
    `;
}

function selectOption(qId, val) {
    userAnswers[qId] = val;
    showQuestion(currentQuestionIndex);
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

let isSubmitting = false;

async function submitExam() {
    if (isSubmitting) return;

    const examData = JSON.parse(localStorage.getItem('currentExam'));
    const qId = examData.questions[currentQuestionIndex].id;
    saveAnswer(qId);

    try {
        isSubmitting = true;

        // Update button UI to show it's processing
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
        const submitBtn = Array.from(buttons).find(b => b.innerText.includes('Finish Exam'));
        if (submitBtn) submitBtn.innerText = 'Submitting...';

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
            window.location.replace('result.html');
        } else {
            alert('Server error: ' + (data.message || 'Unknown error'));
            isSubmitting = false;
            if (submitBtn) submitBtn.innerText = 'Finish Exam';
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        console.error(error);
        alert('Error submitting exam. Please check your connection.');
        isSubmitting = false;

        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = false);
        const submitBtn = Array.from(buttons).find(b => b.innerText.includes('Submitting...'));
        if (submitBtn) submitBtn.innerText = 'Finish Exam';
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
