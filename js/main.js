//Firebase configuration
const database = firebase.database();

// Set up listener after authentication
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("Authenticated as:", user.email);
    // Set up Firebase listener - this already loads data automatically
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
    
    // Map tab to correct table ID
    const tableMap = {
      'units': 'unitsTable',
      'installment': 'installmentTable',
      'sold': 'soldTable',
      'funds': 'fundsTable',
      'remits': 'remitsTable'
    };
    
    document.getElementById(tableMap[tabType]).classList.add("active");
  });
});


// Open photo modal to view full-size image
function openPhotoModal(photoURL, unitName) {
  // Create modal overlay
  const modal = document.createElement("div");
  modal.classList.add("photo-modal");
  modal.onclick = () => document.body.removeChild(modal);
  
  // Create modal content
  const modalContent = document.createElement("div");
  modalContent.classList.add("photo-modal-content");
  modalContent.onclick = (e) => e.stopPropagation(); // Prevent closing when clicking image
  
  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.classList.add("photo-modal-close");
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => document.body.removeChild(modal);
  
  // Create image
  const img = document.createElement("img");
  img.src = photoURL;
  img.alt = unitName;
  img.classList.add("photo-modal-image");
  
  // Create caption
  const caption = document.createElement("p");
  caption.classList.add("photo-modal-caption");
  caption.textContent = unitName;
  
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(img);
  modalContent.appendChild(caption);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}