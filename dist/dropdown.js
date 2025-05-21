"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const dropdownButton = document.getElementById("dropdown-button");
    const dropdownContent = document.querySelector(".dropdown-content");
    if (dropdownButton && dropdownContent) {
        dropdownButton.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle("show");
        });
        document.querySelectorAll(".dropdown-item").forEach((item) => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                dropdownContent.classList.remove("show");
            });
        });
        window.addEventListener("click", (event) => {
            if (dropdownButton && !dropdownButton.contains(event.target)) {
                // Check if click is outside button
                if (dropdownContent.classList.contains("show")) {
                    dropdownContent.classList.remove("show");
                }
            }
        });
    }
});
