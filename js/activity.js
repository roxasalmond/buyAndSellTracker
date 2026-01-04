// js/activity.js
function generateActivityFeed(transactions) {
  if (!transactions) return [];

  const activities = [];

  Object.entries(transactions).forEach(([id, trans]) => {
    // Created
    if (trans.createdBy && trans.createdAt) {
      activities.push({
        user: trans.createdBy,
        action: `added ${trans.type}`,
        itemName: trans.name || `${trans.type} transaction`,
        transactionId: trans.transactionId || "N/A",
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
        timestamp: trans.restoredAt,
      });
    }
  });

  // Sort by timestamp (newest first)
  activities.sort((a, b) => b.timestamp - a.timestamp);

  return activities.slice(0, 20); // Show last 20 activities
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

    // Create elements instead of innerHTML
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
    itemSpan.classList.add("activity-item");
    itemSpan.textContent = `"${activity.itemName}"`;

    const separator4 = document.createTextNode(" ");

    const idSpan = document.createElement("span");
    idSpan.classList.add("activity-id");
    idSpan.textContent = `(${activity.transactionId})`;

    // Append all elements
    item.appendChild(timeSpan);
    item.appendChild(separator1);
    item.appendChild(userSpan);
    item.appendChild(separator2);
    item.appendChild(actionSpan);
    item.appendChild(separator3);
    item.appendChild(itemSpan);
    item.appendChild(separator4);
    item.appendChild(idSpan);

    activityList.appendChild(item);
  });
}
