// Your web app's Firebase configuration
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
    });
  }
});

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
    const tabType = button.dataset.tab; // 'units', 'funds', or 'remits'

    historyTabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    transactionSections.forEach((section) =>
      section.classList.remove("active")
    );
    document.getElementById(`${tabType}Table`).classList.add("active");
  });
});

// Handle Unit Form submission
document.getElementById('unitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const cost = parseFloat(document.getElementById('unitAmount').value);
  
  const unitData = {
    type: 'unit',
    name: document.getElementById('unitName').value,
    condition: document.getElementById('unitCondition').value,
    date: document.getElementById('unitDate').value,
    cost: cost,
    soldFor: null,
    status: 'in-stock',
    timestamp: Date.now()
  };
  
  try {
    // Add the unit
    await database.ref('transactions').push(unitData);
    
    // Create a remit transaction to deduct from fund
    const remitData = {
      type: 'remit',
      date: document.getElementById('unitDate').value,
      amount: cost,
      reason: `Unit purchase: ${unitData.name}`,  // Optional: track why
      timestamp: Date.now()
    };
    await database.ref('transactions').push(remitData);
    
    e.target.reset();
    alert('Unit added successfully! Fund deducted.');
  } catch (error) {
    console.error('Error adding unit:', error);
    alert('Failed to add unit');
  }
});

