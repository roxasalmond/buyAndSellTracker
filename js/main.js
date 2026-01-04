//Firebase configuration
const database = firebase.database();

// Set up listener after authentication
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("Authenticated as:", user.email);
    // Set up Firebase listener
    database.ref("transactions").on("value", (snapshot) => {
      const transactions = snapshot.val();
      console.log("Transactions loaded:", transactions);
      renderTransactionsByType(transactions);
      updateSummary(transactions);
      renderActivityFeed(transactions);
    });
  } else {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
  }
});

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = 'login.html';
    });
  });
}

// Form switching logic (sidebar forms)
const formButtons = document.querySelectorAll(".form-btn");
const formSections = document.querySelectorAll(".form-section");

formButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const formType = button.dataset.form;

    formButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    formSections.forEach((section) => section.classList.remove("active"));
    document.getElementById(`${formType}FormSection`).classList.add("active");
  });
});

// History tab switching logic
const historyTabButtons = document.querySelectorAll(".history-tab-btn");
const transactionSections = document.querySelectorAll(".transaction-section");

historyTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tabType = button.dataset.tab;

    historyTabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    transactionSections.forEach((section) =>
      section.classList.remove("active")
    );
    document.getElementById(`${tabType}Table`).classList.add("active");
  });
});


