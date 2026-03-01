async function loadAvailableExams() {
    const availableExams = document.getElementById('availableExams');
    if (!availableExams) return;

    try {
        const response = await fetch('/api/student/available-exams');
        const exams = await response.json();

        availableExams.innerHTML = exams.map(exam => `
            <div class="exam-card">
                <h3>${exam.title}</h3>
                <p style="font-size: 0.85rem; color: #6b7280; margin: 0.5rem 0;">
                    <i class="far fa-calendar-alt"></i> ${new Date(exam.scheduled_at).toLocaleString()}<br>
                    <i class="far fa-clock"></i> ${exam.duration} Minutes
                </p>
                <div style="margin-top: 1rem; padding: 0.5rem; background: #fef3c7; color: #92400e; border-radius: 0.25rem; font-size: 0.85rem; text-align: center; font-weight: 500;">
                    ${new Date() < new Date(exam.scheduled_at) ? 'Coming Soon' : 'Available Now - Enter Code'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

// Start Exam Form
const startExamForm = document.getElementById('startExamForm');
if (startExamForm) {
    startExamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('examCode').value;
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

    // Save previous question answer before moving if possible
    // (This is handled by the "Next" button too, but for safety)

    qContainer.innerHTML = `
        <div class="card" style="margin-top: 1.5rem;">
            <p style="color: #6b7280; margin-bottom: 0.5rem;">Question ${index + 1} of ${questions.length}</p>
            <p style="font-size: 1.2rem; font-weight: 500;"><strong>Q${index + 1}.</strong> ${q.question}</p>
            <div style="margin-top: 1.5rem;">
                <label style="display: block; margin: 0.8rem 0; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 0.4rem; cursor: pointer;">
                    <input type="radio" name="q_${q.id}" value="A" ${userAnswers[q.id] === 'A' ? 'checked' : ''}> A. ${q.option_a}
                </label>
                <label style="display: block; margin: 0.8rem 0; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 0.4rem; cursor: pointer;">
                    <input type="radio" name="q_${q.id}" value="B" ${userAnswers[q.id] === 'B' ? 'checked' : ''}> B. ${q.option_b}
                </label>
                <label style="display: block; margin: 0.8rem 0; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 0.4rem; cursor: pointer;">
                    <input type="radio" name="q_${q.id}" value="C" ${userAnswers[q.id] === 'C' ? 'checked' : ''}> C. ${q.option_c}
                </label>
                <label style="display: block; margin: 0.8rem 0; padding: 0.8rem; border: 1px solid #e5e7eb; border-radius: 0.4rem; cursor: pointer;">
                    <input type="radio" name="q_${q.id}" value="D" ${userAnswers[q.id] === 'D' ? 'checked' : ''}> D. ${q.option_d}
                </label>
            </div>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            ${index > 0 ? `<button onclick="navigateQuestion(${index - 1})" class="btn" style="flex: 1; border: 1px solid var(--primary-color); color: var(--primary-color);">Previous</button>` : ''}
            ${index < questions.length - 1
            ? `<button onclick="navigateQuestion(${index + 1})" class="btn btn-primary" style="flex: 1;">Next</button>`
            : `<button onclick="submitExam()" class="btn btn-secondary" style="flex: 1; background: #10b981; color: white;">Submit Exam</button>`
        }
        </div>
    `;

    // Make whole labels clickable for radio selection
    document.querySelectorAll('#questionContainer label').forEach(label => {
        label.onclick = function () {
            this.querySelector('input').checked = true;
            saveAnswer(q.id);
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
    saveAnswer(qId); // Save the last question's answer

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
            window.location.href = 'result.html';
        }
    } catch (error) {
        alert('Error submitting exam');
    }
}

// Initialize
if (document.getElementById('availableExams')) {
    loadAvailableExams();
    loadPastResults();
}

async function loadPastResults() {
    const pastResultsBody = document.getElementById('pastResultsBody');
    if (!pastResultsBody) return;

    const username = localStorage.getItem('username');
    try {
        const response = await fetch(`/api/student/past-results/${username}`);
        const results = await response.json();

        if (results.length === 0) {
            pastResultsBody.innerHTML = '<tr><td colspan="4" style="padding: 2rem; text-align: center;">You haven\'t attended any exams yet.</td></tr>';
            return;
        }

        pastResultsBody.innerHTML = results.map(res => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 1rem;">${res.title}</td>
                <td style="padding: 1rem;">${res.score}</td>
                <td style="padding: 1rem;">${res.total}</td>
                <td style="padding: 1rem;">${new Date(res.submitted_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading past results:', error);
    }
}
