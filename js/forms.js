// Handle Unit Form submission
document.getElementById("unitForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cost = parseFloat(document.getElementById("unitAmount").value);

  // Generate transaction ID for unit
  const transactionId = await getNextTransactionId();

  const unitData = {
    type: "unit",
    transactionId: transactionId,
    name: document.getElementById("unitName").value,
    category: document.getElementById("unitCategory").value,
    imei: document.getElementById("unitImei").value,
    condition: document.getElementById("unitCondition").value,
    date: document.getElementById("unitDate").value,
    cost: cost,
    soldFor: null,
    status: "in-stock",
    createdBy: auth.currentUser.email,
    createdAt: Date.now(), 
    timestamp: Date.now(),
  };

  try {
    // Add the unit and GET ITS ID
    const unitRef = await database.ref("transactions").push(unitData);
    const unitId = unitRef.key;

    // Generate transaction ID for expense
    const expenseTransactionId = await getNextTransactionId();

    // Create an EXPENSE transaction (not remit!)
    const expenseData = {
      type: "expense", // Changed from "remit"
      transactionId: expenseTransactionId,
      unitId: unitId,
      date: document.getElementById("unitDate").value,
      amount: cost,
      reason: `Unit purchase: ${unitData.name}`,
      createdBy: auth.currentUser.email,
      createdAt: Date.now(),
      timestamp: Date.now(),
    };
    await database.ref("transactions").push(expenseData);

    e.target.reset();
    alert("Unit added successfully! Fund deducted.");
  } catch (error) {
    console.error("Error adding unit:", error);
    alert("Failed to add unit");
  }
});

// Handle Fund Form submission
document.getElementById("fundForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Generate transaction ID
  const transactionId = await getNextTransactionId();

  const fundData = {
    type: "fund",
    transactionId: transactionId, // ADD THIS
    date: document.getElementById("fundDate").value,
    amount: parseFloat(document.getElementById("fundAmount").value),
    createdBy: auth.currentUser.email,
    createdAt: Date.now(),
    timestamp: Date.now(),
  };

  try {
    await database.ref("transactions").push(fundData);
    e.target.reset();
    alert("Fund added successfully!");
  } catch (error) {
    console.error("Error adding fund:", error);
    alert("Failed to add fund");
  }
});

// Handle Remit Form submission
document.getElementById("remitForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Generate transaction ID
  const transactionId = await getNextTransactionId();

  const remitData = {
    type: "remit",
    transactionId: transactionId, // ADD THIS
    date: document.getElementById("remitDate").value,
    amount: parseFloat(document.getElementById("remitAmount").value),
    createdBy: auth.currentUser.email,
    createdAt: Date.now(),
    timestamp: Date.now(),
  };

  try {
    await database.ref("transactions").push(remitData);
    e.target.reset();
    alert("Remittance recorded successfully!");
  } catch (error) {
    console.error("Error recording remittance:", error);
    alert("Failed to record remittance");
  }
});

// Show/hide IMEI input based on unit category
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('unitCategory').addEventListener('change', function(e) {
    const imeiInput = document.getElementById('unitImei');
    
    if (e.target.value === 'Android' || e.target.value === 'IOS') {
      imeiInput.style.display = 'block';
      imeiInput.required = true;
    } else {
      imeiInput.style.display = 'none';
      imeiInput.required = false;
      imeiInput.value = '';
    }
  });
});