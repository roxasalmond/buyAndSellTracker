// Open edit modal
function openEditModal(transactionId, transaction) {
  const modal = document.getElementById("editModal");
  const editId = document.getElementById("editId");
  const editType = document.getElementById("editType");

  // Set transaction ID and type
  editId.value = transactionId;
  editType.value = transaction.type;

  // Hide all field groups
  document.querySelectorAll(".edit-fields").forEach((field) => {
    field.style.display = "none";
  });

  // Show and populate appropriate fields based on type
  if (transaction.type === "unit") {
    document.getElementById("editUnitFields").style.display = "block";
    document.getElementById("editUnitName").value = transaction.name || "";
    document.getElementById("editUnitCategory").value =
      transaction.category || "";
    document.getElementById("editUnitImei").value = transaction.imei || "";
    document.getElementById("editUnitCondition").value =
      transaction.condition || "";
    document.getElementById("editUnitDate").value = transaction.date || "";
    document.getElementById("editUnitCost").value = transaction.cost || 0;
    document.getElementById('editUnitSold').value = transaction.soldFor || '';
  } else if (
    transaction.type === "fund" ||
    transaction.type === "fund-return"
  ) {
    document.getElementById("editFundFields").style.display = "block";
    document.getElementById("editFundDate").value = transaction.date || "";
    document.getElementById("editFundAmount").value = transaction.amount || 0;
  } else if (transaction.type === "remit") {
    document.getElementById("editRemitFields").style.display = "block";
    document.getElementById("editRemitDate").value = transaction.date || "";
    document.getElementById("editRemitAmount").value = transaction.amount || 0;
  }

    const editImeiInput = document.getElementById('editUnitImei');
  if (transaction.category === 'Android' || transaction.category === 'IOS') {
    editImeiInput.style.display = 'block';
  } else {
    editImeiInput.style.display = 'none';
  }


  modal.style.display = "block";
}

// Close edit modal
function closeEditModal() {
  const modal = document.getElementById('editModal');
  modal.style.display = 'none';
  document.getElementById('editForm').reset();
}

// Save edited transaction
async function saveEdit(e) {
  e.preventDefault();
  
  const transactionId = document.getElementById('editId').value;
  const transactionType = document.getElementById('editType').value;
  
  let updateData = {
    editedBy: auth.currentUser.email,
    editedAt: Date.now()
  };
  
  if (transactionType === 'unit') {
    updateData.name = document.getElementById('editUnitName').value;
    updateData.category = document.getElementById('editUnitCategory').value;
    updateData.imei = document.getElementById('editUnitImei').value;
    updateData.condition = document.getElementById('editUnitCondition').value;
    updateData.date = document.getElementById('editUnitDate').value;
    updateData.cost = parseFloat(document.getElementById('editUnitCost').value);

    const soldValue = document.getElementById('editUnitSold').value;
    updateData.status = soldValue ? 'sold' : 'in-stock';
    updateData.soldFor = soldValue ? parseFloat(soldValue) : null;

    // Update the unit
    await database.ref(`transactions/${transactionId}`).update(updateData);

    // If unit is sold, update related income and fund-return transactions
    if (soldValue) {
      const soldAmount = parseFloat(soldValue);
      const cost = updateData.cost;
      const profit = soldAmount - cost;

      // Find related transactions by unitId
      const allTransactionsSnapshot = await database.ref('transactions').once('value');
      const allTransactions = allTransactionsSnapshot.val();

      if (allTransactions) {
        Object.keys(allTransactions).forEach(async (key) => {
          const transaction = allTransactions[key];
          
          // Update income transaction
          if (transaction.type === 'income' && transaction.unitId === transactionId) {
            const halfProfit = profit / 2;
            await database.ref(`transactions/${key}`).update({
              profit: profit,
              dividedAmount: halfProfit,
              editedBy: auth.currentUser.email,
              editedAt: Date.now()
            });
          }
          
          // Update fund-return transaction
          if (transaction.type === 'fund-return' && transaction.unitId === transactionId) {
            const halfProfit = profit / 2;
            await database.ref(`transactions/${key}`).update({
              amount: cost + halfProfit,
              editedBy: auth.currentUser.email,
              editedAt: Date.now()
            });
          }
        });
      }
    }

  } else if (transactionType === 'fund' || transactionType === 'fund-return') {
    updateData.date = document.getElementById('editFundDate').value;
    updateData.amount = parseFloat(document.getElementById('editFundAmount').value);
    await database.ref(`transactions/${transactionId}`).update(updateData);
  } else if (transactionType === 'remit') {
    updateData.date = document.getElementById('editRemitDate').value;
    updateData.amount = parseFloat(document.getElementById('editRemitAmount').value);
    await database.ref(`transactions/${transactionId}`).update(updateData);
  }
  
  try {
    closeEditModal();
    alert('Transaction updated successfully!');
  } catch (error) {
    console.error('Error updating transaction:', error);
    alert('Failed to update transaction');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Close modal when clicking X
  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditModal);
  }
  
  // Close modal when clicking cancel
  const cancelBtn = document.getElementById('cancelEdit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditModal);
  }
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
      closeEditModal();
    }
  });
  
  // Handle form submission
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', saveEdit);
  }

  const editCategorySelect = document.getElementById('editUnitCategory');
  if (editCategorySelect) {
    editCategorySelect.addEventListener('change', function(e) {
      const editImeiInput = document.getElementById('editUnitImei');
      
      if (e.target.value === 'Android' || e.target.value === 'IOS') {
        editImeiInput.style.display = 'block';
        editImeiInput.required = true;
      } else {
        editImeiInput.style.display = 'none';
        editImeiInput.required = false;
        editImeiInput.value = '';
      }
    });
  }
});