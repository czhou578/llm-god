document.addEventListener("DOMContentLoaded", () => {
  // document.body.style.backgroundColor = "black"; // Already set in preload or CSS

  const dropdownButton = document.getElementById("dropdown-button") as HTMLButtonElement | null;
  const dropdownContent = document.querySelector(".dropdown-content") as HTMLElement | null;

  if (dropdownButton && dropdownContent) {
    dropdownButton.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      dropdownContent.classList.toggle("show");
    });

    document.querySelectorAll<HTMLElement>(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();
        dropdownContent.classList.remove("show");
      });
    });

    window.addEventListener("click", (event: MouseEvent) => {
      if (dropdownButton && !dropdownButton.contains(event.target as Node)) { // Check if click is outside button
        if (dropdownContent.classList.contains("show")) {
          dropdownContent.classList.remove("show");
        }
      }
    });
  }
});
