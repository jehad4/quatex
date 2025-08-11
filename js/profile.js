function renderProfile(userData, userId) {
  profileContainer.innerHTML = `
    <div class="profile-header">
      <img src="${userData.photoURL || 'https://via.placeholder.com/150'}" 
           alt="${userData.displayName || 'User'}" 
           class="profile-avatar">
      <div class="profile-info">
        <h2>${userData.displayName || 'ব্যবহারকারী'}</h2>
        ${userData.email ? `<p class="profile-email">${userData.email}</p>` : ''}
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-value">${userData.postCount || 0}</span>
            <span class="stat-label">পোস্ট</span>
          </div>
          <div class="stat">
            <span class="stat-value">${getRoleName(userData.role)}</span>
            <span class="stat-label">ভূমিকা</span>
          </div>
          <div class="stat">
            <span class="stat-value">${userData.joinedDate ? formatDate(userData.joinedDate) : 'অজানা'}</span>
            <span class="stat-label">যোগদান</span>
          </div>
        </div>
      </div>
    </div>
    ${loggedInUserId === userId ? `
    <div class="profile-actions">
      <a href="edit-profile.html" class="edit-profile-btn">প্রোফাইল সম্পাদনা</a>
    </div>
    ` : ''}
  `;
}

function renderProfileError() {
  profileContainer.innerHTML = `
    <div class="profile-error">
      <i class="fas fa-exclamation-circle"></i>
      <p>প্রোফাইল লোড করা যায়নি</p>
      <button onclick="window.location.reload()" class="retry-btn">
        <i class="fas fa-sync-alt"></i> আবার চেষ্টা করুন
      </button>
    </div>
  `;
}

// In loadUserPosts function:
postsContainer.innerHTML = `
  <div class="no-posts">
    <i class="fas fa-book-open"></i>
    <p>এই ব্যবহারকারীর কোনো পোস্ট নেই</p>
    ${loggedInUserId === userId ? `
    <a href="create-post.html" class="cta-button">নতুন পোস্ট লিখুন</a>
    ` : ''}
  </div>
`;

// And for each post:
postsContainer.innerHTML += `
  <div class="post-card">
    <div class="post-header">
      <img src="${post.authorPhotoURL || 'https://via.placeholder.com/40'}" 
           alt="${post.authorName}" 
           class="post-author-avatar">
      <div class="post-meta">
        <h3 class="post-title">${post.title || 'নামবিহীন পোস্ট'}</h3>
        <div class="post-details">
          <span class="post-category ${post.category || ''}">
            ${getCategoryName(post.category)}
          </span>
          <span class="post-date">${postDate}</span>
        </div>
      </div>
    </div>
    <div class="post-content">
      <p>${truncateContent(post.content)}</p>
      <a href="post.html?id=${doc.id}" class="read-more">পুরো পড়ুন</a>
    </div>
    <div class="post-footer">
      <span class="post-likes">
        <i class="fas fa-heart"></i> ${post.likes?.length || 0}
      </span>
      <span class="post-comments">
        <i class="fas fa-comment"></i> ${post.commentCount || 0}
      </span>
    </div>
  </div>
`;
