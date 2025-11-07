// Array of available style sheets
const styles = ['basic.css', 'dark.css', 'modern.css'];
let currentStyleIndex = 0;

// Get the link element that contains the stylesheet
const styleLink = document.querySelector('link[rel="stylesheet"]');

// Get the toggle button
const toggleButton = document.getElementById('styleToggle');

// Add click event listener to the button
toggleButton.addEventListener('click', function () {
    // Increment the index and wrap around if we reach the end
    currentStyleIndex = (currentStyleIndex + 1) % styles.length;

    // Update the href of the link element to point to the new stylesheet
    styleLink.href = `SKINS/${styles[currentStyleIndex]}`;

    // Update the button text to show which style is currently active
    toggleButton.textContent = `Style: ${styles[currentStyleIndex].replace('.css', '')}`;
});

// Initialize the button text
toggleButton.textContent = `Style: ${styles[currentStyleIndex].replace('.css', '')}`;
