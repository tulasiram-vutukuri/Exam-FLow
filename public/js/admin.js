// Load exams for dashboard
async function loadExams() {
    const examList = document.getElementById('examList');
    if (!examList) return;

    try {
        const response = await fetch('/api/admin/exams');
        const exams = await response.json();

        examList.innerHTML = exams.map(exam => `
            <div class="exam-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <h3 style="font-weight: 700; color: var(--text-main);">${exam.title}</h3>
                    <span style="font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; 
                        background: ${exam.status === 'published' ? '#dcfce7' : '#fef3c7'}; 
                        color: ${exam.status === 'published' ? '#166534' : '#92400e'};">
                        ${exam.status.toUpperCase()}
                    </span>
                </div>
                <div style="background: #f1f5f9; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Entrance Code</p>
                    <p style="font-family: monospace; font-size: 1.25rem; font-weight: 700; color: var(--primary); letter-spacing: 2px;">${exam.exam_code}</p>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                    <p><i class="far fa-calendar-alt"></i> ${new Date(exam.scheduled_at).toLocaleString()}</p>
                    <p><i class="far fa-clock"></i> ${exam.duration} Minutes</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <a href="view-results.html?examId=${exam.id}" class="btn btn-secondary" style="flex: 1; padding: 0.6rem; font-size: 0.85rem;">
                        <i class="fas fa-chart-bar"></i> Results
                    </a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

// Create Exam Form
const createExamForm = document.getElementById('createExamForm');
if (createExamForm) {
    createExamForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const scheduled_at = document.getElementById('scheduledAt').value;
        const duration = document.getElementById('duration').value;

        try {
            const response = await fetch('/api/admin/create-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, scheduled_at, duration })
            });

            const data = await response.json();
            if (response.ok) {
                document.getElementById('examFormSection').style.display = 'none';
                document.getElementById('questionSection').style.display = 'block';
                document.getElementById('currentExamId').value = data.id;
                document.getElementById('generatedCode').innerText = data.exam_code;
            }
        } catch (error) {
            alert('Error creating exam');
        }
    });
}

// Add Question Form
const addQuestionForm = document.getElementById('addQuestionForm');
if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const exam_id = document.getElementById('currentExamId').value;
        const question = document.getElementById('questionText').value;
        const option_a = document.getElementById('optionA').value;
        const option_b = document.getElementById('optionB').value;
        const option_c = document.getElementById('optionC').value;
        const option_d = document.getElementById('optionD').value;
        const correct_option = document.getElementById('correctOption').value;

        try {
            const response = await fetch('/api/admin/add-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exam_id, question, option_a, option_b, option_c, option_d, correct_option })
            });

            if (response.ok) {
                alert('Question added!');
                addQuestionForm.reset();
            }
        } catch (error) {
            alert('Error adding question');
        }
    });
}

async function publishExam() {
    const exam_id = document.getElementById('currentExamId').value;
    try {
        const response = await fetch('/api/admin/publish-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exam_id })
        });

        if (response.ok) {
            alert('Exam published successfully!');
            window.location.href = 'admin-dashboard.html';
        }
    } catch (error) {
        alert('Error publishing exam');
    }
}

// Initialize
if (document.getElementById('examList')) {
    loadExams();
}
