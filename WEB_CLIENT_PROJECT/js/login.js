document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");
    const submitBtn = this.querySelector('button[type="submit"]');

    // Disable submit button during request
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
    error.textContent = "";

    try {
        // Make API call to server
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            // Show error from server
            error.textContent = data.error || 'Login failed';
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
            return;
        }

        // Success - store session token and user data
        localStorage.setItem("sessionToken", data.sessionToken);
        localStorage.setItem("loggedUser", JSON.stringify(data.user));
        sessionStorage.setItem("currentUser", username);

        // Redirect to search page
        window.location.href = "search.html";
    } catch (err) {
        console.error('Login error:', err);
        error.textContent = "Network error. Please make sure the server is running.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
    }
});

