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
      soldBy: auth.currentUser.email,
      soldAt: Date.now(),
    });

    if (profit > 0) {
      // PROFIT SCENARIO
      const halfProfit = profit / 2;

      // Generate ID for income
      const incomeTransactionId = await getNextTransactionId();

      // 6. Create income transaction
      const incomeData = {
        type: "income",
        transactionId: incomeTransactionId,
        unitId: unitId,
        unitName: unit.name,
        profit: profit,
        dividedAmount: halfProfit,
        date: new Date().toISOString().split("T")[0],
        createdBy: auth.currentUser.email,
        createdAt: Date.now(),
        timestamp: Date.now(),
      };
      await database.ref("transactions").push(incomeData);

      // Generate ID for fund-return
      const fundReturnTransactionId = await getNextTransactionId();

      // 7. Create fund-return transaction
      const fundReturnData = {
        type: "fund-return",
        transactionId: fundReturnTransactionId,
        unitId: unitId,
        unitName: unit.name,
        amount: originalCost + halfProfit,
        date: new Date().toISOString().split("T")[0],
        createdBy: auth.currentUser.email,
        createdAt: Date.now(),
        timestamp: Date.now(),
      };
      await database.ref("transactions").push(fundReturnData);

      // 8. Show success message
      alert(
        `Unit sold!\nProfit: ₱${profit.toFixed(
          2
        )}\nHalf to divided income: ₱${halfProfit.toFixed(
          2
        )}\nReturned to fund: ₱${(originalCost + halfProfit).toFixed(2)}`
      );
    } else {
      // LOSS SCENARIO
      // Generate ID for fund-return
      const fundReturnTransactionId = await getNextTransactionId();

      // 7. Fund-return is just what you sold it for
      const fundReturnData = {
        type: "fund-return",
        transactionId: fundReturnTransactionId,
        unitId: unitId,
        unitName: unit.name,
        amount: soldAmount,
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
      };
      await database.ref("transactions").push(fundReturnData);

      // 8. Show loss message
      alert(
        `Unit sold at a LOSS!\nLoss: ₱${Math.abs(profit).toFixed(
          2
        )}\nReturned to fund: ₱${soldAmount.toFixed(2)}`
      );
    }
  } catch (error) {
    console.error("Error selling unit:", error);
    alert("Failed to record sale");
  }
}