// Ghana Forensic App Dashboard Handler
document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (!user) {
    window.location.href = '/forensic-login.html';
    return;
  }

  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  const pageTitle = document.getElementById('page-title');
  const logoutBtn = document.querySelector('.logout-btn');
  const userProfile = document.querySelector('.user-profile span');
  const crimeForm = document.getElementById('crimeForm');
  const crimeMessage = document.getElementById('crime-message');

  // Page titles mapping
  const pageTitles = {
    dashboard: 'Welcome to the Dashboard',
    report: 'Report a cyber crime',
    cases: 'Active cases',
    evidence: 'Evidence',
    users: 'USERS',
    settings: 'Settings'
  };

  // Display logged-in user
  if (userProfile) {
    userProfile.textContent = user.username;
  }

  // Initialize chart
  let crimeChart = null;

  // Navigation handling
  navItems.forEach(item => {
    item.addEventListener('click', function () {
      const pageName = this.getAttribute('data-page');
      switchPage(pageName);
    });
  });

  function switchPage(pageName) {
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));

    // Remove active from all nav items
    navItems.forEach(item => item.classList.remove('active'));

    // Show selected page
    const selectedPage = document.getElementById(pageName + '-page');
    if (selectedPage) {
      selectedPage.classList.add('active');
    }

    // Add active to nav item
    const activeNav = document.querySelector(`[data-page="${pageName}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    // Update page title
    pageTitle.textContent = pageTitles[pageName] || 'Dashboard';

    // Initialize chart if on dashboard
    if (pageName === 'dashboard') {
      initializeChart();
    }
  }

  // Initialize Chart.js
  function initializeChart() {
    if (crimeChart) return; // Chart already initialized

    const ctx = document.getElementById('crimeChart');
    if (!ctx) return;

    crimeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Phishing', 'Fraud', 'Identity Theft', 'Malware'],
        datasets: [
          {
            label: 'Reports',
            data: [3, 5, 4, 2],
            backgroundColor: [
              'rgba(124, 92, 255, 0.3)',
              'rgba(124, 92, 255, 0.6)',
              'rgba(124, 92, 255, 0.8)',
              'rgba(124, 92, 255, 0.4)'
            ],
            borderColor: [
              'rgba(124, 92, 255, 1)',
              'rgba(124, 92, 255, 1)',
              'rgba(124, 92, 255, 1)',
              'rgba(124, 92, 255, 1)'
            ],
            borderWidth: 2,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(58, 63, 107, 0.3)',
              drawBorder: false
            },
            ticks: {
              color: '#b0b5d4'
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#b0b5d4'
            }
          }
        }
      }
    });
  }

  // Crime Report Form Handling
  crimeForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = {
      fullname: document.getElementById('fullname').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      crime_type: document.getElementById('crime-type').value,
      description: document.getElementById('description').value,
      timestamp: new Date().toISOString()
    };

    // Simulate form submission
    const submitBtn = crimeForm.querySelector('.btn-submit');
    submitBtn.disabled = true;

    setTimeout(() => {
      crimeMessage.textContent = 'Crime report submitted successfully! Reference #' + Date.now();
      crimeMessage.classList.add('success');
      crimeMessage.classList.remove('error');

      // Reset form
      crimeForm.reset();

      // Clear message after 5 seconds
      setTimeout(() => {
        crimeMessage.textContent = '';
        crimeMessage.classList.remove('success');
      }, 5000);

      submitBtn.disabled = false;
    }, 1000);
  });

  // File Upload Handler
  const fileUpload = document.querySelector('.file-upload');
  const fileInput = document.getElementById('evidence-upload');

  if (fileUpload) {
    fileUpload.addEventListener('click', () => fileInput.click());

    // Drag and drop
    fileUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUpload.style.borderColor = '#00d4ff';
    });

    fileUpload.addEventListener('dragleave', () => {
      fileUpload.style.borderColor = '#3a3f6b';
    });

    fileUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUpload.style.borderColor = '#3a3f6b';
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
      }
    });
  }

  // Search functionality
  const evidenceSearch = document.getElementById('evidence-search');
  const usersSearch = document.getElementById('users-search');

  if (evidenceSearch) {
    evidenceSearch.addEventListener('input', function () {
      filterTable('evidence', this.value);
    });
  }

  if (usersSearch) {
    usersSearch.addEventListener('input', function () {
      filterTable('users', this.value);
    });
  }

  function filterTable(tableType, searchTerm) {
    const tableSelector = `.${tableType}-table tbody tr`;
    const rows = document.querySelectorAll(tableSelector);

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
  }

  // Logout handler
  logoutBtn.addEventListener('click', function () {
    if (confirm('Are you sure you want to logout?')) {
      // Clear session
      sessionStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/forensic-login.html';
    }
  });

  // Initialize with dashboard page
  switchPage('dashboard');
});
