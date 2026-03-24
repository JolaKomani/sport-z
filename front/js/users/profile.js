/**
 * SPORT-ZONE User Profile Page
 * Allows users to update their profile information
 */

const { useState, useEffect } = React;

// Initialize nav auth on page load
updateNavAuth();

// Main Profile App
const ProfileApp = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/users/me/');
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/users/login/';
                    return;
                }
                throw new Error('Failed to load user data');
            }
            
            const data = await response.json();
            setUser(data);
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                password: '',
                confirm_password: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear errors for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        // Clear success message when user starts typing
        if (successMessage) {
            setSuccessMessage('');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }

        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password is optional, but if provided, validate it
        if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            } else if (formData.password !== formData.confirm_password) {
                newErrors.confirm_password = 'Passwords do not match';
            }
        }

        // If password is provided, confirm_password is required
        if (formData.password && !formData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your password';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSuccessMessage('');
        setError(null);

        try {
            const payload = {
                user_id: user.id,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim()
            };

            // Only include password if it was provided
            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch('/api/users/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update profile');
            }

            // Success - reload user data and clear password fields
            setSuccessMessage('Profile updated successfully!');
            setFormData(prev => ({
                ...prev,
                password: '',
                confirm_password: ''
            }));
            
            // Reload user data to get updated info
            await loadUserData();
            
            // Update navbar if needed
            if (typeof updateNavAuth === 'function') {
                updateNavAuth();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="loading-container">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                        </div>
                        <p className="loading-text">Loading Profile...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error && !user) {
        return (
            <main className="profile-page">
                <div className="profile-container">
                    <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <h3>Error Loading Profile</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={loadUserData}>
                            Retry
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-page">
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <h1>Profile <span className="glow">Settings</span></h1>
                    <p>Update your personal information</p>
                </div>

                {/* Profile Card */}
                <div className="profile-card">
                    <form className="profile-form" onSubmit={handleSubmit}>
                        {/* First Name */}
                        <div className="form-group">
                            <label htmlFor="first_name" className="form-label">
                                <span className="label-icon">👤</span>
                                First Name
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className={`form-input ${formErrors.first_name ? 'error' : ''}`}
                                placeholder="Enter your first name"
                            />
                            {formErrors.first_name && (
                                <span className="form-error">{formErrors.first_name}</span>
                            )}
                        </div>

                        {/* Last Name */}
                        <div className="form-group">
                            <label htmlFor="last_name" className="form-label">
                                <span className="label-icon">👤</span>
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className={`form-input ${formErrors.last_name ? 'error' : ''}`}
                                placeholder="Enter your last name"
                            />
                            {formErrors.last_name && (
                                <span className="form-error">{formErrors.last_name}</span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                <span className="label-icon">📧</span>
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-input ${formErrors.email ? 'error' : ''}`}
                                placeholder="Enter your email"
                            />
                            {formErrors.email && (
                                <span className="form-error">{formErrors.email}</span>
                            )}
                        </div>

                        {/* Password Section */}
                        <div className="password-section">
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">
                                    <span className="label-icon">🔒</span>
                                    New Password (Optional)
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                                    placeholder="Leave blank to keep current password"
                                />
                                {formErrors.password && (
                                    <span className="form-error">{formErrors.password}</span>
                                )}
                                <p className="password-note">
                                    Leave blank if you don't want to change your password
                                </p>
                            </div>

                            {formData.password && (
                                <div className="form-group">
                                    <label htmlFor="confirm_password" className="form-label">
                                        <span className="label-icon">🔒</span>
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirm_password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        className={`form-input ${formErrors.confirm_password ? 'error' : ''}`}
                                        placeholder="Confirm your new password"
                                    />
                                    {formErrors.confirm_password && (
                                        <span className="form-error">{formErrors.confirm_password}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="form-error" style={{ marginTop: '8px' }}>
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="form-success" style={{ marginTop: '8px' }}>
                                {successMessage}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`submit-button ${isSubmitting ? 'loading' : ''}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ProfileApp />);
