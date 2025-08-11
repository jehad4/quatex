import { auth } from './firebase.js';
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const editProfileForm = document.getElementById('editProfileForm');
const displayNameInput = document.getElementById('displayName');
const alertContainer = document.getElementById('alertContainer');

// Show alert message function
function showAlert(message, type = 'success') {
  alertContainer.innerHTML = '';
  const div = document.createElement('div');
  div.className = `alert alert-${type}`;
  div.textContent = message;
  alertContainer.appendChild(div);
  setTimeout(() => {
    div.remove();
  }, 3000);
}

// Load current user info and set name input value
onAuthStateChanged(auth, (user) => {
  if (user) {
    displayNameInput.value = user.displayName || '';
  } else {
    showAlert('আপনি লগইন করেননি। প্রথমে লগইন করুন।', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  }
});

// Handle form submit
editProfileForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newName = displayNameInput.value.trim();

  if (newName.length < 3) {
    showAlert('নাম কমপক্ষে ৩ অক্ষর হতে হবে।', 'error');
    return;
  }

  try {
    if (!auth.currentUser) throw new Error('লগইন করা নেই');

    await updateProfile(auth.currentUser, {
      displayName: newName,
    });

    showAlert('নাম সফলভাবে আপডেট হয়েছে।');
  } catch (error) {
    console.error('Error updating profile:', error);
    showAlert('আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
  }
});
