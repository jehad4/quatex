import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// DOM Elements
const postForm = document.getElementById('postForm');
const postContainer = document.getElementById('postContainer');
const postsGrid = document.getElementById('postsGrid');
const categoryFilter = document.getElementById('categoryFilter');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const commentForm = document.getElementById('commentForm');
const commentsContainer = document.getElementById('commentsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');

// Current user
let currentUser = null;
let lastVisible = null;
const postsPerPage = 6;

// Initialize post functionality
function initPost() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    // Update UI based on auth state
    updateUIForAuthState();
  });
  
  // Add event listeners
  if (postForm) {
    postForm.addEventListener('submit', handlePostSubmit);
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', handleCategoryFilter);
  }
  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMorePosts);
  }
  
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }
  
  // Check if we're on a single post page
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  
  if (postId && postContainer) {
    // Load single post
    loadSinglePost(postId);
  } else if (postsGrid) {
    // Load posts grid
    loadPosts();
  }
}

// Update UI based on authentication state
function updateUIForAuthState() {
  if (postForm) {
    if (!currentUser) {
      postForm.innerHTML = `
        <div class="alert alert-error">
          পোস্ট করতে আগে <a href="login.html">লগইন</a> করুন।
        </div>
      `;
    }
  }
  
  if (commentForm) {
    if (!currentUser) {
      commentForm.innerHTML = `
        <div class="alert alert-error">
          মন্তব্য করতে আগে <a href="login.html">লগইন</a> করুন।
        </div>
      `;
    }
  }
}

// Handle post submission
async function handlePostSubmit(e) {
  e.preventDefault();
  
  if (!currentUser) {
    showAlert('পোস্ট করতে আগে লগইন করুন।', 'error');
    return;
  }
  
  const title = postForm.title.value;
  const category = postForm.category.value;
  const content = postForm.content.value;
  
  if (!title || !category || !content) {
    showAlert('সব ফিল্ড পূরণ করুন।', 'error');
    return;
  }
  
  try {
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    
    const postRef = await addDoc(collection(db, "posts"), {
      title,
      category,
      content,
      authorId: currentUser.uid,
      authorName: currentUser.displayName,
      authorPhotoURL: currentUser.photoURL,
      createdAt: serverTimestamp(),
      status: 'pending',
      likes: [],
      commentCount: 0
    });
    
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      postCount: increment(1)
    });
    
    postForm.reset();
    showAlert('পোস্ট সফলভাবে জমা হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন।', 'success');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
  } catch (error) {
    console.error('Error adding post:', error);
    showAlert('পোস্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
  }
}

// ** এখানে loadPosts ফাংশন ঠিক করা হয়েছে **
async function loadPosts(categoryFilter = '') {
  try {
    if (!postsGrid) return;
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    
    if (!lastVisible) {
      postsGrid.innerHTML = '';
    }
    
    let postsQuery;
    
    if (categoryFilter) {
      if (lastVisible) {
        postsQuery = query(
          collection(db, "posts"),
          where("status", "==", "approved"),
          where("category", "==", categoryFilter),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(postsPerPage)
        );
      } else {
        postsQuery = query(
          collection(db, "posts"),
          where("status", "==", "approved"),
          where("category", "==", categoryFilter),
          orderBy("createdAt", "desc"),
          limit(postsPerPage)
        );
      }
    } else {
      if (lastVisible) {
        postsQuery = query(
          collection(db, "posts"),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(postsPerPage)
        );
      } else {
        postsQuery = query(
          collection(db, "posts"),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(postsPerPage)
        );
      }
    }
    
    const postsSnap = await getDocs(postsQuery);
    
    if (postsSnap.empty && !lastVisible) {
      postsGrid.innerHTML = '<p class="text-center">কোন পোস্ট নেই।</p>';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      if (loadingSpinner) loadingSpinner.style.display = 'none';
      return;
    }
    
    lastVisible = postsSnap.docs[postsSnap.docs.length - 1];
    
    if (postsSnap.docs.length < postsPerPage) {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } else {
      if (loadMoreBtn) loadMoreBtn.style.display = 'block';
    }
    
    postsSnap.forEach(doc => {
      const post = doc.data();
      const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000) : new Date();
      
      const postHTML = `
        <div class="card post-card">
          <div class="post-header">
            <img src="${post.authorPhotoURL || 'https://via.placeholder.com/40'}" alt="${post.authorName}" class="post-author-pic">
            <div class="post-meta">
              <div class="post-author">${post.authorName}</div>
              <div class="post-date">${postDate.toLocaleDateString('bn-BD')}</div>
            </div>
          </div>
          <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-category">${getCategoryName(post.category)}</div>
            <p class="post-excerpt">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
            <a href="post.html?id=${doc.id}" class="cta-button">পুরো পোস্ট পড়ুন</a>
          </div>
          <div class="post-actions">
            <button class="action-btn like-btn" data-post-id="${doc.id}">
              <i class="far fa-heart"></i> ${post.likes ? post.likes.length : 0}
            </button>
            <button class="action-btn">
              <i class="far fa-comment"></i> ${post.commentCount || 0}
            </button>
          </div>
        </div>
      `;
      
      postsGrid.innerHTML += postHTML;
    });
    
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(button => {
      button.addEventListener('click', handleLikeClick);
    });
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
  } catch (error) {
    console.error('Error loading posts:', error);
    showAlert('পোস্ট লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    if (loadingSpinner) loadingSpinner.style.display = 'none';
  }
}

// Rest of your code stays exactly the same
// loadMorePosts, handleCategoryFilter, loadSinglePost, formatContent, loadComments, handleCommentSubmit, handleLikeClick, handleDeleteComment, getCategoryName, isAdmin, showAlert functions...

// Load more posts
function loadMorePosts() {
  const selectedCategory = categoryFilter ? categoryFilter.value : '';
  loadPosts(selectedCategory);
}

// Handle category filter change
function handleCategoryFilter() {
  lastVisible = null;
  loadPosts(categoryFilter.value);
}

// ... rest of the functions remain unchanged ...

// Initialize post functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', initPost);

export { loadPosts, loadSinglePost, handlePostSubmit };
