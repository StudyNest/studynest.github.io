import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- Central Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyA2G_D9RCX5DfMxp2Mkri03AivhM_GNw5c",
    authDomain: "actiari-fixed.firebaseapp.com",
    projectId: "actiari-fixed",
    storageBucket: "actiari-fixed.firebasestorage.app",
    messagingSenderId: "154407363342",
    appId: "1:154407363342:web:7e3b21f8189d556afaed5f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// --- Global Navigation Logic ---
// This runs on every page to toggle Login/Logout buttons
onAuthStateChanged(auth, (user) => {
    const authLinks = document.querySelectorAll('.auth-link');

    authLinks.forEach(link => {
        if (user) {
            // User is signed in
            link.textContent = 'Logout';
            link.href = '#';
            link.style.color = '#ef4444'; // Red color
            
            // Override click behavior to logout
            link.onclick = async (e) => {
                e.preventDefault();
                try {
                    await signOut(auth);
                    // Reload to reset state
                    window.location.reload(); 
                } catch (error) {
                    console.error("Logout failed", error);
                }
            };
        } else {
            // User is not signed in
            link.textContent = 'Login';
            link.href = '/pages/login.html';
            link.style.color = ''; // Reset color
            link.onclick = null;   // Remove logout handler
        }
    });

    // Special check: If user is logged in and currently ON the login page, redirect home
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = '/index.html';
    }
});