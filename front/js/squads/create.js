/**
 * SPORT-ZONE Squad Create Page
 * Form for creating new squads with player emails
 */

const { useState, useEffect, useRef } = React;

// Initialize nav auth on page load
updateNavAuth();

// Using shared utilities from common.js: isValidEmail, EmailInputRow, LoadingOverlay, scrollToError

// Main Create Squad App
const CreateSquadApp = () => {
    const [squadName, setSquadName] = useState('');
    const [playerEmails, setPlayerEmails] = useState(['']);
    const [isPublic, setIsPublic] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [nameError, setNameError] = useState(null);
    const inputRefs = useRef([]);

    // Handle squad name change
    const handleNameChange = (e) => {
        setSquadName(e.target.value);
        if (nameError) setNameError(null);
        if (error) setError(null);
    };

    // Handle email change
    const handleEmailChange = (index, value) => {
        const newEmails = [...playerEmails];
        newEmails[index] = value;
        setPlayerEmails(newEmails);
        if (error) setError(null);
    };

    // Add new email field
    const addEmailField = (afterIndex) => {
        const newEmails = [...playerEmails];
        newEmails.splice(afterIndex + 1, 0, '');
        setPlayerEmails(newEmails);
        
        // Focus on the newly added field after state update
        setTimeout(() => {
            const newIndex = afterIndex + 1;
            if (inputRefs.current[newIndex]) {
                inputRefs.current[newIndex].focus();
            }
        }, 10);
    };

    // Remove email field
    const removeEmailField = (index) => {
        if (playerEmails.length > 1) {
            const newEmails = playerEmails.filter((_, i) => i !== index);
            setPlayerEmails(newEmails);
        }
    };

    // Get valid emails (non-empty and valid format)
    const getValidEmails = () => {
        return playerEmails.filter(email => email.trim() !== '' && isValidEmail(email));
    };

    // Get count of filled emails
    const getFilledEmailCount = () => {
        return playerEmails.filter(email => email.trim() !== '').length;
    };

    // Scroll to first error field
    const scrollToError = (errorType) => {
        setTimeout(() => {
            let element = null;
            
            if (errorType === 'name') {
                element = document.querySelector('.squad-name-input');
            } else if (errorType === 'email') {
                element = document.querySelector('.email-input.error');
            } else if (errorType === 'general') {
                element = document.querySelector('.server-error');
            }
            
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (element.tagName === 'INPUT') {
                    element.focus();
                }
            }
        }, 100);
    };

    // Validate form
    const validateForm = () => {
        // Check squad name
        if (!squadName.trim()) {
            setNameError('Squad name is required');
            scrollToError('name');
            return false;
        }

        // Check for invalid emails (only if they're filled)
        const filledEmails = playerEmails.filter(email => email.trim() !== '');
        const invalidEmails = filledEmails.filter(email => !isValidEmail(email));
        
        if (invalidEmails.length > 0) {
            setError('Please fix invalid email addresses');
            scrollToError('email');
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const validEmails = getValidEmails();
            
            const response = await fetch('/api/squads/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: squadName.trim(),
                    members_emails: validEmails,
                    is_public: isPublic
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create squad');
            }

            // Assuming the API returns the created squad data
            // If not, we'll construct it from what we have
            let squadData;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                squadData = await response.json();
            } else {
                // If API just returns success message, construct basic data
                // The detail page will fetch fresh data
                squadData = {
                    name: squadName.trim(),
                    players: validEmails
                };
            }

            // Store created squad data for detail page
            sessionStorage.setItem('createdSquad', JSON.stringify(squadData));
            
            // Redirect to squad detail page after a short delay
            // Keep loading state active during redirect
            const squadId = squadData.id || 'new';
            setTimeout(() => {
                window.location.href = `/squads/${squadId}/`;
            }, 500);

        } catch (err) {
            setIsSubmitting(false);
            setError(err.message);
            scrollToError('general');
        }
    };

    // Handle cancel
    const handleCancel = () => {
        window.location.href = '/squads/';
    };

    return (
        <main className="create-squad-page">
            {isSubmitting && (
                <LoadingOverlay 
                    text="Creating Squad..." 
                    subtext="Please wait, this may take a moment"
                />
            )}

            {/* Hero Section */}
            <section className="page-hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="hero-icon">🛡️</span>
                            New Squad
                        </div>
                        <h1>Create Your <span className="glow">Squad</span></h1>
                        <p className="hero-description">
                            Build your dream team by naming your squad and inviting players.
                            Add team members by their email addresses.
                        </p>
                    </div>
                </div>
            </section>

            {/* Create Form Section */}
            <section className="create-section">
                <div className="container">
                    <div className="create-form-container">
                        <form className="form-card" onSubmit={handleSubmit}>
                            
                            {/* Server Error */}
                            {error && (
                                <div className="server-error">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            {/* Squad Name Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">🏷️</div>
                                    <span className="form-section-title">Squad Name</span>
                                    <span className="form-section-subtitle required-badge">Required</span>
                                </div>
                                <input
                                    type="text"
                                    className={`squad-name-input ${nameError ? 'error' : ''}`}
                                    placeholder="Enter your squad name..."
                                    value={squadName}
                                    onChange={handleNameChange}
                                    maxLength={50}
                                />
                                {nameError && (
                                    <span className="form-error" style={{ color: 'var(--error-red)', marginTop: '8px', display: 'block' }}>
                                        {nameError}
                                    </span>
                                )}
                            </div>

                            {/* Public/Private Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">🔒</div>
                                    <span className="form-section-title">Visibility</span>
                                </div>
                                <div className="visibility-options">
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="private"
                                            checked={!isPublic}
                                            onChange={() => setIsPublic(false)}
                                        />
                                        <div className="radio-content">
                                            <span className="radio-title">Private</span>
                                            <span className="radio-description">
                                                Only squad members can view this squad, its matches, and results
                                            </span>
                                        </div>
                                    </label>
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="public"
                                            checked={isPublic}
                                            onChange={() => setIsPublic(true)}
                                        />
                                        <div className="radio-content">
                                            <span className="radio-title">Public</span>
                                            <span className="radio-description">
                                                Anyone can view this squad, its matches, and results
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Players Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">👥</div>
                                    <span className="form-section-title">Team Players</span>
                                    <span className="form-section-subtitle optional-badge">Optional</span>
                                </div>

                                <div className="players-input-section">
                                    <div className="players-header">
                                        <div className="players-count">
                                            <span>Players added:</span>
                                            <span className="players-count-value">{getFilledEmailCount()}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="add-player-btn"
                                            onClick={addEmailField}
                                        >
                                            <span className="btn-icon">+</span>
                                            Add Player
                                        </button>
                                    </div>

                                    <div className="email-inputs-list">
                                        {playerEmails.map((email, index) => (
                                            <EmailInputRow
                                                key={index}
                                                index={index}
                                                email={email}
                                                onChange={handleEmailChange}
                                                onRemove={removeEmailField}
                                                onAddNew={addEmailField}
                                                canRemove={playerEmails.length > 1}
                                                inputRef={(el) => (inputRefs.current[index] = el)}
                                            />
                                        ))}
                                    </div>

                                    {playerEmails.length === 1 && playerEmails[0] === '' && (
                                        <div className="empty-players-hint">
                                            <div className="empty-players-hint-icon">💡</div>
                                            <p className="empty-players-hint-text">
                                                Add player emails to invite them to your squad.<br />
                                                You can also add players later.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-cancel btn-lg"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-primary btn-lg ${isSubmitting ? 'btn-loading' : ''}`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="btn-spinner"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Squad'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CreateSquadApp />);
