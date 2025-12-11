// Your web app's Firebase configuration
const database = firebase.database();

// Set up listener after authentication
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Authenticated as:', user.email);
    // Set up Firebase listener
    database.ref('transactions').on('value', (snapshot) => {
      const transactions = snapshot.val();
      console.log('Transactions loaded:', transactions);
      renderTransactionsByType(transactions);
      updateSummary(transactions);
    });
  }
});

// Form switching logic (sidebar forms)
const formButtons = document.querySelectorAll('.form-btn');
const formSections = document.querySelectorAll('.form-section');

formButtons.forEach(button => {
  button.addEventListener('click', () => {
    const formType = button.dataset.form;
    
    formButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    formSections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${formType}FormSection`).classList.add('active');
  });
});

// History tab switching logic
const historyTabButtons = document.querySelectorAll('.history-tab-btn');
const historyTabContents = document.querySelectorAll('.history-tab-content');

historyTabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabType = button.dataset.tab;
    
    historyTabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    historyTabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabType}Tab`).classList.add('active');
  });
});

// Handle Unit Form submission
document.getElementById('unitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const unitData = {
    type: 'unit',
    name: document.getElementById('unitName').value,
    condition: document.getElementById('unitCondition').value,
    date: document.getElementById('unitDate').value,
    cost: parseFloat(document.getElementById('unitAmount').value),
    soldFor: null,
    status: 'in-stock',
    timestamp: Date.now()
  };
  
  try {
    await database.ref('transactions').push(unitData);
    e.target.reset();
    alert('Unit added successfully!');
  } catch (error) {
    console.error('Error adding unit:', error);
    alert('Failed to add unit');
  }
});

// Handle Fund Form submission
document.getElementById('fundForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fundData = {
    type: 'fund',
    date: document.getElementById('fundDate').value,
    amount: parseFloat(document.getElementById('fundAmount').value),
    timestamp: Date.now()
  };
  
  try {
    await database.ref('transactions').push(fundData);
    e.target.reset();
    alert('Fund added successfully!');
  } catch (error) {
    console.error('Error adding fund:', error);
    alert('Failed to add fund');
  }
});

// Handle Remit Form submission
document.getElementById('remitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const remitData = {
    type: 'remit',
    date: document.getElementById('remitDate').value,
    amount: parseFloat(document.getElementById('remitAmount').value),
    timestamp: Date.now()
  };
  
  try {
    await database.ref('transactions').push(remitData);
    e.target.reset();
    alert('Remittance recorded successfully!');
  } catch (error) {
    console.error('Error recording remittance:', error);
    alert('Failed to record remittance');
  }
});

