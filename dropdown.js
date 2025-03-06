const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.backgroundColor = "black";

  // Dropdown functionality
  const dropdownButton = document.getElementById("dropdown-button");
  const dropdownContent = document.querySelector(".dropdown-content");

  // Toggle dropdown when clicking the button
  dropdownButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    dropdownContent.classList.toggle("show");
  });

  // Handle dropdown item clicks
  document.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event from bubbling up
      // Hide dropdown after clicking an item
      dropdownContent.classList.remove("show");
    });
  });

  // Close the dropdown when clicking outside of it
  window.addEventListener("click", (event) => {
    if (!event.target.matches("#dropdown-button")) {
      if (dropdownContent.classList.contains("show")) {
        dropdownContent.classList.remove("show");
      }
    }
  });
});
