// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAazcXm2VanSKjRT_D89PwJL8qrNdKkP8E",
    authDomain: "shared-tracker-cad14.firebaseapp.com",
    databaseURL: "https://shared-tracker-cad14-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "shared-tracker-cad14",
    storageBucket: "shared-tracker-cad14.firebasestorage.app",
    messagingSenderId: "936982330005",
    appId: "1:936982330005:web:e18e5ebee26816325f399c",
    measurementId: "G-QVDG6B2V5Q"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');

// Check if user is already signed in
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Already signed in, redirecting to index...');
        window.location.href = 'index.html';
    }
});

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Attempting login for:', email);
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    errorMessage.classList.remove('show');

    try {
        await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful!');
        // Redirect happens automatically via onAuthStateChanged
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.code === 'auth/invalid-email') {
            errorMessage.textContent = 'Invalid email address.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage.textContent = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage.textContent = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-credential') {
            errorMessage.textContent = 'Invalid email or password.';
        } else {
            errorMessage.textContent = 'Login failed. Please try again.';
        }
        
        errorMessage.classList.add('show');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
});