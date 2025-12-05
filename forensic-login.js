// Ghana Forensic App Login Form Handler
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  const messageEl = document.getElementById('form-message');

  // Mock user database (replace with real backend in production)
  const mockUsers = {
    'forensic_admin': {
      password: 'SecurePass123!',
      otp: '123456'
    },
    'tech_gurus': {
      password: 'TechGurusApp!',
      otp: '654321'
    }
  };

  function showError(id, text) {
    const el = document.getElementById('error-' + id);
    if (el) el.textContent = text || '';
  }

  function clearErrors() {
    ['username', 'password', 'otp'].forEach(id => showError(id, ''));
  }

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.classList.remove('success', 'error');
    messageEl.classList.add(type);
  }

  function validate() {
    clearErrors();
    let valid = true;

    const username = form.elements['username'].value.trim();
    const password = form.elements['password'].value;
    const otp = form.elements['otp'].value.trim();

    // Username validation
    if (!username) {
      showError('username', 'Username is required');
      valid = false;
    } else if (username.length < 3) {
      showError('username', 'Username must be at least 3 characters');
      valid = false;
    }

    // Password validation
    if (!password) {
      showError('password', 'Password is required');
      valid = false;
    } else if (password.length < 6) {
      showError('password', 'Password must be at least 6 characters');
      valid = false;
    }

    // OTP validation
    if (!otp) {
      showError('otp', 'OTP code is required');
      valid = false;
    } else if (!/^\d{6}$/.test(otp)) {
      showError('otp', 'OTP must be 6 digits');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validate()) {
      showMessage('Please fix the errors above', 'error');
      return;
    }

    const username = form.elements['username'].value.trim();
    const password = form.elements['password'].value;
    const otp = form.elements['otp'].value.trim();

    // Add loading state
    const btn = form.querySelector('.btn-login');
    btn.disabled = true;
    btn.classList.add('loading');

    // Simulate API call (in production, send to your backend)
    setTimeout(() => {
      const user = mockUsers[username];

      if (!user) {
        showMessage('Invalid username or password', 'error');
        btn.disabled = false;
        btn.classList.remove('loading');
        return;
      }

      if (user.password !== password) {
        showMessage('Invalid username or password', 'error');
        btn.disabled = false;
        btn.classList.remove('loading');
        return;
      }

      if (user.otp !== otp) {
        showMessage('Invalid OTP code', 'error');
        showError('otp', 'Incorrect OTP');
        btn.disabled = false;
        btn.classList.remove('loading');
        return;
      }

      // Success - redirect to dashboard
      showMessage('Login successful! Redirecting...', 'success');
      
      // Store user session data
      sessionStorage.setItem('user', JSON.stringify({
        username: username,
        role: 'Admin',
        loginTime: new Date().toISOString()
      }));
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = 'forensic-dashboard.html';
      }, 2000);

    }, 1500); // Simulate network delay
  });

  // Allow only digits in OTP field
  const otpInput = form.elements['otp'];
  otpInput.addEventListener('keypress', function (e) {
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  });

  // Auto-focus behavior
  form.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const inputs = form.querySelectorAll('input');
      const nextInput = Array.from(inputs).find(input => input === e.target)?.nextElementSibling;
      if (nextInput && nextInput.tagName === 'INPUT') {
        nextInput.focus();
      }
    }
  });
});
