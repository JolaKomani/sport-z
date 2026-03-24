/**
 * SPORT-ZONE User Registration Page
 * Handles new user account creation
 */

const { useState } = React;

// Initialize nav auth on page load
updateNavAuth();

// Registration Form Component
const RegistrationForm = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setServerError('');
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
        if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your password';
        } else if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setServerError('');

        try {
            const response = await fetch('/api/users/create/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone || null,
                    password: formData.password
                })
            });

            const text = await response.text();

            if (text.includes('successfully')) {
                setSuccess(true);
                setTimeout(() => window.location.href = '/', 2000);
            } else {
                setServerError(text || 'Registration failed. Please try again.');
            }
        } catch (error) {
            setServerError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="success-container">
                <div className="success-card">
                    <div className="success-icon">✓</div>
                    <h2>Welcome to the Arena!</h2>
                    <p>Your account has been created successfully.</p>
                    <p className="redirect-text">Redirecting to home page...</p>
                    <div className="loading-bar"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="form-container">
            <div className="form-card">
                <div className="form-header">
                    <div className="form-icon">🎮</div>
                    <h1>Join The <span className="glow">Arena</span></h1>
                    <p>Create your player profile and start competing</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <FormInput
                            label="First Name" type="text" name="first_name"
                            value={formData.first_name} onChange={handleChange}
                            placeholder="Enter your first name" icon="👤"
                            error={errors.first_name} autoComplete="given-name"
                        />
                        <FormInput
                            label="Last Name" type="text" name="last_name"
                            value={formData.last_name} onChange={handleChange}
                            placeholder="Enter your last name" icon="👤"
                            error={errors.last_name} autoComplete="family-name"
                        />
                    </div>

                    <FormInput
                        label="Email Address" type="email" name="email"
                        value={formData.email} onChange={handleChange}
                        placeholder="player@example.com" icon="📧"
                        error={errors.email} autoComplete="email"
                    />

                    <FormInput
                        label="Phone Number (Optional)" type="tel" name="phone"
                        value={formData.phone} onChange={handleChange}
                        placeholder="+383 49 111 222" icon="📱"
                        error={errors.phone} autoComplete="tel"
                    />

                    <FormInput
                        label="Password" type="password" name="password"
                        value={formData.password} onChange={handleChange}
                        placeholder="Create a strong password" icon="🔒"
                        error={errors.password} autoComplete="new-password"
                    />

                    <FormInput
                        label="Confirm Password" type="password" name="confirm_password"
                        value={formData.confirm_password} onChange={handleChange}
                        placeholder="Confirm your password" icon="🔐"
                        error={errors.confirm_password} autoComplete="new-password"
                    />

                    {serverError && <ServerErrorAlert message={serverError} />}

                    <SubmitButton isSubmitting={isSubmitting} loadingText="Creating Account...">
                        Enter The Arena
                    </SubmitButton>

                    <p className="form-footer">
                        Already have an account? <a href="/users/login/">Log In</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

// Main App Component
const UserCreateApp = () => (
    <main className="register-page">
        <section className="register-section">
            <div className="container">
                <RegistrationForm />
            </div>
        </section>
    </main>
);

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<UserCreateApp />);
