const db = require('./config/db');

async function fixDb() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS student_answers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                result_id INT NOT NULL,
                question_id INT NOT NULL,
                selected_option ENUM('A', 'B', 'C', 'D'),
                is_correct BOOLEAN,
                FOREIGN KEY (result_id) REFERENCES results(id) ON DELETE CASCADE,
                FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
            )
        `);
        console.log("Successfully created student_answers table");
    } catch (e) {
        console.error("ERROR creating table:", e);
    } finally {
        process.exit();
    }
}

fixDb();
