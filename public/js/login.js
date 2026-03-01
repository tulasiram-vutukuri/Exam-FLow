const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('error');

        errorMsg.style.display = 'none';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('username', data.username);

                if (data.role === 'admin') {
                    window.location.href = '/pages/admin-dashboard.html';
                } else {
                    window.location.href = '/pages/student-dashboard.html';
                }
            } else {
                errorMsg.innerText = data.message || 'Invalid credentials';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            errorMsg.innerText = 'Unable to connect to server. Please try again.';
            errorMsg.style.display = 'block';
            console.error(error);
        }
    });
}
