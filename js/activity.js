// js/activity.js
function generateActivityFeed(transactions) {
  if (!transactions) return [];

  const activities = [];

  Object.entries(transactions).forEach(([id, trans]) => {
    // Skip auto-generated transactions linked to units
    if (trans.type === "expense" && trans.unitId) {
      return;
    }
    
    if (trans.type === "fund-return" && trans.unitId) {
      return;
    }

    // Created
    if (trans.createdBy && trans.createdAt) {
      let amount = null;
      
      if (trans.type === "unit") {
        amount = trans.cost;
      } else if (trans.type === "income" || trans.type === "fund" || trans.type === "fund-return") {
        amount = trans.amount;
      } else if (trans.type === "remit") {
        amount = -trans.amount; // Negative for remittance
      }

      activities.push({
        user: trans.createdBy,
        action: `added ${trans.type}`,
        itemName: trans.name || `${trans.type} transaction`,
        transactionId: trans.transactionId || "N/A",
        amount: amount,
        timestamp: trans.createdAt,
      });
    }

    // Sold
    if (trans.soldBy && trans.soldAt) {
      activities.push({
        user: trans.soldBy,
        action: "sold unit",
        itemName: trans.name,
        transactionId: trans.transactionId || "N/A",
        amount: trans.soldFor,
        timestamp: trans.soldAt,
      });
    }

    // Deleted
    if (trans.deletedBy && trans.deletedAt) {
      activities.push({
        user: trans.deletedBy,
        action: `deleted ${trans.type}`,
        itemName: trans.name || `${trans.type} transaction`,
        transactionId: trans.transactionId || "N/A",
        amount: null,
        timestamp: trans.deletedAt,
      });
    }

    // Restored
    if (trans.restoredBy && trans.restoredAt) {
      activities.push({
        user: trans.restoredBy,
        action: `restored ${trans.type}`,
        itemName: trans.name || `${trans.type} transaction`,
        transactionId: trans.transactionId || "N/A",
        amount: null,
        timestamp: trans.restoredAt,
      });
    }
  });

  activities.sort((a, b) => b.timestamp - a.timestamp);

  return activities.slice(0, 20);
}

function renderActivityFeed(transactions) {
  const activityList = document.getElementById("activity-list");
  if (!activityList) return;

  activityList.innerHTML = "";

  const activities = generateActivityFeed(transactions);

  if (activities.length === 0) {
    activityList.innerHTML = '<li class="no-activity">No activity yet</li>';
    return;
  }

  activities.forEach((activity) => {
    const item = document.createElement("li");
    item.classList.add("activity-item");

    const time = new Date(activity.timestamp).toLocaleString();
    const userName = activity.user.split("@")[0];

    const timeSpan = document.createElement("span");
    timeSpan.classList.add("activity-time");
    timeSpan.textContent = time;

    const separator1 = document.createTextNode(" - ");

    const userSpan = document.createElement("span");
    userSpan.classList.add("activity-user");
    userSpan.textContent = userName;

    const separator2 = document.createTextNode(" ");

    const actionSpan = document.createElement("span");
    actionSpan.classList.add("activity-action");
    actionSpan.textContent = activity.action;

    const separator3 = document.createTextNode(" ");

    const itemSpan = document.createElement("span");
    itemSpan.classList.add("activity-item-name");
    itemSpan.textContent = `"${activity.itemName}"`;

    item.appendChild(timeSpan);
    item.appendChild(separator1);
    item.appendChild(userSpan);
    item.appendChild(separator2);
    item.appendChild(actionSpan);
    item.appendChild(separator3);
    item.appendChild(itemSpan);

    // Add amount if it exists
    if (activity.amount !== null && activity.amount !== undefined) {
      const separator4 = document.createTextNode(" for ");
      
      const amountSpan = document.createElement("span");
      amountSpan.classList.add("activity-amount");
      
      if (activity.amount >= 0) {
        amountSpan.classList.add("income");
        amountSpan.textContent = `₱${activity.amount.toFixed(2)}`;
      } else {
        amountSpan.classList.add("expense");
        amountSpan.textContent = `-₱${Math.abs(activity.amount).toFixed(2)}`;
      }
      
      item.appendChild(separator4);
      item.appendChild(amountSpan);
    }

    const separator5 = document.createTextNode(" ");

    const idSpan = document.createElement("span");
    idSpan.classList.add("activity-id");
    idSpan.textContent = `(${activity.transactionId})`;

    item.appendChild(separator5);
    item.appendChild(idSpan);

    activityList.appendChild(item);
  });
}