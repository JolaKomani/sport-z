/**
 * SPORT-ZONE User Login Page
 * Handles user authentication
 */

const { useState } = React;

// Initialize nav auth on page load
updateNavAuth();

// Login Form Component
const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setServerError('');
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
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
            const response = await fetch('/api/users/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                const text = await response.text();
                setServerError(text || 'Invalid email or password');
            }
        } catch (error) {
            setServerError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-card">
                <div className="form-header">
                    <div className="form-icon">🔐</div>
                    <h1>Welcome <span className="glow">Back</span></h1>
                    <p>Sign in to continue to the arena</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <FormInput
                        label="Email Address" type="email" name="email"
                        value={formData.email} onChange={handleChange}
                        placeholder="player@example.com" icon="📧"
                        error={errors.email} autoComplete="email"
                    />

                    <FormInput
                        label="Password" type="password" name="password"
                        value={formData.password} onChange={handleChange}
                        placeholder="Enter your password" icon="🔒"
                        error={errors.password} autoComplete="current-password"
                    />

                    {serverError && <ServerErrorAlert message={serverError} />}

                    <SubmitButton isSubmitting={isSubmitting} loadingText="Signing In...">
                        Enter The Arena
                    </SubmitButton>

                    <p className="form-footer">
                        Don't have an account? <a href="/users/create/">Join Now</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

// Main App Component
const UserLoginApp = () => (
    <main className="login-page">
        <section className="login-section">
            <div className="container">
                <LoginForm />
            </div>
        </section>
    </main>
);

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<UserLoginApp />);
