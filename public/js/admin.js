let allExams = [];

// Load exams for dashboard
async function loadExams() {
    const examList = document.getElementById('examList');
    if (!examList) return;

    try {
        const response = await fetch('/api/admin/exams');
        allExams = await response.json();
        renderExams(allExams);
    } catch (error) {
        console.error('Error loading exams:', error);
    }
}

function renderExams(exams) {
    const examList = document.getElementById('examList');
    const now = new Date();

    if (exams.length === 0) {
        examList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: #fff; border-radius: 16px; border: 1px dashed var(--border);">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: #e2e8f0; margin-bottom: 1rem;"></i>
                <p style="color: var(--text-muted); font-weight: 500;">No exams found in this category.</p>
            </div>
        `;
        return;
    }

    examList.innerHTML = exams.map(exam => {
        const scheduledTime = new Date(exam.scheduled_at);
        const endTime = new Date(scheduledTime.getTime() + exam.duration * 60000);

        let statusLabel = exam.status.toUpperCase();
        let statusClass = exam.status === 'published' ? 'badge-success' : 'badge-warning';

        if (exam.status === 'published') {
            if (now >= scheduledTime && now <= endTime) {
                statusLabel = 'ONGOING';
                statusClass = 'badge-info';
            } else if (now < scheduledTime) {
                statusLabel = 'UPCOMING';
                statusClass = 'badge-info';
                // Purple tint for upcoming
            }
        }

        return `
            <div class="exam-card animate-slide-up">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">${exam.title}</h3>
                        <p style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); opacity: 0.7;">CODE: ${exam.exam_code}</p>
                    </div>
                    <span class="badge ${statusClass}">${statusLabel}</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">
                        <i class="far fa-calendar-alt" style="color: var(--primary);"></i>
                        ${scheduledTime.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">
                        <i class="far fa-clock" style="color: var(--secondary);"></i>
                        ${exam.duration} Minutes
                    </div>
                </div>

                <div style="display: flex; gap: 0.75rem; border-top: 1px solid var(--border); padding-top: 1.25rem;">
                    <a href="view-results.html?examId=${exam.id}" class="btn btn-secondary" style="flex: 1; font-size: 0.8rem; padding: 0.6rem;">
                        <i class="fas fa-chart-line"></i> Results
                    </a>
                    <button onclick="downloadCSV(${exam.id})" class="btn btn-secondary" style="padding: 0.6rem; color: var(--secondary); background: rgba(14, 165, 233, 0.05); border: none;">
                        <i class="fas fa-file-csv"></i>
                    </button>
                    <button onclick="deleteExam(${exam.id})" class="btn btn-secondary" style="padding: 0.6rem; color: var(--accent); background: rgba(244, 63, 94, 0.05); border: none;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterExams(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    event.target.classList.add('active');

    const now = new Date();
    let filtered = allExams;

    if (category === 'published') {
        filtered = allExams.filter(e => e.status === 'published');
    } else if (category === 'ongoing') {
        filtered = allExams.filter(e => {
            const start = new Date(e.scheduled_at);
            const end = new Date(start.getTime() + e.duration * 60000);
            return e.status === 'published' && now >= start && now <= end;
        });
    } else if (category === 'upcoming') {
        filtered = allExams.filter(e => {
            const start = new Date(e.scheduled_at);
            return e.status === 'published' && now < start;
        });
    }

    renderExams(filtered);
}

async function deleteExam(id) {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all associated questions and results.')) return;

    try {
        const response = await fetch(`/api/admin/exams/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            allExams = allExams.filter(e => e.id !== id);
            renderExams(allExams);
            alert('Exam deleted successfully');
        } else {
            alert('Error deleting exam');
        }
    } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Error deleting exam');
    }
}

function downloadCSV(examId) {
    window.location.href = `/api/admin/results/${examId}/export`;
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
