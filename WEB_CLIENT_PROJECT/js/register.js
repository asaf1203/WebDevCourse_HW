document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const privateName = document.getElementById("privateName").value.trim();
    const imageUrl = document.getElementById("imageUrl").value.trim();
    const error = document.getElementById("error");
    const submitBtn = this.querySelector('button[type="submit"]');

    // Client-side validation
    if (!username || !password || !confirmPassword || !privateName || !imageUrl) {
        error.textContent = "All fields are required";
        return;
    }

    if (password !== confirmPassword) {
        error.textContent = "Passwords must match";
        return;
    }

    // Disable submit button during request
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";
    error.textContent = "";

    try {
        // Make API call to server
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                privateName,
                imageUrl
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Show error from server
            error.textContent = data.error || 'Registration failed';
            submitBtn.disabled = false;
            submitBtn.textContent = "Register";
            return;
        }

        // Success - redirect to login
        alert("Registration successful!");
        window.location.href = "login.html";
    } catch (err) {
        console.error('Registration error:', err);
        error.textContent = "Network error. Please make sure the server is running.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
    }
});

