// profile.js
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const profileContainer = document.getElementById('profileContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const alertContainer = document.getElementById('alertContainer');
let loggedInUserId = null;

document.addEventListener('DOMContentLoaded', initProfile);

async function initProfile() {
  try {
    showLoading(true);

    loggedInUserId = await getCurrentUserId();
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id') || loggedInUserId;

    if (!userId) {
      window.location.href = 'login.html';
      return;
    }

    // Get user data
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User not found');

    // Get posts
    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const postSnap = await getDocs(postsQuery);
    const posts = postSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Render
    renderProfile(userSnap.data(), userId, posts);

  } catch (err) {
    console.error(err);
    showAlert('প্রোফাইল লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।', 'error');
    renderProfileError();
  } finally {
    showLoading(false);
  }
}

function getCurrentUserId() {
  return new Promise(resolve => {
    onAuthStateChanged(auth, user => {
      resolve(user ? user.uid : null);
    });
  });
}

function renderProfile(userData, userId, posts) {
  let postsHTML = posts.length > 0 ? posts.map(post => `
    <div class="post-card">
      <div class="post-header">
        <img src="${post.authorPhotoURL || 'https://via.placeholder.com/40'}" class="post-author-avatar">
        <div class="post-meta">
          <h3>${post.title || 'নামবিহীন পোস্ট'}</h3>
          <small>${formatPostDate(post.createdAt)} | ${getCategoryName(post.category)}</small>
        </div>
      </div>
      <p>${truncateContent(post.content)}</p>
      <a href="post.html?id=${post.id}" class="read-more">পুরো পড়ুন</a>
    </div>
  `).join('') : `
    <div class="no-posts">
      <p>কোনো পোস্ট নেই</p>
      ${loggedInUserId === userId ? `<a href="create-post.html">নতুন পোস্ট লিখুন</a>` : ''}
    </div>
  `;

  profileContainer.innerHTML = `
    <div class="profile-header">
      <img src="${userData.photoURL || 'https://via.placeholder.com/150'}" class="profile-avatar">
      <div>
        <h2>${userData.displayName || 'ব্যবহারকারী'}</h2>
        <p>${userData.email || ''}</p>
        <p>পোস্ট: ${posts.length} | ভূমিকা: ${getRoleName(userData.role)} | যোগদান: ${formatDate(userData.joinedDate)}</p>
      </div>
    </div>
    <hr>
    <h3>পোস্টসমূহ</h3>
    ${postsHTML}
  `;
}

function renderProfileError() {
  profileContainer.innerHTML = `<p>প্রোফাইল লোড করা যায়নি</p>`;
}

function showLoading(show) {
  if (loadingSpinner) loadingSpinner.style.display = show ? 'block' : 'none';
}

function showAlert(message, type = 'error') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `<span>${message}</span>`;
  alertContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 4000);
}

// Helpers
function formatPostDate(ts) {
  if (!ts?.toDate) return 'তারিখ নেই';
  return ts.toDate().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDate(date) {
  return date?.toDate ? date.toDate().toLocaleDateString('bn-BD') : 'অজানা';
}
function truncateContent(content, maxLength = 150) {
  return content?.length > maxLength ? content.substring(0, maxLength) + '...' : content || '';
}
function getCategoryName(cat) {
  const categories = { poetry: 'কবিতা', novel: 'উপন্যাস', short-story: 'ছোটগল্প' };
  return categories[cat] || 'সাধারণ';
}
function getRoleName(role) {
  const roles = { admin: 'প্রশাসক', author: 'লেখক', user: 'ব্যবহারকারী' };
  return roles[role] || 'ব্যবহারকারী';
}
