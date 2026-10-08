const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");
const body = document.body;

const MAX_CHARS = 200;
const WARNING_LIMIT = 180;

function updateCounts() {
    const text = noteText.value;
    const characters = text.length;

    const words = text.trim() === ""
        ? 0
        : text.trim().split(/\s+/).length;

    charCount.textContent = `${characters} / ${MAX_CHARS} characters`;
    wordCount.textContent = `${words} words`;

    charCount.classList.remove("warning", "over");

    if (characters > MAX_CHARS) {
        charCount.classList.add("over");
    } else if (characters > WARNING_LIMIT) {
        charCount.classList.add("warning");
    }
}

function saveDraft() {
    localStorage.setItem("quickNotesDraft", noteText.value);
}

function clearEverything() {
    noteText.value = "";

    localStorage.removeItem("quickNotesDraft");

    updateCounts();
}

function applyTheme(theme) {
    if (theme === "dark") {
        body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    } else {
        body.classList.remove("dark");
        themeToggle.textContent = "Dark mode";
    }
}

function toggleTheme() {
    const isDark = body.classList.contains("dark");

    if (isDark) {
        applyTheme("light");
        localStorage.setItem("quickNotesTheme", "light");
    } else {
        applyTheme("dark");
        localStorage.setItem("quickNotesTheme", "dark");
    }
}

noteText.addEventListener("input", () => {
    updateCounts();
    saveDraft();
});

clearBtn.addEventListener("click", clearEverything);

themeToggle.addEventListener("click", toggleTheme);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        clearEverything();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const savedDraft = localStorage.getItem("quickNotesDraft");
    const savedTheme = localStorage.getItem("quickNotesTheme");

    if (savedDraft !== null) {
        noteText.value = savedDraft;
    }

    if (savedTheme !== null) {
        applyTheme(savedTheme);
    }

    updateCounts();
});