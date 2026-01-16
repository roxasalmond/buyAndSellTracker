// Populate unit dropdown with available units
function populateUnitDropdown() {
  const unitSelect = document.getElementById('installmentUnit');
  
  database.ref('transactions').once('value', (snapshot) => {
    const transactions = snapshot.val();
    unitSelect.innerHTML = '<option value="">Choose a unit...</option>';
    
    if (transactions) {
      Object.entries(transactions).forEach(([id, txn]) => {
        // Only show in-stock units
        if (txn.type === 'unit' && txn.status !== 'sold' && !txn.deleted && txn.status !== 'installment') {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = `${txn.name} - ₱${txn.cost.toFixed(2)}`;
          option.dataset.cost = txn.cost;
          option.dataset.name = txn.name;
          unitSelect.appendChild(option);
        }
      });
    }
  });
}

// Handle installment form submission
document.getElementById('installmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const unitId = document.getElementById('installmentUnit').value;
  const buyerName = document.getElementById('buyerName').value;
  const totalPrice = parseFloat(document.getElementById('totalPrice').value);
  const downPayment = parseFloat(document.getElementById('downPayment').value);
  const paymentFrequency = document.getElementById('paymentFrequency').value;
  const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
  const nextDueDate = document.getElementById('nextDueDate').value;
  
  try {
    const unitSnapshot = await database.ref(`transactions/${unitId}`).once('value');
    const unit = unitSnapshot.val();
    
    const installmentTransactionId = await getNextTransactionId();
    
    // Calculate profit
    const originalCost = unit.cost;
    const profit = totalPrice - originalCost;
    
    // Create installment record
    const installmentData = {
      type: 'installment',
      transactionId: installmentTransactionId,
      unitId: unitId,
      unitName: unit.name,
      buyerName: buyerName,
      totalPrice: totalPrice,
      originalCost: originalCost,
      downPayment: downPayment,
      paymentFrequency: paymentFrequency,
      paymentAmount: paymentAmount,
      paymentsMade: [
        {
          amount: downPayment,
          date: new Date().toISOString().split('T')[0],
          paidBy: auth.currentUser.email,
          paidAt: Date.now()
        }
      ],
      balanceRemaining: totalPrice - downPayment,
      nextDueDate: nextDueDate,
      status: totalPrice - downPayment <= 0 ? 'completed' : 'active',
      capitalRecovered: 0, // Track capital recovery
      profitProcessed: 0, // Track profit already processed
      createdBy: auth.currentUser.email,
      createdAt: Date.now(),
      timestamp: Date.now()
    };
    
    // Push the installment record first
    const installmentRef = await database.ref('transactions').push(installmentData);
    const installmentId = installmentRef.key;
    
    // Process the down payment to create appropriate transactions
    await processInstallmentPayment(installmentId, downPayment, originalCost, profit);
    
    // Update unit status to installment
    await database.ref(`transactions/${unitId}`).update({
      status: 'installment',
      installmentId: installmentTransactionId
    });
    
    alert(`Installment created successfully!`);
    document.getElementById('installmentForm').reset();
    populateUnitDropdown();
    
  } catch (error) {
    console.error('Error creating installment:', error);
    alert('Failed to create installment');
  }
});

