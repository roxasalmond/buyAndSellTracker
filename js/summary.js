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
      if (transaction.type === "unit") {
        if (transaction.status === "in-stock") {
          // Unsold units: add to inventory, subtract cost from fund
          totalInventoryValue += transaction.cost || 0;
        }
      } else if (
        transaction.type === "fund" ||
        transaction.type === "fund-return"
      ) {
        totalFund += transaction.amount || 0;
      } else if (transaction.type === "remit") {
        totalFund -= transaction.amount || 0;
      } else if (transaction.type === "expense") {
        totalFund -= transaction.amount || 0;
      } else if (transaction.type === "income") {
        totalIncome += transaction.profit || 0;
        totalDivided += transaction.dividedAmount || 0;
        // Return cost + half the profit to fund
        // totalFund += (transaction.cost || 0) + ((transaction.profit || 0) / 2);
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