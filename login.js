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
const successMessage = document.getElementById('successMessage');

// Action code settings for email link - MUST GO TO login.html
const actionCodeSettings = {
    url: 'https://roxasalmond.github.io/buyAndSellTracker/login.html',
    handleCodeInApp: true
};

// Check if redirected from email link
if (auth.isSignInWithEmailLink(window.location.href)) {
    console.log('Detected email link sign-in');
    
    let email = window.localStorage.getItem('emailForSignIn');
    
    if (!email) {
        email = window.prompt('Please provide your email for confirmation');
    }
    
    if (email) {
        auth.signInWithEmailLink(email, window.location.href)
            .then((result) => {
                console.log('Sign-in successful!', result.user.email);
                window.localStorage.removeItem('emailForSignIn');
                // Redirect to main page
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Error signing in:', error);
                errorMessage.textContent = 'Invalid or expired link. Please request a new one.';
                errorMessage.classList.add('show');
            });
    }
} else {
    // Check if user is already signed in
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Already signed in, redirecting...');
            window.location.href = 'index.html';
        }
    });
}

// Send email link
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Sending...';
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    try {
        await auth.sendSignInLinkToEmail(email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        
        successMessage.textContent = `Sign-in link sent to ${email}! Check your inbox.`;
        successMessage.classList.add('show');
        loginBtn.textContent = 'Link Sent ✓';
        
        // Reset form after 3 seconds
        setTimeout(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Send Sign-In Link';
            successMessage.classList.remove('show');
            loginForm.reset();
        }, 3000);
        
    } catch (error) {
        console.error('Error sending email:', error);
        
        if (error.code === 'auth/invalid-email') {
            errorMessage.textContent = 'Invalid email address.';
        } else if (error.code === 'auth/unauthorized-continue-uri') {
            errorMessage.textContent = 'Configuration error. Contact admin.';
        } else {
            errorMessage.textContent = 'Error sending link. Please try again.';
        }
        
        errorMessage.classList.add('show');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Send Sign-In Link';
    }
});