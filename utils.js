// Helper function to generate transaction IDs
async function getNextTransactionId() {
  const counterRef = database.ref("metadata/transactionCounter");

  // Get current counter value
  const snapshot = await counterRef.once("value");
  const currentCount = snapshot.val() || 0;
  const nextCount = currentCount + 1;

  // Increment counter
  await counterRef.set(nextCount);

  // Return formatted ID
  return `TXN-${String(nextCount).padStart(3, "0")}`;
}