// Handle selling a unit
async function sellUnit(unitId) {
  const soldInput = document.getElementById(`sold-${unitId}`);
  const soldAmount = parseFloat(soldInput.value);
  
  if (!soldAmount || soldAmount <= 0) {
    alert('Please enter a valid sold amount');
    return;
  }
  
  try {
    // Get the unit data
    const unitSnapshot = await database.ref(`transactions/${unitId}`).once('value');
    const unit = unitSnapshot.val();
    
    if (!unit) {
      alert('Unit not found');
      return;
    }
    
    const originalCost = unit.cost;
    const profit = soldAmount - originalCost;
    const halfProfit = profit / 2;
    
    // Update unit as sold
    await database.ref(`transactions/${unitId}`).update({
      soldFor: soldAmount,
      status: 'sold',
      soldDate: new Date().toISOString().split('T')[0]
    });
    
    // Create income transaction (half profit to divided income)
    const incomeData = {
      type: 'income',
      unitId: unitId,
      unitName: unit.name,
      profit: profit,
      dividedAmount: halfProfit,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
    
    await database.ref('transactions').push(incomeData);
    
    // Add back to available fund: original cost + half profit
    const fundReturnData = {
      type: 'fund-return',
      unitId: unitId,
      unitName: unit.name,
      amount: originalCost + halfProfit,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
    
    await database.ref('transactions').push(fundReturnData);
    
    alert(`Unit sold!\nProfit: ₱${profit.toFixed(2)}\nHalf to divided income: ₱${halfProfit.toFixed(2)}\nReturned to fund: ₱${(originalCost + halfProfit).toFixed(2)}`);
    
  } catch (error) {
    console.error('Error selling unit:', error);
    alert('Failed to record sale');
  }
}

// Render transactions separated by type
function renderTransactionsByType(transactions) {
  const unitsBody = document.getElementById('unitsTableBody');
  const fundsBody = document.getElementById('fundsTableBody');
  const remitsBody = document.getElementById('remitsTableBody');
  
  // Clear all tables
  unitsBody.innerHTML = '';
  fundsBody.innerHTML = '';
  remitsBody.innerHTML = '';
  
  if (!transactions) {
    console.log('No transactions found');
    return;
  }
  
  // Convert to array and sort by timestamp (newest first)
  const transactionsArray = Object.entries(transactions).map(([key, value]) => ({
    id: key,
    ...value
  }));
  
  transactionsArray.sort((a, b) => b.timestamp - a.timestamp);
  
  // Separate and render by type
  transactionsArray.forEach(transaction => {
    if (transaction.type === 'unit') {
      const row = document.createElement('tr');
      
      const isSold = transaction.status === 'sold';
      const soldCell = isSold 
        ? `<td data-label="Sold For" class="income">₱${transaction.soldFor.toFixed(2)}</td>`
        : `<td data-label="Sold For">
            <input 
              type="number" 
              class="sold-input" 
              id="sold-${transaction.id}" 
              placeholder="₱ 0.00"
              step="0.01"
            />
          </td>`;
      
      const statusCell = isSold
        ? `<td data-label="Status"><span class="status-badge status-sold">Sold</span></td>`
        : `<td data-label="Status"><span class="status-badge status-in-stock">In Stock</span></td>`;
      
      const actionCell = isSold
        ? `<td data-label="Action"><button onclick="deleteTransaction('${transaction.id}')">Delete</button></td>`
        : `<td data-label="Action">
            <button class="sell-btn" onclick="sellUnit('${transaction.id}')">Sell</button>
            <button onclick="deleteTransaction('${transaction.id}')">Delete</button>
          </td>`;
      
        row.innerHTML = `
          <td data-label="Unit Name">${transaction.name || 'N/A'}</td>
          <td data-label="Condition">${transaction.condition || 'N/A'}</td>
          <td data-label="Date">${transaction.date || 'N/A'}</td>
          <td data-label="Cost">₱${(transaction.cost || 0).toFixed(2)}</td>
          ${soldCell}
          ${statusCell}
          ${actionCell}
        `;
      unitsBody.appendChild(row);
    } 
    else if (transaction.type === 'fund' || transaction.type === 'fund-return') {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td data-label="Date">${transaction.date}</td>
        <td data-label="Amount" class="income">+₱${transaction.amount.toFixed(2)}</td>
        <td data-label="Action"><button onclick="deleteTransaction('${transaction.id}')">Delete</button></td>
      `;
      fundsBody.appendChild(row);
    } 
    else if (transaction.type === 'remit') {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td data-label="Date">${transaction.date}</td>
        <td data-label="Amount" class="expense">-₱${transaction.amount.toFixed(2)}</td>
        <td data-label="Action"><button onclick="deleteTransaction('${transaction.id}')">Delete</button></td>
      `;
      remitsBody.appendChild(row);
    }
  });
}

// Update summary calculations
function updateSummary(transactions) {
  console.log('Updating summary with:', transactions);
  
  // Initialize with default values
  let totalInventoryValue = 0;
  let totalFund = 0;
  let totalIncome = 0;
  let totalDivided = 0;
  
  if (transactions) {
    Object.values(transactions).forEach(transaction => {
      console.log('Processing transaction:', transaction);
      
      if (transaction.type === 'unit' && transaction.status === 'in-stock') {
        // Only count unsold units in inventory - ADD NULL CHECK
        totalInventoryValue += transaction.cost || 0;
      } 
      else if (transaction.type === 'fund' || transaction.type === 'fund-return') {
        // ADD NULL CHECK
        totalFund += transaction.amount || 0;
      } 
      else if (transaction.type === 'remit') {
        // ADD NULL CHECK
        totalFund -= transaction.amount || 0;
      }
      else if (transaction.type === 'income') {
        // ADD NULL CHECKS
        totalIncome += transaction.profit || 0;
        totalDivided += transaction.dividedAmount || 0;
      }
    });
  }
  
  console.log('Summary calculated:', {
    totalInventoryValue,
    totalFund,
    totalIncome,
    totalDivided
  });
  
  // Update the DOM
  document.getElementById('totalValue').textContent = `₱${totalInventoryValue.toFixed(2)}`;
  document.getElementById('totalFund').textContent = `₱${totalFund.toFixed(2)}`;
  document.getElementById('totalIncome').textContent = `₱${totalIncome.toFixed(2)}`;
  document.getElementById('totalDivided').textContent = `₱${totalDivided.toFixed(2)}`;
}

// Delete transaction
function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    database.ref(`transactions/${id}`).remove()
      .then(() => alert('Transaction deleted'))
      .catch(error => console.error('Error deleting:', error));
  }
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    }
});