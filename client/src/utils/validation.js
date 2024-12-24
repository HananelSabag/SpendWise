// src/utils/validation.js

// Single field validation - for registration
export const validateField = (field, value, language = 'en', password = '') => {
    switch (field) {
        case 'username':
            if (!value || value.length < 3) {
                return language === 'he' 
                    ? 'שם משתמש חייב להכיל לפחות 3 תווים'
                    : 'Username must be at least 3 characters';
            }
            break;

        case 'email':
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!value || !emailRegex.test(value)) {
                return language === 'he'
                    ? 'כתובת אימייל לא תקינה'
                    : 'Please enter a valid email address';
            }
            break;

        case 'password':
            if (!value || value.length < 8) {
                return language === 'he'
                    ? 'סיסמה חייבת להכיל לפחות 8 תווים'
                    : 'Password must be at least 8 characters';
            }
            if (!/[A-Z]/.test(value) || 
                !/[0-9]/.test(value) || 
                !/[!@#$%^&*]/.test(value)) {
                return language === 'he'
                    ? 'סיסמה חייבת להכיל אות גדולה, מספר ותו מיוחד'
                    : 'Password must contain an uppercase letter, a number and a special character';
            }
            break;

        case 'confirmPassword':
            if (value !== password) {
                return language === 'he'
                    ? 'הסיסמאות אינן תואמות'
                    : 'Passwords do not match';
            }
            break;
    }
    return null;
};

// Validation for login form
export const validateLoginField = (field, value, language = 'en') => {
    switch (field) {
        case 'email':
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!value || !emailRegex.test(value)) {
                return language === 'he'
                    ? 'כתובת אימייל לא תקינה'
                    : 'Please enter a valid email address';
            }
            break;

        case 'password':
            if (!value) {
                return language === 'he'
                    ? 'נא להזין סיסמה'
                    : 'Please enter your password';
            }
            break;
    }
    return null;
};

// Full form validation for registration
export const validateRegistration = (formData, language = 'en') => {
    const errors = {};

    // Username validation
    const usernameError = validateField('username', formData.username, language);
    if (usernameError) errors.username = usernameError;

    // Email validation
    const emailError = validateField('email', formData.email, language);
    if (emailError) errors.email = emailError;

    // Password validation
    const passwordError = validateField('password', formData.password, language);
    if (passwordError) errors.password = passwordError;

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = language === 'he'
            ? 'הסיסמאות אינן תואמות'
            : 'Passwords do not match';
    }

    return errors;
};