// Handle Fund Form submission
document.getElementById("fundForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fundData = {
    type: "fund",
    date: document.getElementById("fundDate").value,
    amount: parseFloat(document.getElementById("fundAmount").value),
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

  const remitData = {
    type: "remit",
    date: document.getElementById("remitDate").value,
    amount: parseFloat(document.getElementById("remitAmount").value),
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


// Render transactions separated by type
function renderTransactionsByType(transactions) {
  const unitsBody = document.getElementById("units-body");
  const fundsBody = document.getElementById("funds-body");
  const remitsBody = document.getElementById("remits-body");

  // Clear all tables
  unitsBody.innerHTML = "";
  fundsBody.innerHTML = "";
  remitsBody.innerHTML = "";

  if (!transactions) {
    console.log("No transactions found");
    return;
  }

  // Convert to array and sort by timestamp (newest first)
  const transactionsArray = Object.entries(transactions).map(
    ([key, value]) => ({
      id: key,
      ...value,
    })
  );

  transactionsArray.sort((a, b) => b.timestamp - a.timestamp);

  // ========== UNITS SECTION START ==========
  transactionsArray.forEach((transaction) => {
    if (transaction.type === "unit") {
      const row = document.createElement("tr");

      // Mark deleted rows
      if (transaction.deleted) {
        row.classList.add("deleted-row");
      }

      const isSold = transaction.status === "sold";

      const nameCell = document.createElement("td");
      nameCell.setAttribute("data-label", "Unit Name");
      nameCell.textContent = transaction.name;

      const conditionCell = document.createElement("td");
      conditionCell.setAttribute("data-label", "Condition");
      conditionCell.textContent = transaction.condition;

      const dateCell = document.createElement("td");
      dateCell.setAttribute("data-label", "Date");
      dateCell.textContent = transaction.date;

      const costCell = document.createElement("td");
      costCell.setAttribute("data-label", "Cost");
      costCell.textContent = `₱${(transaction.cost || 0).toFixed(2)}`;

      const statusCell = document.createElement("td");
      statusCell.setAttribute("data-label", "Status");

      const statusBadge = document.createElement("span");
      statusBadge.classList.add("status-badge");

      if (isSold) {
        statusBadge.classList.add("status-sold");
        statusBadge.textContent = "Sold";
      } else {
        statusBadge.classList.add("status-in-stock");
        statusBadge.textContent = "In Stock";
      }

      statusCell.appendChild(statusBadge);

      const soldCell = document.createElement("td");
      soldCell.setAttribute("data-label", "Sold For");

      if (isSold) {
        soldCell.classList.add("income");
        soldCell.textContent = `₱${transaction.soldFor.toFixed(2)}`;
      } else {
        const soldInput = document.createElement("input");
        soldInput.type = "number";
        soldInput.classList.add("sold-input");
        soldInput.id = `sold-${transaction.id}`;
        soldInput.placeholder = "₱ 0.00";
        soldInput.step = "0.01";
        soldCell.appendChild(soldInput);
      }

      const actionCell = document.createElement("td");
      actionCell.setAttribute("data-label", "Action");

      if (isSold) {
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");

        if (transaction.deleted) {
          deleteBtn.textContent = "Restore";
          deleteBtn.onclick = async () => {
            // Restore the unit
            await database.ref(`transactions/${transaction.id}`).update({
              deleted: false,
            });
            
            // Also restore related income and fund-return
            const allTransactions = await database.ref('transactions').once('value');
            allTransactions.forEach(snap => {
              const trans = snap.val();
              if (trans.unitId === transaction.id && (trans.type === 'income' || trans.type === 'fund-return')) {
                database.ref(`transactions/${snap.key}`).update({ deleted: false });
              }
            });
          };
        } else {
          deleteBtn.textContent = "Delete";
          deleteBtn.onclick = async () => {
            if (confirm("Are you sure you want to delete this transaction?")) {
              // Mark unit as deleted
              await database.ref(`transactions/${transaction.id}`).update({
                deleted: true,
                deletedAt: Date.now(),
              });
              
              // Also mark related income and fund-return as deleted
              const allTransactions = await database.ref('transactions').once('value');
              allTransactions.forEach(snap => {
                const trans = snap.val();
                if (trans.unitId === transaction.id && (trans.type === 'income' || trans.type === 'fund-return')) {
                  database.ref(`transactions/${snap.key}`).update({ deleted: true });
                }
              });
            }
          };
        }

        actionCell.appendChild(deleteBtn);
      } else {
        // Create Sell button
        const sellBtn = document.createElement("button");
        sellBtn.classList.add("sell-btn");
        sellBtn.textContent = "Sell";
        sellBtn.onclick = () => sellUnit(transaction.id);

        // Create Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");

        if (transaction.deleted) {
          deleteBtn.textContent = "Restore";
          deleteBtn.onclick = async () => {
            await database.ref(`transactions/${transaction.id}`).update({
              deleted: false,
            });
          };
        } else {
          deleteBtn.textContent = "Delete";
          deleteBtn.onclick = async () => {
            if (confirm("Are you sure you want to permanently delete this unit?")) {
              // Hard delete - remove from database
              await database.ref(`transactions/${transaction.id}`).remove();
            }
          };
        }

        actionCell.appendChild(sellBtn);
        actionCell.appendChild(deleteBtn);
      }

      row.appendChild(nameCell);
      row.appendChild(conditionCell);
      row.appendChild(dateCell);
      row.appendChild(costCell);
      row.appendChild(soldCell);
      row.appendChild(statusCell);
      row.appendChild(actionCell);

      unitsBody.appendChild(row);
    }
    // ========== UNITS SECTION END ==========
    
    // ========== FUNDS SECTION START ==========
    else if (
      transaction.type === "fund" ||
      transaction.type === "fund-return"
    ) {
      const row = document.createElement("tr");

      if (transaction.deleted) {
        row.classList.add("deleted-row");
      }

      const dateCell = document.createElement("td");
      dateCell.setAttribute("data-label", "Date");
      dateCell.textContent = transaction.date || "N/A";

      const amountCell = document.createElement("td");
      amountCell.setAttribute("data-label", "Amount");
      amountCell.classList.add("income");
      amountCell.textContent = `+₱${(transaction.amount || 0).toFixed(2)}`;

      const actionCell = document.createElement("td");
      actionCell.setAttribute("data-label", "Action");

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");
      
      if (transaction.deleted) {
        deleteBtn.textContent = "Restore";
        deleteBtn.onclick = async () => {
          // Restore the fund/fund-return
          await database.ref(`transactions/${transaction.id}`).update({
            deleted: false,
          });

          // If this is a fund-return, also restore the related unit and income
          if (transaction.type === "fund-return" && transaction.unitId) {
            await database.ref(`transactions/${transaction.unitId}`).update({
              deleted: false,
              status: 'sold',
            });

            const allTransactions = await database
              .ref("transactions")
              .once("value");
            allTransactions.forEach((snap) => {
              const trans = snap.val();
              if (
                trans.unitId === transaction.unitId &&
                trans.type === "income"
              ) {
                database
                  .ref(`transactions/${snap.key}`)
                  .update({ deleted: false });
              }
            });
          }
        };
      } else {
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = async () => {
          if (confirm("Are you sure you want to delete this transaction?")) {
            // If this is a fund-return, restore the unit to in-stock
            if (transaction.type === 'fund-return' && transaction.unitId) {
              // Restore unit to in-stock
              await database.ref(`transactions/${transaction.unitId}`).update({
                status: 'in-stock',
                soldFor: null,
                soldDate: null
              });
              
              // Delete related income (hard delete)
              const allTransactions = await database.ref('transactions').once('value');
              allTransactions.forEach(snap => {
                const trans = snap.val();
                if (trans.unitId === transaction.unitId && trans.type === 'income') {
                  database.ref(`transactions/${snap.key}`).remove();
                }
              });
              
              // Hard delete the fund-return itself
              await database.ref(`transactions/${transaction.id}`).remove();
            } else {
              // Regular fund - just soft delete
              await database.ref(`transactions/${transaction.id}`).update({
                deleted: true,
                deletedAt: Date.now(),
              });
            }
          }
        };
      }
      
      actionCell.appendChild(deleteBtn);
      row.appendChild(dateCell);
      row.appendChild(amountCell);
      row.appendChild(actionCell);

      fundsBody.appendChild(row);
    }
    // ========== FUNDS SECTION END ==========
    
    // ========== REMITS SECTION START ==========
    else if (transaction.type === "remit") {
      const row = document.createElement("tr");

      if (transaction.deleted) {
        row.classList.add("deleted-row");
      }

      const dateCell = document.createElement("td");
      dateCell.setAttribute("data-label", "Date");
      dateCell.textContent = transaction.date || "N/A";

      const amountCell = document.createElement("td");
      amountCell.setAttribute("data-label", "Amount");
      amountCell.classList.add("expense");
      amountCell.textContent = `-₱${(transaction.amount || 0).toFixed(2)}`;

      const actionCell = document.createElement("td");
      actionCell.setAttribute("data-label", "Action");

      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");

      if (transaction.deleted) {
        deleteBtn.textContent = "Restore";
        deleteBtn.onclick = async () => {
          await database.ref(`transactions/${transaction.id}`).update({
            deleted: false,
          });
        };
      } else {
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = async () => {
          if (confirm("Are you sure you want to delete this transaction?")) {
            await database.ref(`transactions/${transaction.id}`).update({
              deleted: true,
              deletedAt: Date.now(),
            });
          }
        };
      }

      actionCell.appendChild(deleteBtn);
      row.appendChild(dateCell);
      row.appendChild(amountCell);
      row.appendChild(actionCell);

      remitsBody.appendChild(row);
    }
    // ========== REMITS SECTION END ==========
  });
}

/* Handle selling a unit */
async function sellUnit(unitId) {
  // 1. Get sold amount from input
  const soldInput = document.getElementById(`sold-${unitId}`);
  const soldAmount = parseFloat(soldInput.value);

  // 2. Validate
  if (!soldAmount || soldAmount <= 0) {
    alert("Please enter a valid sold amount");
    return;
  }

  try {
    // 3. Get unit data from Firebase
    const unitSnapshot = await database
      .ref(`transactions/${unitId}`)
      .once("value");
    const unit = unitSnapshot.val();

    if (!unit) {
      alert("Unit not found");
      return;
    }
    
    // 4. Calculate profit
    const originalCost = unit.cost;
    const profit = soldAmount - originalCost;

    // 5. Update unit as sold
    await database.ref(`transactions/${unitId}`).update({
      soldFor: soldAmount,
      status: "sold",
      soldDate: new Date().toISOString().split("T")[0],
    });

    if (profit > 0) {
      // PROFIT SCENARIO
      const halfProfit = profit / 2;
      
      // 6. Create income transaction
      const incomeData = {
        type: "income",
        unitId: unitId,
        unitName: unit.name,
        profit: profit,
        dividedAmount: halfProfit,
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
      };
      await database.ref("transactions").push(incomeData);
      
      // 7. Create fund-return transaction
      const fundReturnData = {
        type: "fund-return",
        unitId: unitId,
        unitName: unit.name,
        amount: originalCost + halfProfit,
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
      };
      await database.ref("transactions").push(fundReturnData);
      
      // 8. Show success message
      alert(
        `Unit sold!\nProfit: ₱${profit.toFixed(2)}\nHalf to divided income: ₱${halfProfit.toFixed(2)}\nReturned to fund: ₱${(originalCost + halfProfit).toFixed(2)}`
      );
      
    } else {
      // LOSS SCENARIO
      // 6. NO income transaction (no profit to split!)
      
      // 7. Fund-return is just what you sold it for
      const fundReturnData = {
        type: "fund-return",
        unitId: unitId,
        unitName: unit.name,
        amount: soldAmount,
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
      };
      await database.ref("transactions").push(fundReturnData);
      
      // 8. Show loss message
      alert(
        `Unit sold at a LOSS!\nLoss: ₱${Math.abs(profit).toFixed(2)}\nReturned to fund: ₱${soldAmount.toFixed(2)}`
      );
    }
    
  } catch (error) {
    console.error("Error selling unit:", error);
    alert("Failed to record sale");
  }
}

// Update summary calculations

function updateSummary(transactions) {
  console.log("Updating summary with:", transactions);

  // Initialize totals
  let totalInventoryValue = 0;
  let totalFund = 0;
  let totalIncome = 0;
  let totalDivided = 0;

  if (transactions) {
    Object.values(transactions).forEach((transaction) => {
      // Skip deleted transactions
      if (transaction.deleted) {
        return;
      }

      // Calculate based on type
      if (transaction.type === "unit" && transaction.status === "in-stock") {
        // Only count unsold units in inventory
        totalInventoryValue += transaction.cost || 0;
      } else if (
        transaction.type === "fund" ||
        transaction.type === "fund-return"
      ) {
        totalFund += transaction.amount || 0;
      } else if (transaction.type === "remit") {
        totalFund -= transaction.amount || 0;
      } else if (transaction.type === "income") {
        totalIncome += transaction.profit || 0;
        totalDivided += transaction.dividedAmount || 0;
      }
    });
  }

  console.log("Summary calculated:", {
    totalInventoryValue,
    totalFund,
    totalIncome,
    totalDivided,
  });

  // Update the DOM
  document.getElementById(
    "totalValue"
  ).textContent = `₱${totalInventoryValue.toFixed(2)}`;
  document.getElementById("totalFund").textContent = `₱${totalFund.toFixed(2)}`;
  document.getElementById("totalIncome").textContent = `₱${totalIncome.toFixed(
    2
  )}`;
  document.getElementById(
    "totalDivided"
  ).textContent = `₱${totalDivided.toFixed(2)}`;
}
