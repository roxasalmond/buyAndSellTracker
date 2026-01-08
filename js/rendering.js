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
        // Create a container for input + button in soldCell (MOVED HERE)
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

        // Sell button in soldCell now
        const sellBtn = document.createElement("button");
        sellBtn.classList.add("sell-btn");
        sellBtn.textContent = "Sell";
        sellBtn.onclick = () => sellUnit(transaction.id);

        soldContainer.appendChild(soldInput);
        soldContainer.appendChild(sellBtn);
        soldCell.appendChild(soldContainer);
      }

      // After the soldCell if/else, create actionCell
      const actionCell = document.createElement("td");
      actionCell.setAttribute("data-label", "Action");

      // CREATE EDIT BUTTON
      const editBtn = document.createElement("button");
      editBtn.classList.add("edit-btn");
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openEditModal(transaction.id, transaction);

      if (isSold) {
        // For sold items: Edit, Delete, Restore
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

            const allTransactions = await database
              .ref("transactions")
              .once("value");
            allTransactions.forEach((snap) => {
              const trans = snap.val();
              if (
                trans.unitId === transaction.id &&
                (trans.type === "income" || trans.type === "fund-return")
              ) {
                database
                  .ref(`transactions/${snap.key}`)
                  .update({ deleted: true });
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

          const allTransactions = await database
            .ref("transactions")
            .once("value");
          allTransactions.forEach((snap) => {
            const trans = snap.val();
            if (
              trans.unitId === transaction.id &&
              (trans.type === "income" || trans.type === "fund-return")
            ) {
              database
                .ref(`transactions/${snap.key}`)
                .update({ deleted: false });
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
      } else {
        // For in-stock items: Edit, Delete, Restore (NO SELL BUTTON HERE)
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = async () => {
          if (
            confirm("Are you sure you want to permanently delete this unit?")
          ) {
            await database.ref(`transactions/${transaction.id}`).remove();

            const allTransactions = await database
              .ref("transactions")
              .once("value");
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
      }

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
