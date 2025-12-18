document.getElementById("registerForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const privateName = document.getElementById("privateName").value.trim();
    const imageUrl = document.getElementById("imageUrl").value.trim();
    const error = document.getElementById("error");

    if (!username || !password || !confirmPassword || !privateName || !imageUrl) {
        error.textContent = "All fields are required";
        return;
    }

    // Validate image URL format
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    if (!urlRegex.test(imageUrl)) {
        error.textContent = "Please enter a valid image URL (must start with http:// or https://)";
        return;
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/.test(password)) {
        error.textContent = "Password must contain at least one letter, one number, and one symbol";
        return;
    }

    if (password.length < 6) {
        error.textContent = "Password must be at least 6 characters";
        return;
    }

    if (password !== confirmPassword) {
        error.textContent = "Passwords must match";
        return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.find(u => u.username === username)) {
        error.textContent = "Username already exists";
        return;
    }

    users.push({ username, password, privateName, imageUrl });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful!");
    window.location.href = "login.html";
});
