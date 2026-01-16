// Render transactions separated by type
function renderTransactionsByType(transactions) {
  const unitsBody = document.getElementById("units-body");
  const fundsBody = document.getElementById("funds-body");
  const remitsBody = document.getElementById("remits-body");
  const soldBody = document.getElementById("sold-body");
  const installmentBody = document.getElementById("installment-body");
    installmentBody.innerHTML = "";

  // Clear all tables
  unitsBody.innerHTML = "";
  fundsBody.innerHTML = "";
  remitsBody.innerHTML = "";
  soldBody.innerHTML = "";

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

// ========== UNITS SECTION START (IN-STOCK ONLY) ==========
transactionsArray.forEach((transaction) => {
  // Only show in-stock units
  if (transaction.type === "unit" && transaction.status !== "sold") {
    const row = document.createElement("tr");

    if (transaction.deleted) {
      row.classList.add("deleted-row");
    }

    const transactionIdCell = document.createElement("td");
    transactionIdCell.setAttribute("data-label", "Transaction ID");
    transactionIdCell.textContent = transaction.transactionId || "N/A";

    const nameCell = document.createElement("td");
    nameCell.setAttribute("data-label", "Unit Name");
    nameCell.textContent = transaction.name;

    const imeiCell = document.createElement("td");
    imeiCell.setAttribute("data-label", "IMEI");
    imeiCell.textContent = transaction.imei || "-";

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
    statusBadge.classList.add("status-badge", "status-in-stock");
    statusBadge.textContent = "In Stock";
    statusCell.appendChild(statusBadge);

    // Sold For cell with input + Sell button
    const soldCell = document.createElement("td");
    soldCell.setAttribute("data-label", "Sold For");
    
    const soldContainer = document.createElement("div");
    soldContainer.style.display = "flex";
    soldContainer.style.gap = "8px";
    soldContainer.style.alignItems = "center";

    const soldInput = document.createElement("input");
    soldInput.type = "number";
    soldInput.classList.add("sold-input");
    soldInput.id = `sold-${transaction.id}`;
    soldInput.placeholder = "₱ 0.00";
    soldInput.step = "0.01";

    const sellBtn = document.createElement("button");
    sellBtn.classList.add("sell-btn");
    sellBtn.textContent = "Sell";
    sellBtn.onclick = () => sellUnit(transaction.id);

    soldContainer.appendChild(soldInput);
    soldContainer.appendChild(sellBtn);
    soldCell.appendChild(soldContainer);

    // Action buttons
    const actionCell = document.createElement("td");
    actionCell.setAttribute("data-label", "Action");

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => openEditModal(transaction.id, transaction);

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      if (confirm("Are you sure you want to permanently delete this unit?")) {
        await database.ref(`transactions/${transaction.id}`).remove();

        const allTransactions = await database.ref("transactions").once("value");
        allTransactions.forEach((snap) => {
          const trans = snap.val();
          if (trans.unitId === transaction.id && trans.type === "expense") {
            database.ref(`transactions/${snap.key}`).remove();
          }
        });
      }
    };

    const restoreBtn = document.createElement("button");
    restoreBtn.classList.add("restore-btn");
    restoreBtn.textContent = "Restore";
    restoreBtn.onclick = async () => {
      await database.ref(`transactions/${transaction.id}`).update({
        deleted: false,
        restoredBy: auth.currentUser.email,
        restoredAt: Date.now(),
      });
    };

    if (transaction.deleted) {
      deleteBtn.style.display = "none";
      restoreBtn.style.display = "inline-block";
    } else {
      deleteBtn.style.display = "inline-block";
      restoreBtn.style.display = "none";
    }

    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(restoreBtn);

    row.appendChild(transactionIdCell);
    row.appendChild(nameCell);
    row.appendChild(imeiCell);
    row.appendChild(conditionCell);
    row.appendChild(dateCell);
    row.appendChild(costCell);
    row.appendChild(soldCell);
    row.appendChild(statusCell);
    row.appendChild(actionCell);

    unitsBody.appendChild(row);
  }
  // ========== UNITS SECTION END ==========

  // ========== INSTALLMENT SECTION START ==========
else if (transaction.type === "installment") {
  const row = document.createElement("tr");

  if (transaction.deleted) {
    row.classList.add("deleted-row");
  }

  const transactionIdCell = document.createElement("td");
  transactionIdCell.setAttribute("data-label", "Transaction ID");
  transactionIdCell.textContent = transaction.transactionId || "N/A";

  const nameCell = document.createElement("td");
  nameCell.setAttribute("data-label", "Unit Name");
  nameCell.textContent = transaction.unitName;

  const buyerCell = document.createElement("td");
  buyerCell.setAttribute("data-label", "Buyer Name");
  buyerCell.textContent = transaction.buyerName;

  const unitCostCell = document.createElement("td");
  unitCostCell.setAttribute("data-label", "Unit Cost");
  unitCostCell.textContent = `₱${(transaction.originalCost || 0).toFixed(2)}`;

  const totalPriceCell = document.createElement("td");
  totalPriceCell.setAttribute("data-label", "Installment Price");
  totalPriceCell.textContent = `₱${(transaction.totalPrice || 0).toFixed(2)}`;

  const downPaymentCell = document.createElement("td");
  downPaymentCell.setAttribute("data-label", "Down Payment");
  downPaymentCell.textContent = `₱${(transaction.downPayment || 0).toFixed(2)}`;

  const paymentCell = document.createElement("td");
  paymentCell.setAttribute("data-label", "Payment");
  paymentCell.textContent = `₱${(transaction.paymentAmount || 0).toFixed(2)} (${transaction.paymentFrequency || 'monthly'})`;

  const balanceCell = document.createElement("td");
  balanceCell.setAttribute("data-label", "Balance");
  balanceCell.classList.add(transaction.balanceRemaining > 0 ? "expense" : "income");
  balanceCell.textContent = `₱${(transaction.balanceRemaining || 0).toFixed(2)}`;

  const dueDateCell = document.createElement("td");
  dueDateCell.setAttribute("data-label", "Next Due Date");
  dueDateCell.textContent = transaction.nextDueDate || "N/A";

  const statusCell = document.createElement("td");
  statusCell.setAttribute("data-label", "Status");
  const statusBadge = document.createElement("span");
  statusBadge.classList.add("status-badge");
  
  if (transaction.status === 'completed') {
    statusBadge.classList.add("status-sold");
    statusBadge.textContent = "Completed";
  } else if (transaction.status === 'overdue') {
    statusBadge.classList.add("status-overdue");
    statusBadge.textContent = "Overdue";
  } else {
    statusBadge.classList.add("status-in-stock");
    statusBadge.textContent = "Active";
  }
  statusCell.appendChild(statusBadge);

  const actionCell = document.createElement("td");
  actionCell.setAttribute("data-label", "Action");

  const paymentBtn = document.createElement("button");
  paymentBtn.classList.add("sell-btn");
  paymentBtn.textContent = "+ Payment";
  paymentBtn.onclick = () => recordPayment(transaction.id);

  const historyBtn = document.createElement("button");
  historyBtn.classList.add("edit-btn");
  historyBtn.textContent = "History";
  historyBtn.onclick = () => viewPaymentHistory(transaction.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = async () => {
    if (confirm("Are you sure you want to delete this installment?")) {
      await database.ref(`transactions/${transaction.id}`).update({
        deleted: true,
        deletedAt: Date.now(),
        deletedBy: auth.currentUser.email,
      });
      
      // Return unit to in-stock
      if (transaction.unitId) {
        await database.ref(`transactions/${transaction.unitId}`).update({
          status: 'in-stock',
          installmentId: null
        });
      }
    }
  };

  if (transaction.status !== 'completed') {
    actionCell.appendChild(paymentBtn);
  }
  actionCell.appendChild(historyBtn);
  actionCell.appendChild(deleteBtn);

  row.appendChild(transactionIdCell);
  row.appendChild(nameCell);
  row.appendChild(buyerCell);
  row.appendChild(unitCostCell);
  row.appendChild(totalPriceCell);
  row.appendChild(downPaymentCell);
  row.appendChild(paymentCell);
  row.appendChild(balanceCell);
  row.appendChild(dueDateCell);
  row.appendChild(statusCell);
  row.appendChild(actionCell);

  installmentBody.appendChild(row);
}
// ========== INSTALLMENT SECTION END ==========

  // ========== SOLD UNITS SECTION START ==========
  else if (transaction.type === "unit" && transaction.status === "sold") {
    const row = document.createElement("tr");

    if (transaction.deleted) {
      row.classList.add("deleted-row");
    }

    const transactionIdCell = document.createElement("td");
    transactionIdCell.setAttribute("data-label", "Transaction ID");
    transactionIdCell.textContent = transaction.transactionId || "N/A";

    const nameCell = document.createElement("td");
    nameCell.setAttribute("data-label", "Unit Name");
    nameCell.textContent = transaction.name;

    const imeiCell = document.createElement("td");
    imeiCell.setAttribute("data-label", "IMEI");
    imeiCell.textContent = transaction.imei || "-";

    const conditionCell = document.createElement("td");
    conditionCell.setAttribute("data-label", "Condition");
    conditionCell.textContent = transaction.condition;

    const purchaseDateCell = document.createElement("td");
    purchaseDateCell.setAttribute("data-label", "Date Purchased");
    purchaseDateCell.textContent = transaction.date;

    const soldDateCell = document.createElement("td");
    soldDateCell.setAttribute("data-label", "Date Sold");
    soldDateCell.textContent = transaction.soldDate || "N/A";

    const costCell = document.createElement("td");
    costCell.setAttribute("data-label", "Cost");
    costCell.textContent = `₱${(transaction.cost || 0).toFixed(2)}`;

    const soldForCell = document.createElement("td");
    soldForCell.setAttribute("data-label", "Sold For");
    soldForCell.classList.add("income");
    soldForCell.textContent = `₱${(transaction.soldFor || 0).toFixed(2)}`;

    const profitCell = document.createElement("td");
    profitCell.setAttribute("data-label", "Profit");
    const profit = (transaction.soldFor || 0) - (transaction.cost || 0);
    profitCell.classList.add(profit >= 0 ? "income" : "expense");
    profitCell.textContent = `₱${profit.toFixed(2)}`;

    // Action buttons
    const actionCell = document.createElement("td");
    actionCell.setAttribute("data-label", "Action");

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => openEditModal(transaction.id, transaction);

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = async () => {
      if (confirm("Are you sure you want to delete this transaction?")) {
        await database.ref(`transactions/${transaction.id}`).update({
          deleted: true,
          deletedAt: Date.now(),
          deletedBy: auth.currentUser.email,
        });

        const allTransactions = await database.ref("transactions").once("value");
        allTransactions.forEach((snap) => {
          const trans = snap.val();
          if (
            trans.unitId === transaction.id &&
            (trans.type === "income" || trans.type === "fund-return")
          ) {
            database.ref(`transactions/${snap.key}`).update({ deleted: true });
          }
        });
      }
    };

    const restoreBtn = document.createElement("button");
    restoreBtn.classList.add("restore-btn");
    restoreBtn.textContent = "Restore";
    restoreBtn.onclick = async () => {
      await database.ref(`transactions/${transaction.id}`).update({
        deleted: false,
        restoredBy: auth.currentUser.email,
        restoredAt: Date.now(),
      });

      const allTransactions = await database.ref("transactions").once("value");
      allTransactions.forEach((snap) => {
        const trans = snap.val();
        if (
          trans.unitId === transaction.id &&
          (trans.type === "income" || trans.type === "fund-return")
        ) {
          database.ref(`transactions/${snap.key}`).update({ deleted: false });
        }
      });
    };

    if (transaction.deleted) {
      deleteBtn.style.display = "none";
      restoreBtn.style.display = "inline-block";
    } else {
      deleteBtn.style.display = "inline-block";
      restoreBtn.style.display = "none";
    }

    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
    actionCell.appendChild(restoreBtn);

    row.appendChild(transactionIdCell);
    row.appendChild(nameCell);
    row.appendChild(imeiCell);
    row.appendChild(conditionCell);
    row.appendChild(purchaseDateCell);
    row.appendChild(soldDateCell);
    row.appendChild(costCell);
    row.appendChild(soldForCell);
    row.appendChild(profitCell);
    row.appendChild(actionCell);

    soldBody.appendChild(row);
  }
  // ========== SOLD UNITS SECTION END ==========

    // ========== FUNDS SECTION START ==========
    else if (
      transaction.type === "fund" ||
      transaction.type === "fund-return"
    ) {
      const row = document.createElement("tr");

      if (transaction.deleted) {
        row.classList.add("deleted-row");
      }

      const transactionIdCell = document.createElement("td");
      transactionIdCell.setAttribute("data-label", "Transaction ID");
      transactionIdCell.textContent = transaction.transactionId || "N/A";

      const dateCell = document.createElement("td");
      dateCell.setAttribute("data-label", "Date");
      dateCell.textContent = transaction.date || "N/A";

      const amountCell = document.createElement("td");
      amountCell.setAttribute("data-label", "Amount");
      amountCell.classList.add("income");
      amountCell.textContent = `+₱${(transaction.amount || 0).toFixed(2)}`;

      // Creating description cell
      const descriptionCell = document.createElement("td");
      descriptionCell.setAttribute("data-label", "Description");
      if (transaction.type === "fund-return") {
        descriptionCell.textContent = `Return from: ${transaction.unitName}`;
      } else {
        descriptionCell.textContent = "Fund Added";
      }

const actionCell = document.createElement("td");
actionCell.setAttribute("data-label", "Action");

// Only show edit button if NOT a fund-return from a sale
if (!(transaction.type === 'fund-return' && transaction.unitId)) {
  const editBtn = document.createElement("button");
  editBtn.classList.add("edit-btn");
  editBtn.textContent = "Edit";
  editBtn.onclick = () => openEditModal(transaction.id, transaction);
  actionCell.appendChild(editBtn);
}

      // Create Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = async () => {
        if (confirm("Are you sure you want to delete this transaction?")) {
          // If this is a fund-return, restore the unit to in-stock
          if (transaction.type === "fund-return" && transaction.unitId) {
            // Restore unit to in-stock
            await database.ref(`transactions/${transaction.unitId}`).update({
              status: "in-stock",
              soldFor: null,
              soldDate: null,
            });

            // Delete related income (hard delete)
            const allTransactions = await database
              .ref("transactions")
              .once("value");
            allTransactions.forEach((snap) => {
              const trans = snap.val();
              if (
                trans.unitId === transaction.unitId &&
                trans.type === "income"
              ) {
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
              deletedBy: auth.currentUser.email,
            });
          }
        }
      };

      // Create Restore button
      const restoreBtn = document.createElement("button");
      restoreBtn.classList.add("restore-btn");
      restoreBtn.textContent = "Restore";
      restoreBtn.onclick = async () => {
        // Restore the fund/fund-return
        await database.ref(`transactions/${transaction.id}`).update({
          deleted: false,
          restoredBy: auth.currentUser.email,
          restoredAt: Date.now(),
        });

        // If this is a fund-return, also restore the related unit and income
        if (transaction.type === "fund-return" && transaction.unitId) {
          await database.ref(`transactions/${transaction.unitId}`).update({
            deleted: false,
            status: "sold",
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

      // Show/hide based on deleted status
      if (transaction.deleted) {
        deleteBtn.style.display = "none";
        restoreBtn.style.display = "inline-block";
      } else {
        deleteBtn.style.display = "inline-block";
        restoreBtn.style.display = "none";
      }

      actionCell.appendChild(deleteBtn);
      actionCell.appendChild(restoreBtn);

      row.appendChild(transactionIdCell);
      row.appendChild(dateCell);
      row.appendChild(amountCell);
      row.appendChild(descriptionCell);
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

      const transactionIdCell = document.createElement("td");
      transactionIdCell.setAttribute("data-label", "Transaction ID");
      transactionIdCell.textContent = transaction.transactionId || "N/A";

      const dateCell = document.createElement("td");
      dateCell.setAttribute("data-label", "Date");
      dateCell.textContent = transaction.date || "N/A";

      const amountCell = document.createElement("td");
      amountCell.setAttribute("data-label", "Amount");
      amountCell.classList.add("expense");
      amountCell.textContent = `-₱${(transaction.amount || 0).toFixed(2)}`;

      const actionCell = document.createElement("td");
      actionCell.setAttribute("data-label", "Action");

      // ADD EDIT BUTTON
      const editBtn = document.createElement("button");
      editBtn.classList.add("edit-btn");
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openEditModal(transaction.id, transaction);
      actionCell.appendChild(editBtn);

      // Create Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-btn");
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = async () => {
        if (confirm("Are you sure you want to delete this transaction?")) {
          await database.ref(`transactions/${transaction.id}`).update({
            deleted: true,
            deletedAt: Date.now(),
            deletedBy: auth.currentUser.email,
          });
        }
      };

      // Create Restore button
      const restoreBtn = document.createElement("button");
      restoreBtn.classList.add("restore-btn");
      restoreBtn.textContent = "Restore";
      restoreBtn.onclick = async () => {
        await database.ref(`transactions/${transaction.id}`).update({
          deleted: false,
          restoredBy: auth.currentUser.email,
          restoredAt: Date.now(),
        });
      };

      // Show/hide based on deleted status
      if (transaction.deleted) {
        deleteBtn.style.display = "none";
        restoreBtn.style.display = "inline-block";
      } else {
        deleteBtn.style.display = "inline-block";
        restoreBtn.style.display = "none";
      }

      actionCell.appendChild(deleteBtn);
      actionCell.appendChild(restoreBtn);

      row.appendChild(transactionIdCell);
      row.appendChild(dateCell);
      row.appendChild(amountCell);
      row.appendChild(actionCell);

      remitsBody.appendChild(row);
    }
  });
}
// ========== REMITS SECTION END ==========
