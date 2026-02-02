// Handle Unit Form submission
document.getElementById("unitForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const cost = parseFloat(document.getElementById("unitAmount").value);
  const suggestedPrice = parseFloat(document.getElementById("suggestedPrice").value);
  const photoFile = document.getElementById("unitPhoto").files[0];

  // Validate photo
  if (!photoFile) {
    alert("Please upload a photo of the unit");
    return;
  }

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Uploading...";
    submitBtn.disabled = true;

    // Upload photo to Firebase Storage
    const photoURL = await uploadUnitPhoto(photoFile);

    // Generate transaction ID for unit
    const transactionId = await getNextTransactionId();

    const unitData = {
      type: "unit",
      transactionId: transactionId,
      name: document.getElementById("unitName").value,
      category: document.getElementById("unitCategory").value,
      imei: document.getElementById("unitImei").value,
      condition: document.getElementById("unitCondition").value,
      date: document.getElementById("unitDate").value,
      cost: cost,
      suggestedPrice: suggestedPrice, // NEW: Store suggested selling price
      photoURL: photoURL, // NEW: Store photo URL
      soldFor: null,
      status: "in-stock",
      createdBy: auth.currentUser.email,
      createdAt: Date.now(), 
      timestamp: Date.now(),
    };

    // Add the unit and GET ITS ID
    const unitRef = await database.ref("transactions").push(unitData);
    const unitId = unitRef.key;

    // Generate transaction ID for expense
    const expenseTransactionId = await getNextTransactionId();

    // Create an EXPENSE transaction
    const expenseData = {
      type: "expense",
      transactionId: expenseTransactionId,
      unitId: unitId,
      date: document.getElementById("unitDate").value,
      amount: cost,
      reason: `Unit purchase: ${unitData.name}`,
      createdBy: auth.currentUser.email,
      createdAt: Date.now(),
      timestamp: Date.now(),
    };
    await database.ref("transactions").push(expenseData);

    // Reset form and preview
    e.target.reset();
    document.getElementById("photoPreview").style.display = "none";
    
    // Restore button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    
    alert("Unit added successfully! Fund deducted.");
  } catch (error) {
    console.error("Error adding unit:", error);
    alert("Failed to add unit: " + error.message);
    
    // Restore button on error
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = "Add Unit";
    submitBtn.disabled = false;
  }
});

// Upload photo to Cloudinary
async function uploadUnitPhoto(file) {
  const cloudName = 'dxf5gsnrz';
  const uploadPreset = 'unitphotos';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }
  
  const data = await response.json();
  return data.secure_url; // Return the image URL
}

// Upload photo for existing unit (using Cloudinary)
async function uploadPhotoForUnit(unitId, file, buttonElement) {
  try {
    // Show loading state
    const originalHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
      <span>Uploading...</span>
    `;
    buttonElement.style.pointerEvents = "none";
    
    // Upload to Cloudinary
    const cloudName = 'dxf5gsnrz';
    const uploadPreset = 'unitphotos';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error:', errorData);
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    const downloadURL = data.secure_url;
    
    // Update unit record with photo URL
    await database.ref(`transactions/${unitId}`).update({
      photoURL: downloadURL,
      photoUploadedAt: Date.now()
    });
    
    alert("Photo uploaded successfully!");
    
    // The listener will automatically refresh the table
    
  } catch (error) {
    console.error("Error uploading photo:", error);
    alert("Failed to upload photo: " + error.message);
    
    // Restore button
    buttonElement.innerHTML = originalHTML;
    buttonElement.style.pointerEvents = "auto";
  }
}

// Handle Fund Form submission
document.getElementById("fundForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Generate transaction ID
  const transactionId = await getNextTransactionId();

  const fundData = {
    type: "fund",
    transactionId: transactionId,
    date: document.getElementById("fundDate").value,
    amount: parseFloat(document.getElementById("fundAmount").value),
    createdBy: auth.currentUser.email,
    createdAt: Date.now(),
    timestamp: Date.now(),
  };

  try {
    await database.ref("transactions").push(fundData);
    e.target.reset();
    alert("Fund added successfully!");
  } catch (error) {
    console.error("Error adding fund:", error);
    alert("Failed to add fund");
  }
});

// Handle Remit Form submission
document.getElementById("remitForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Generate transaction ID
  const transactionId = await getNextTransactionId();

  const remitData = {
    type: "remit",
    transactionId: transactionId,
    date: document.getElementById("remitDate").value,
    amount: parseFloat(document.getElementById("remitAmount").value),
    createdBy: auth.currentUser.email,
    createdAt: Date.now(),
    timestamp: Date.now(),
  };

  try {
    await database.ref("transactions").push(remitData);
    e.target.reset();
    alert("Remittance recorded successfully!");
  } catch (error) {
    console.error("Error recording remittance:", error);
    alert("Failed to record remittance");
  }
});

// Show/hide IMEI input based on unit category
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('unitCategory').addEventListener('change', function(e) {
    const imeiInput = document.getElementById('unitImei');
    
    if (e.target.value === 'Android' || e.target.value === 'IOS') {
      imeiInput.style.display = 'block';
      imeiInput.required = true;
    } else {
      imeiInput.style.display = 'none';
      imeiInput.required = false;
      imeiInput.value = '';
    }
  });
});