"use strict";

const API_URL = "https://jsonplaceholder.typicode.com/users";

const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusMessage = document.getElementById("status");
const usersList = document.getElementById("users-list");

// Store the users after they have been fetched.
let users = [];

// Display a status message and optionally apply a CSS class.
function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// Render an array of users on the page.
function renderUsers(list) {
  // Clear the existing list before rendering.
  usersList.replaceChildren();

  if (list.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No users match your filter.";
    usersList.appendChild(emptyMessage);
    return;
  }

  list.forEach((user) => {
    const listItem = document.createElement("li");
    const name = document.createElement("h3");
    const email = document.createElement("p");
    const company = document.createElement("p");

    name.textContent = user.name;
    email.textContent = `Email: ${user.email}`;
    company.textContent = `Company: ${user.company.name}`;

    listItem.append(name, email, company);
    usersList.appendChild(listItem);
  });
}

// Fetch users from the API.
async function loadUsers() {
  loadButton.disabled = true;
  setStatus("Loading users...");
  usersList.replaceChildren();

  try {
    const response = await fetch(API_URL);

    // fetch() does not automatically reject HTTP errors such as 404.
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("The API returned an unexpected response.");
    }

    users = data;
    renderUsers(users);
    setStatus(`Successfully loaded ${users.length} users.`, "success");
  } catch (error) {
    users = [];
    usersList.replaceChildren();

    setStatus(
      `Unable to load users. ${error.message}. Please try again.`,
      "error"
    );
  } finally {
    // Re-enable the button whether the request succeeds or fails.
    loadButton.disabled = false;
  }
}

// Filter the stored users by name without another API request.
function filterUsers() {
  const searchTerm = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm)
  );

  renderUsers(filteredUsers);

  if (users.length > 0) {
    if (filteredUsers.length === 0) {
      setStatus("No users match your filter.");
    } else {
      setStatus(
        `Showing ${filteredUsers.length} of ${users.length} users.`
      );
    }
  }
}

// Attach event listeners.
loadButton.addEventListener("click", loadUsers);
filterInput.addEventListener("input", filterUsers);