// Process payment and create appropriate transactions
async function processInstallmentPayment(installmentId, paymentAmount, originalCost, totalProfit) {
  const snapshot = await database.ref(`transactions/${installmentId}`).once('value');
  const installment = snapshot.val();
  
  const capitalRecovered = installment.capitalRecovered || 0;
  const profitProcessed = installment.profitProcessed || 0;
  const capitalRemaining = originalCost - capitalRecovered;
  
  let newCapitalRecovered = capitalRecovered;
  let newProfitProcessed = profitProcessed;
  
  // Step 1: Handle capital recovery
  if (capitalRemaining > 0) {
    const capitalToRecover = Math.min(paymentAmount, capitalRemaining);
    
    // Create fund-return for capital recovery
    const capitalReturnId = await getNextTransactionId();
    const capitalReturnData = {
      type: 'fund-return',
      transactionId: capitalReturnId,
      unitId: installment.unitId,
      unitName: installment.unitName,
      amount: capitalToRecover,
      saleType: 'installment-capital',
      installmentId: installment.transactionId,
      date: new Date().toISOString().split('T')[0],
      createdBy: auth.currentUser.email,
      createdAt: Date.now(),
      timestamp: Date.now(),
    };
    
    await database.ref('transactions').push(capitalReturnData);
    newCapitalRecovered += capitalToRecover;
    
    // If there's remaining payment after capital recovery, it's profit
    const remainingPayment = paymentAmount - capitalToRecover;
    
    if (remainingPayment > 0) {
      // Step 2: Handle profit
      const halfProfit = remainingPayment / 2;
      
      // Create income transaction
      const incomeId = await getNextTransactionId();
      const incomeData = {
        type: 'income',
        transactionId: incomeId,
        unitId: installment.unitId,
        unitName: installment.unitName,
        profit: remainingPayment,
        dividedAmount: halfProfit,
        saleType: 'installment',
        installmentId: installment.transactionId,
        date: new Date().toISOString().split('T')[0],
        createdBy: auth.currentUser.email,
        createdAt: Date.now(),
        timestamp: Date.now(),
      };
      
      await database.ref('transactions').push(incomeData);
      
      // Create fund-return for half of profit
      const profitReturnId = await getNextTransactionId();
      const profitReturnData = {
        type: 'fund-return',
        transactionId: profitReturnId,
        unitId: installment.unitId,
        unitName: installment.unitName,
        amount: halfProfit,
        saleType: 'installment-profit',
        installmentId: installment.transactionId,
        date: new Date().toISOString().split('T')[0],
        createdBy: auth.currentUser.email,
        createdAt: Date.now(),
        timestamp: Date.now(),
      };
      
      await database.ref('transactions').push(profitReturnData);
      newProfitProcessed += remainingPayment;
    }
  } else {
    // Capital already fully recovered, entire payment is profit
    const halfProfit = paymentAmount / 2;
    
    // Create income transaction
    const incomeId = await getNextTransactionId();
    const incomeData = {
      type: 'income',
      transactionId: incomeId,
      unitId: installment.unitId,
      unitName: installment.unitName,
      profit: paymentAmount,
      dividedAmount: halfProfit,
      saleType: 'installment',
      installmentId: installment.transactionId,
      date: new Date().toISOString().split('T')[0],
      createdBy: auth.currentUser.email,
      createdAt: Date.now(),
      timestamp: Date.now(),
    };
    
    await database.ref('transactions').push(incomeData);
    
    // Create fund-return for half of profit
    const profitReturnId = await getNextTransactionId();
    const profitReturnData = {
      type: 'fund-return',
      transactionId: profitReturnId,
      unitId: installment.unitId,
      unitName: installment.unitName,
      amount: halfProfit,
      saleType: 'installment-profit',
      installmentId: installment.transactionId,
      date: new Date().toISOString().split('T')[0],
      createdBy: auth.currentUser.email,
      createdAt: Date.now(),
      timestamp: Date.now(),
    };
    
    await database.ref('transactions').push(profitReturnData);
    newProfitProcessed += paymentAmount;
  }
  
  // Update tracking fields
  await database.ref(`transactions/${installmentId}`).update({
    capitalRecovered: newCapitalRecovered,
    profitProcessed: newProfitProcessed
  });
}

// Record a payment for an installment
async function recordPayment(installmentId) {
  const amount = prompt('Enter payment amount:');
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return;
  }
  
  try {
    const snapshot = await database.ref(`transactions/${installmentId}`).once('value');
    const installment = snapshot.val();
    
    const paymentAmount = parseFloat(amount);
    const newBalance = installment.balanceRemaining - paymentAmount;
    const newPayment = {
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      paidBy: auth.currentUser.email,
      paidAt: Date.now()
    };
    
    const updatedPayments = [...(installment.paymentsMade || []), newPayment];
    
    // Update installment record
    await database.ref(`transactions/${installmentId}`).update({
      paymentsMade: updatedPayments,
      balanceRemaining: newBalance,
      status: newBalance <= 0 ? 'completed' : 'active',
      lastPaymentDate: new Date().toISOString().split('T')[0]
    });
    
    // Process payment to create transactions
    const totalProfit = installment.totalPrice - installment.originalCost;
    await processInstallmentPayment(installmentId, paymentAmount, installment.originalCost, totalProfit);
    
    alert('Payment recorded successfully!');
    
  } catch (error) {
    console.error('Error recording payment:', error);
    alert('Failed to record payment');
  }
}

// View payment history
function viewPaymentHistory(installmentId) {
  database.ref(`transactions/${installmentId}`).once('value', (snapshot) => {
    const installment = snapshot.val();
    const payments = installment.paymentsMade || [];
    
    let historyText = `Payment History for ${installment.unitName}\n\n`;
    payments.forEach((payment, index) => {
      historyText += `${index + 1}. ${payment.date} - ₱${payment.amount.toFixed(2)}\n`;
    });
    historyText += `\nTotal Paid: ₱${(installment.totalPrice - installment.balanceRemaining).toFixed(2)}`;
    historyText += `\nBalance: ₱${installment.balanceRemaining.toFixed(2)}`;
    historyText += `\nCapital Recovered: ₱${(installment.capitalRecovered || 0).toFixed(2)} / ₱${installment.originalCost.toFixed(2)}`;
    historyText += `\nProfit Processed: ₱${(installment.profitProcessed || 0).toFixed(2)}`;
    
    alert(historyText);
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  populateUnitDropdown();
});