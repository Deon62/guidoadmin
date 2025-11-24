// Admin UI Application
class AdminApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.apiBaseUrl = 'http://localhost:8000/api/v1';
        this.init();
    }

    init() {
        // Check if we're on login page or dashboard
        if (document.querySelector('.login-page')) {
            this.initLogin();
        } else if (document.querySelector('.admin-layout')) {
            this.initDashboard();
        }
    }

    // Login Page Functions
    initLogin() {
        const loginForm = document.getElementById('loginForm');
        const bypassBtn = document.getElementById('bypassBtn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (bypassBtn) {
            bypassBtn.addEventListener('click', () => {
                this.bypassLogin();
            });
        }

        // Check if already logged in
        if (localStorage.getItem('adminLoggedIn') === 'true') {
            window.location.href = 'dashboard.html';
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        // Show loading state
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.access_token);
                localStorage.setItem('adminLoggedIn', 'true');
                if (data.user) {
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                }
                window.location.href = 'dashboard.html';
            } else {
                // Show error message from API
                const errorMsg = data.detail || 'Invalid credentials. Please try again.';
                alert(errorMsg);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your connection and try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    bypassLogin() {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminBypass', 'true');
        window.location.href = 'dashboard.html';
    }

    // Dashboard Functions
    initDashboard() {
        // Check authentication
        if (localStorage.getItem('adminLoggedIn') !== 'true') {
            window.location.href = 'index.html';
            return;
        }

        // Initialize navigation
        this.initNavigation();
        
        // Initialize logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Initialize settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        // Update user info from stored data
        this.updateUserInfo();

        // Initialize feedback toggle
        this.initFeedbackToggle();

        // Initialize community modal
        this.initCommunityModal();

        // Load initial page data
        this.loadPageData(this.currentPage);
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateToPage(page);
            });
        });

        // Handle hash navigation
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1) || 'dashboard';
            this.navigateToPage(hash);
        });

        // Initial page from hash
        const hash = window.location.hash.substring(1) || 'dashboard';
        this.navigateToPage(hash);
    }

    navigateToPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.closest('.nav-item').classList.add('active');
        }

        // Hide all pages
        document.querySelectorAll('.page-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show selected page
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titles = {
                dashboard: 'Dashboard',
                users: 'Users',
                posts: 'Posts',
                trips: 'Trips',
                communities: 'Communities',
                analytics: 'Analytics',
                feedback: 'Feedback'
            };
            pageTitle.textContent = titles[page] || 'Dashboard';
        }

        // Update URL hash
        window.location.hash = page;
        this.currentPage = page;

        // Load page data
        this.loadPageData(page);
    }

    async loadPageData(page) {
        switch (page) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'posts':
                await this.loadPostsData();
                break;
            case 'trips':
                await this.loadTripsData();
                break;
            case 'communities':
                await this.loadCommunitiesData();
                break;
            case 'feedback':
                await this.loadFeedbackData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Load dashboard stats
            const token = localStorage.getItem('adminToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.apiBaseUrl}/admin/dashboard/stats`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                this.updateDashboardStats(data);
            } else {
                // Check if unauthorized - redirect to login
                if (response.status === 401 || response.status === 403) {
                    this.handleLogout();
                    return;
                }
                // Use mock data if API fails
                console.error('Failed to load dashboard stats:', response.status);
                this.updateDashboardStats({
                    total_users: 0,
                    total_posts: 0,
                    total_trips: 0,
                    total_likes: 0,
                    total_communities: 0
                });
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            // Use mock data on error
            this.updateDashboardStats({
                total_users: 0,
                total_posts: 0,
                total_trips: 0,
                total_likes: 0,
                total_communities: 0
            });
        }
    }

    updateDashboardStats(data) {
        const totalUsers = document.getElementById('totalUsers');
        const totalPosts = document.getElementById('totalPosts');
        const totalTrips = document.getElementById('totalTrips');
        const totalLikes = document.getElementById('totalLikes');
        const totalCommunities = document.getElementById('totalCommunities');

        if (totalUsers) totalUsers.textContent = data.total_users || 0;
        if (totalPosts) totalPosts.textContent = data.total_posts || 0;
        if (totalTrips) totalTrips.textContent = data.total_trips || 0;
        if (totalLikes) totalLikes.textContent = data.total_likes || 0;
        if (totalCommunities) totalCommunities.textContent = data.total_communities || 0;
    }

    async loadUsersData() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        try {
            const token = localStorage.getItem('adminToken');
            const headers = {
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.apiBaseUrl}/admin/users?skip=0&limit=100`, {
                method: 'GET',
                headers: headers
            });

            if (response.ok) {
                const users = await response.json();
                this.renderUsersTable(users);
            } else {
                // Check if unauthorized - redirect to login
                if (response.status === 401 || response.status === 403) {
                    this.handleLogout();
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Failed to load users: ${errorData.detail || 'Unknown error'}</td></tr>`;
            }
        } catch (error) {
            console.error('Error loading users:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Error loading users. Please check your connection.</td></tr>';
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.username || 'N/A'}</td>
                <td>
                    <span class="status-badge ${user.is_active ? 'active' : 'inactive'}">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn-action" onclick="adminApp.viewUser(${user.id})">View</button>
                    <button class="btn-action" onclick="adminApp.toggleUserStatus(${user.id}, ${!user.is_active})">
                        ${user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadPostsData() {
        const tbody = document.getElementById('postsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Posts data will be loaded here</td></tr>';
    }

    async loadTripsData() {
        const tbody = document.getElementById('tripsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Trips data will be loaded here</td></tr>';
    }

    async loadCommunitiesData() {
        const tbody = document.getElementById('communitiesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading...</td></tr>';

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                this.handleLogout();
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/communities/admin/all?skip=0&limit=100`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const communities = await response.json();
                this.renderCommunitiesTable(communities);
            } else {
                if (response.status === 401 || response.status === 403) {
                    this.handleLogout();
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Failed to load: ${errorData.detail || 'Unknown error'}</td></tr>`;
            }
        } catch (error) {
            console.error('Error loading communities:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading communities. Please check your connection.</td></tr>';
        }
    }

    renderCommunitiesTable(communities) {
        const tbody = document.getElementById('communitiesTableBody');
        if (!tbody) return;

        if (!communities || communities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No communities found</td></tr>';
            return;
        }

        tbody.innerHTML = communities.map(comm => {
            const createdDate = comm.created_at ? new Date(comm.created_at).toLocaleDateString() : 'N/A';
            const verifiedBadge = comm.is_admin_created 
                ? '<span class="verified-badge" title="Admin Verified">✓</span>' 
                : '';
            
            return `
                <tr>
                    <td>${comm.id}</td>
                    <td>${comm.name} ${verifiedBadge}</td>
                    <td>${this.truncateText(comm.description, 80)}</td>
                    <td>${verifiedBadge ? 'Admin' : 'User'}</td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn-action" onclick="adminApp.viewCommunity(${comm.id})">View</button>
                        <button class="btn-action" onclick="adminApp.deleteCommunity(${comm.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    initCommunityModal() {
        const addBtn = document.getElementById('addCommunityBtn');
        const modal = document.getElementById('communityModal');
        const closeBtn = document.getElementById('closeCommunityModal');
        const cancelBtn = document.getElementById('cancelCommunityBtn');
        const form = document.getElementById('communityForm');
        const descriptionInput = document.getElementById('communityDescription');
        const wordCountSpan = document.getElementById('wordCount');

        if (!addBtn || !modal) return;

        // Open modal
        addBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        // Close modal
        const closeModal = () => {
            modal.style.display = 'none';
            form.reset();
            if (wordCountSpan) wordCountSpan.textContent = '0';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Word count for description
        if (descriptionInput && wordCountSpan) {
            descriptionInput.addEventListener('input', () => {
                const text = descriptionInput.value;
                const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
                wordCountSpan.textContent = wordCount;
                
                if (wordCount > 35) {
                    wordCountSpan.style.color = 'var(--danger)';
                } else {
                    wordCountSpan.style.color = 'var(--hint-labels)';
                }
            });
        }

        // Handle form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createCommunity();
            });
        }
    }

    async createCommunity() {
        const nameInput = document.getElementById('communityName');
        const descriptionInput = document.getElementById('communityDescription');
        const photoInput = document.getElementById('communityPhoto');

        if (!nameInput || !descriptionInput) return;

        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        const file = photoInput?.files[0];

        // Validate name
        if (!name.startsWith('q/')) {
            alert('Community name must start with "q/"');
            return;
        }

        // Validate description word count
        const wordCount = description.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount > 35) {
            alert(`Description must not exceed 35 words. Current: ${wordCount} words`);
            return;
        }

        if (wordCount === 0) {
            alert('Description is required');
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                this.handleLogout();
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            if (file) {
                formData.append('file', file);
            }

            const form = document.getElementById('communityForm');
            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
            const originalText = submitBtn ? submitBtn.textContent : 'Create Community';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating...';
            }

            const response = await fetch(`${this.apiBaseUrl}/communities/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                // Close modal and reload communities
                document.getElementById('communityModal').style.display = 'none';
                document.getElementById('communityForm').reset();
                document.getElementById('wordCount').textContent = '0';
                await this.loadCommunitiesData();
                alert('Community created successfully!');
            } else {
                let errorMessage = 'Failed to create community';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        if (Array.isArray(errorData.detail)) {
                            // Handle validation errors
                            errorMessage = errorData.detail.map(err => {
                                if (typeof err === 'object' && err.msg) {
                                    return err.msg;
                                }
                                return String(err);
                            }).join(', ');
                        } else {
                            errorMessage = errorData.detail;
                        }
                    }
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }

                if (response.status === 401 || response.status === 403) {
                    alert('Session expired. Please login again.');
                    this.handleLogout();
                } else {
                    alert(errorMessage);
                }
            }

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        } catch (error) {
            console.error('Error creating community:', error);
            alert('Error creating community. Please try again.');
            const form = document.getElementById('communityForm');
            const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Community';
            }
        }
    }

    viewCommunity(communityId) {
        console.log('View community:', communityId);
        // TODO: Implement community view modal
    }

    async deleteCommunity(communityId) {
        if (!confirm('Are you sure you want to delete this community?')) {
            return;
        }

        // TODO: Implement delete endpoint
        alert('Delete functionality will be implemented');
    }

    initFeedbackToggle() {
        const feedbackToggle = document.getElementById('feedbackToggle');
        const featureToggle = document.getElementById('featureToggle');
        const feedbackList = document.getElementById('feedback-list');
        const featuresList = document.getElementById('features-list');

        if (feedbackToggle && featureToggle) {
            // Load initial feedback data
            this.loadFeedbackData('feedback');

            feedbackToggle.addEventListener('click', () => {
                feedbackToggle.classList.add('active');
                featureToggle.classList.remove('active');
                if (feedbackList) feedbackList.classList.add('active');
                if (featuresList) featuresList.classList.remove('active');
                this.loadFeedbackData('feedback');
            });

            featureToggle.addEventListener('click', () => {
                featureToggle.classList.add('active');
                feedbackToggle.classList.remove('active');
                if (featuresList) featuresList.classList.add('active');
                if (feedbackList) feedbackList.classList.remove('active');
                this.loadFeedbackData('features');
            });
        }
    }

    async loadFeedbackData(type = 'feedback') {
        const tbody = type === 'feedback' 
            ? document.getElementById('feedbackTableBody')
            : document.getElementById('featuresTableBody');
        
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading...</td></tr>';

        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                this.handleLogout();
                return;
            }

            // Map 'features' to 'feature_request' for API
            const feedbackType = type === 'feedback' ? 'feedback' : 'feature_request';
            
            const response = await fetch(`${this.apiBaseUrl}/admin/feedback?skip=0&limit=100&feedback_type=${feedbackType}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderFeedbackTable(data, type);
            } else {
                // Check if unauthorized - redirect to login
                if (response.status === 401 || response.status === 403) {
                    this.handleLogout();
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Failed to load: ${errorData.detail || 'Unknown error'}</td></tr>`;
            }
        } catch (error) {
            console.error('Error loading feedback:', error);
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading data. Please check your connection.</td></tr>';
        }
    }

    renderFeedbackTable(data, type) {
        const tbody = type === 'feedback' 
            ? document.getElementById('feedbackTableBody')
            : document.getElementById('featuresTableBody');
        
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No ' + (type === 'feedback' ? 'feedback' : 'feature requests') + ' found</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => {
            const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
            const statusClass = item.status === 'resolved' ? 'active' : 
                               item.status === 'rejected' ? 'inactive' : '';
            
            return `
                <tr>
                    <td>${item.id}</td>
                    <td>User #${item.user_id}</td>
                    <td>${this.truncateText(item.description, 100)}</td>
                    <td>${createdDate}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${item.status || 'Pending'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-action" onclick="adminApp.viewFeedback(${item.id}, '${type}')">View</button>
                        <button class="btn-action" onclick="adminApp.updateFeedbackStatus(${item.id}, '${item.status}')">
                            ${item.status === 'resolved' ? 'Reopen' : item.status === 'pending' ? 'Resolve' : 'Update'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    truncateText(text, maxLength) {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    updateUserInfo() {
        const userData = localStorage.getItem('adminUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                const userName = document.querySelector('.user-name');
                const userAvatar = document.querySelector('.user-avatar');
                
                if (userName && user.nickname) {
                    userName.textContent = user.nickname;
                } else if (userName && user.username) {
                    userName.textContent = user.username;
                }
                
                if (userAvatar && user.nickname) {
                    userAvatar.textContent = user.nickname.charAt(0).toUpperCase();
                } else if (userAvatar && user.username) {
                    userAvatar.textContent = user.username.charAt(0).toUpperCase();
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }

    openSettings() {
        // TODO: Implement settings modal or page
        alert('Settings panel coming soon');
    }

    async viewFeedback(feedbackId, type = 'feedback') {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                this.handleLogout();
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/admin/feedback/${feedbackId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const feedback = await response.json();
                // Show feedback details in a modal or alert
                const message = `ID: ${feedback.id}\nUser ID: ${feedback.user_id}\nType: ${feedback.feedback_type}\nStatus: ${feedback.status}\nCreated: ${new Date(feedback.created_at).toLocaleString()}\n\nDescription:\n${feedback.description}`;
                alert(message);
            } else {
                if (response.status === 401 || response.status === 403) {
                    this.handleLogout();
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    alert(errorData.detail || 'Failed to load feedback details');
                }
            }
        } catch (error) {
            console.error('Error viewing feedback:', error);
            alert('Error loading feedback details');
        }
    }

    async updateFeedbackStatus(feedbackId, currentStatus) {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                alert('Not authenticated. Please login again.');
                this.handleLogout();
                return;
            }

            // Toggle between resolved and pending
            const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
            
            const response = await fetch(`${this.apiBaseUrl}/admin/feedback/${feedbackId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Reload the current feedback list
                const feedbackToggle = document.getElementById('feedbackToggle');
                const featureToggle = document.getElementById('featureToggle');
                const currentType = feedbackToggle && feedbackToggle.classList.contains('active') ? 'feedback' : 'features';
                await this.loadFeedbackData(currentType);
            } else {
                if (response.status === 401 || response.status === 403) {
                    alert('Session expired. Please login again.');
                    this.handleLogout();
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    alert(errorData.detail || 'Failed to update status');
                }
            }
        } catch (error) {
            console.error('Error updating feedback status:', error);
            alert('Error updating status. Please try again.');
        }
    }

    handleLogout() {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminBypass');
        window.location.href = 'index.html';
    }

    viewUser(userId) {
        console.log('View user:', userId);
        // Implement user view modal
    }

    async toggleUserStatus(userId, isActive) {
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                alert('Not authenticated. Please login again.');
                this.handleLogout();
                return;
            }

            const endpoint = isActive ? 'activate' : 'deactivate';
            
            const response = await fetch(`${this.apiBaseUrl}/admin/users/${userId}/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await this.loadUsersData();
            } else {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401 || response.status === 403) {
                    alert('Session expired. Please login again.');
                    this.handleLogout();
                } else {
                    alert(errorData.detail || 'Failed to update user status');
                }
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Error updating user status. Please try again.');
        }
    }
}

// Additional styles for action buttons
const style = document.createElement('style');
style.textContent = `
    .btn-action {
        background-color: transparent;
        color: var(--primary-brand);
        border: 1px solid var(--primary-brand);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        margin-right: 8px;
        transition: all 0.2s;
    }

    .btn-action:hover {
        background-color: var(--primary-brand);
        color: var(--white);
    }

    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }

    .status-badge.active {
        background-color: rgba(76, 175, 80, 0.1);
        color: var(--success);
    }

    .status-badge.inactive {
        background-color: rgba(244, 67, 54, 0.1);
        color: var(--danger);
    }
`;
document.head.appendChild(style);

// Initialize the app
const adminApp = new AdminApp();

