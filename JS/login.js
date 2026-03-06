import { auth } from './auth.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

// --- DOM ELEMENTS ---
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const resetView = document.getElementById('reset-form');

// Inputs
const loginEmail = document.getElementById('login-email');
const loginPass = document.getElementById('login-password');
const signupEmail = document.getElementById('signup-email');
const signupPass = document.getElementById('signup-password');
const resetEmail = document.getElementById('reset-email');

// Buttons
const btnLogin = document.getElementById('btn-login');
const btnGoogle = document.getElementById('btn-google');
const btnShowSignup = document.getElementById('btn-show-signup');
const btnDoSignup = document.getElementById('btn-do-signup');
const btnBackLogin = document.getElementById('btn-back-login');
const linkForgot = document.getElementById('link-forgot');
const btnSendReset = document.getElementById('btn-send-reset');
const btnCancelReset = document.getElementById('btn-cancel-reset');

// Feedback
const messageBox = document.getElementById('message-box');
const resetMessageBox = document.getElementById('reset-message-box');

// --- HELPERS ---
function showMessage(box, text, type) {
    if(box) {
        box.textContent = text;
        box.className = `message-box ${type}`;
        box.style.display = 'block'; 
    }
}

function clearMessages() {
    if(messageBox) messageBox.style.display = 'none';
    if(resetMessageBox) resetMessageBox.style.display = 'none';
}

function switchView(viewToShow) {
    clearMessages();
    // Use u-hidden to avoid Tailwind conflicts
    [loginView, signupView, resetView].forEach(el => el.classList.add('u-hidden'));
    viewToShow.classList.remove('u-hidden');
}

function redirectHome() {
    window.location.href = '/index.html';
}

// --- EVENT LISTENERS ---

// 1. Navigation Switches
if(btnShowSignup) btnShowSignup.addEventListener('click', () => switchView(signupView));
if(btnBackLogin) btnBackLogin.addEventListener('click', () => switchView(loginView));
if(btnCancelReset) btnCancelReset.addEventListener('click', () => switchView(loginView));
if(linkForgot) {
    linkForgot.addEventListener('click', () => {
        switchView(resetView);
        if(loginEmail.value) resetEmail.value = loginEmail.value;
    });
}

// 2. Password Toggles
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const iconEye = btn.querySelector('.icon-eye');
        const iconEyeOff = btn.querySelector('.icon-eye-off');
        
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Use u-hidden here too
        if(type === 'text') {
            iconEye.classList.add('u-hidden');
            iconEyeOff.classList.remove('u-hidden');
        } else {
            iconEye.classList.remove('u-hidden');
            iconEyeOff.classList.add('u-hidden');
        }
    });
});

// 3. Login Action
if(btnLogin) {
    btnLogin.addEventListener('click', async () => {
        const email = loginEmail.value.toLowerCase().trim();
        const password = loginPass.value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage(messageBox, "Login successful! Redirecting...", "success");
            setTimeout(redirectHome, 1000); 
        } catch (error) {
            console.error(error);
            showMessage(messageBox, "Invalid email or password.", "error");
        }
    });
}

// 4. Google Action
if(btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            showMessage(messageBox, "Google sign in successful! Redirecting...", "success");
            setTimeout(redirectHome, 1000);
        } catch (error) {
            console.error(error);
            showMessage(messageBox, "Google Sign-In failed.", "error");
        }
    });
}

// 5. Sign Up Action
if(btnDoSignup) {
    btnDoSignup.addEventListener('click', async () => {
        const email = signupEmail.value.toLowerCase().trim();
        const password = signupPass.value;
        
        if(password.length < 6) { showMessage(messageBox, "Password must be at least 6 characters.", "error"); return; }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage(messageBox, "Account created! Redirecting...", "success");
            setTimeout(redirectHome, 1500);
        } catch (error) {
            let msg = error.message;
            if(error.code === 'auth/email-already-in-use') msg = "That email is already registered.";
            if(error.code === 'auth/invalid-email') msg = "Please enter a valid email address.";
            showMessage(messageBox, msg, "error");
        }
    });
}

// 6. Reset Password Action
if(btnSendReset) {
    btnSendReset.addEventListener('click', async () => {
        const email = resetEmail.value.toLowerCase().trim();
        if(!email) { showMessage(resetMessageBox, "Please enter your email.", "error"); return; }

        try {
            await sendPasswordResetEmail(auth, email);
            showMessage(resetMessageBox, "Reset link sent! Check your inbox.", "success");
        } catch (error) {
            let msg = "Could not send reset email.";
            if (error.code === 'auth/user-not-found') msg = "No account found.";
            showMessage(resetMessageBox, msg, "error");
        }
    });
}