const db = require('./config/db');

async function test() {
    try {
        const [exams] = await db.execute('SELECT * FROM exams');
        const [questions] = await db.execute('SELECT * FROM questions');
        const [users] = await db.execute('SELECT * FROM users');
        console.log('Exams:', exams.length, exams);
        console.log('Questions:', questions.length, questions);
        console.log('Users:', users.length, users);

        // Let's try to mock the submit-exam logic
        if (exams.length > 0 && questions.length > 0) {
            const student_username = users.find(u => u.role === 'student')?.username || 'test_student';
            const exam_id = exams[0].id;
            const answers = {};
            answers[questions[0].id] = 'A';

            // Fetch correct answers
            const [q2] = await db.execute('SELECT id, correct_option FROM questions WHERE exam_id = ?', [exam_id]);
            let score = 0;
            const total = q2.length;
            q2.forEach(q => {
                if (answers[q.id] === q.correct_option) score++;
            });
            console.log('Score calculated:', score, '/', total);

            const [result] = await db.execute(
                'INSERT INTO results (student_username, exam_id, score, total) VALUES (?, ?, ?, ?)',
                [student_username, exam_id, score, total]
            );
            console.log('Inserted result:', result.insertId);

            const result_id = result.insertId;
            for (const q of q2) {
                const selected = answers[q.id] || null;
                const is_correct = selected === q.correct_option;
                await db.execute(
                    'INSERT INTO student_answers (result_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)',
                    [result_id, q.id, selected, is_correct]
                );
            }
            console.log('Inserted answers successfully.');
        } else {
            console.log("Not enough data to mock submission");
        }
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        process.exit();
    }
}
test();
