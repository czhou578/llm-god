document.addEventListener('DOMContentLoaded', function () {
    var showPopupButton = document.getElementById('showClaude');
    showPopupButton.addEventListener('click', function () {
        // Get the button's position
        var rect = showPopupButton.getBoundingClientRect();

        // Position the popup above the button
        popup.style.left = rect.left + 'px';
        popup.style.top = (rect.top - popup.offsetHeight) + 'px';

        // Show the popup
        popup.style.display = 'block';
    });

    closePopup.addEventListener('click', function () {
        // Hide the popup
        popup.style.display = 'none';
    });

    // Hide the popup when clicking outside of it
    window.addEventListener('click', function (event) {
        if (event.target != popup && event.target != showPopupButton) {
            popup.style.display = 'none';
        }
    });
});
