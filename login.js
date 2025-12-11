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

// Action code settings for email link
const actionCodeSettings = {
    url: 'https://roxasalmond.github.io/buyAndSellTracker/login.html',
    handleCodeInApp: true
};

console.log('Current URL:', window.location.href);
console.log('Is sign-in link?', auth.isSignInWithEmailLink(window.location.href));

// Check if redirected from email link
if (auth.isSignInWithEmailLink(window.location.href)) {
    console.log('✅ Detected email link sign-in');
    
    let email = window.localStorage.getItem('emailForSignIn');
    console.log('Stored email:', email);
    
    if (!email) {
        email = window.prompt('Please provide your email for confirmation');
        console.log('Prompted email:', email);
    }
    
    if (email) {
        console.log('Attempting to sign in with:', email);
        
        auth.signInWithEmailLink(email, window.location.href)
            .then((result) => {
                console.log('✅ Sign-in successful!', result.user.email);
                window.localStorage.removeItem('emailForSignIn');
                
                // Small delay before redirect
                setTimeout(() => {
                    console.log('Redirecting to index.html...');
                    window.location.href = 'index.html';
                }, 500);
            })
            .catch((error) => {
                console.error('❌ Error signing in:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                
                errorMessage.textContent = `Error: ${error.message}`;
                errorMessage.classList.add('show');
            });
    } else {
        console.error('❌ No email provided');
    }
} else {
    console.log('Not a sign-in link, checking auth state...');
    
    // Check if user is already signed in
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Already signed in:', user.email);
            window.location.href = 'index.html';
        } else {
            console.log('Not signed in, showing login form');
        }
    });
}

// Send email link
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    console.log('Sending link to:', email);
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Sending...';
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    try {
        await auth.sendSignInLinkToEmail(email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        console.log('✅ Email sent successfully');
        
        successMessage.textContent = `Sign-in link sent to ${email}! Check your inbox.`;
        successMessage.classList.add('show');
        loginBtn.textContent = 'Link Sent ✓';
        
        setTimeout(() => {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Send Sign-In Link';
            successMessage.classList.remove('show');
            loginForm.reset();
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error sending email:', error);
        
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.classList.add('show');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Send Sign-In Link';
    }
});