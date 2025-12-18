document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const error = document.getElementById("error");

    // Check if user exists with matching credentials
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        error.textContent = "Invalid credentials";
        return;
    }

    // Save username to sessionStorage and full user to localStorage
    sessionStorage.setItem("currentUser", username);
    localStorage.setItem("loggedUser", JSON.stringify(user));
    window.location.href = "search.html";
});
