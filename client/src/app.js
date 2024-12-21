// Handle register form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.get('email'),
                username: formData.get('username'),
                password: formData.get('password')
            })
        });

        const data = await response.json();
        alert(response.ok ? 'Registration successful!' : `Error: ${data.error}`);
    } catch (err) {
        alert('Error connecting to server');
    }
});

// Handle login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        const data = await response.json();
        alert(response.ok ? 'Login successful!' : `Error: ${data.error}`);
    } catch (err) {
        alert('Error connecting to server');
    }
});