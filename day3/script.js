let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" },
];


// 1. Search notes
function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}


// 2. Find the longest note
function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    let longest = notes[0];

    for (let note of notes) {
        if (note.text.length > longest.text.length) {
            longest = note;
        }
    }

    return longest;
}


// 3. Count notes by category
function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category]) {
            counts[note.category]++;
        } else {
            counts[note.category] = 1;
        }
    }

    return counts;
}


// 4. Get summary
function getSummary() {
    let counts = countByCategory();
    let total = notes.length;
    let noteWord = total === 1 ? "note" : "notes";

    return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}


// 5. Check for duplicate
function isDuplicate(text) {
    let cleanedText = text.trim().toLowerCase();

    return notes.some(note =>
        note.text.trim().toLowerCase() === cleanedText
    );
}


// 6. Add a note
function addNote(text, category) {
    let cleanedText = text.trim();

    if (cleanedText.length < 1 || cleanedText.length > 200) {
        console.log("Note not added: text must be 1–200 characters.");
        return false;
    }

    if (isDuplicate(cleanedText)) {
        console.log("Note not added: duplicate note.");
        return false;
    }

    if (!["personal", "work", "study"].includes(category)) {
        console.log("Note not added: invalid category.");
        return false;
    }

    let newNote = {
        id: notes.length + 1,
        text: cleanedText,
        category: category
    };

    notes.push(newNote);

    console.log("Note added successfully.");
    return true;
}


// TESTS

// searchNotes
console.log(searchNotes("day"));
// Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }]

console.log(searchNotes("football"));
// Expected: []


// longestNote
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

console.log("Longest note when notes are empty:", (() => {
    let savedNotes = notes;
    notes = [];
    let result = longestNote();
    notes = savedNotes;
    return result;
})());
// Expected: null


// countByCategory
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

console.log("Count with empty notes:", (() => {
    let savedNotes = notes;
    notes = [];
    let result = countByCategory();
    notes = savedNotes;
    return result;
})());
// Expected: {}


// getSummary
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

console.log("Summary with one note:", (() => {
    let savedNotes = notes;
    notes = [{ id: 1, text: "Test note", category: "personal" }];
    let result = getSummary();
    notes = savedNotes;
    return result;
})());
// Expected: "1 note: 1 personal, 0 work, 0 study."


// isDuplicate
console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true

console.log(isDuplicate("Buy eggs"));
// Expected: false


// addNote
console.log(addNote("Prepare for the JavaScript test", "study"));
// Expected: true

console.log(addNote("  Buy milk and bread  ", "personal"));
// Expected: false (duplicate)

console.log(addNote("", "study"));
// Expected: false (invalid length)

console.log(addNote("Learn HTML", "invalid"));
// Expected: false (invalid category)