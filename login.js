console.log('login.js loaded');
console.log('Firebase app exists?', typeof firebase !== 'undefined');

// Wait a bit for Firebase to fully load
setTimeout(() => {
    console.log('Initializing Firebase...');
    
    // Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyAazcXm2VanSKjRT_D89PwJL8qrNdKkP8E",
      authDomain: "shared-tracker-cad14.firebaseapp.com",
      databaseURL: "https://shared-tracker-cad14-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "shared-tracker-cad14",
      storageBucket: "shared-tracker-cad14.firebasestorage.app",
      messagingSenderId: "936982330005",
      appId: "1:936982330005:web:e18e5ebee26816325f399c",
      measurementId: "G-QVDG6B2V5Q"
    };

    // Check if already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
    } else {
        console.log('Firebase already initialized');
    }

    const database = firebase.database();
    console.log('Database reference created');

    // Test connection
    console.log('Testing database connection...');
    database.ref('users').once('value')
        .then((snapshot) => {
            console.log('SUCCESS! Users data:', snapshot.val());
        })
        .catch((error) => {
            console.error('ERROR reading users:', error);
        });

    // Handle login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('Login attempt:', username);
        
        database.ref('users').once('value')
            .then((snapshot) => {
                const users = snapshot.val();
                console.log('Login - users data:', users);
                
                if (!users) {
                    alert('Cannot read users from database');
                    return;
                }
                
                // Check each user
                for (let userId in users) {
                    const user = users[userId];
                    if (user.username === username && user.password === password) {
                        console.log('Login successful!');
                        localStorage.setItem('currentUser', JSON.stringify({
                            id: userId,
                            username: user.username
                        }));
                        window.location.href = 'index.html';
                        return;
                    }
                }
                
                // No match
                document.getElementById('errorMessage').style.display = 'block';
            })
            .catch((error) => {
                console.error('Login error:', error);
                alert('Error: ' + error.message);
            });
    });
}, 1000); // Wait 1 second for Firebase to load