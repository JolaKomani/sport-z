/**
 * SPORT-ZONE Squad Edit Page
 * Form for editing squad name and managing players
 */

const { useState, useEffect, useRef } = React;

// Initialize nav auth on page load
updateNavAuth();

// Using shared utilities from common.js: isValidEmail, getIdFromUrl, EmailInputRow, LoadingOverlay, scrollToError, getInitials

// Player Card for existing players (with remove option)
const PlayerCard = ({ player, onRemove, isRemoving }) => (
    <div className={`existing-player-card ${isRemoving ? 'removing' : ''}`}>
        <div className="player-avatar-small">{getInitials(player.name)}</div>
        <span className="player-name">{player.name}</span>
        <button
            type="button"
            className="remove-player-btn"
            onClick={onRemove}
            title="Remove player"
            disabled={isRemoving}
        >
            {isRemoving ? '...' : '✕'}
        </button>
    </div>
);

// Using LoadingOverlay from common.js

// Main Edit Squad App
const EditSquadApp = () => {
    const [squadId, setSquadId] = useState(null);
    const [squadName, setSquadName] = useState('');
    const [originalName, setOriginalName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [originalIsPublic, setOriginalIsPublic] = useState(false);
    const [existingPlayers, setExistingPlayers] = useState([]);
    const [originalPlayers, setOriginalPlayers] = useState([]);
    const [newPlayerEmails, setNewPlayerEmails] = useState(['']);
    const [loading, setLoading] = useState(true);
    const inputRefs = useRef([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [removingPlayerId, setRemovingPlayerId] = useState(null);
    const [error, setError] = useState(null);
    const [nameError, setNameError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        loadSquadData();
    }, []);

    const loadSquadData = async () => {
        try {
            setLoading(true);
            const id = getIdFromUrl('squads');
            
            if (!id) {
                throw new Error('Squad not found');
            }

            setSquadId(id);

            const response = await fetch(`/api/squads/${id}/`);
            
            if (!response.ok) {
                throw new Error('Failed to load squad details');
            }

            const data = await response.json();
            setSquadName(data.name || '');
            setOriginalName(data.name || '');
            setIsPublic(data.is_public || false);
            setOriginalIsPublic(data.is_public || false);
            setExistingPlayers(data.players || []);
            setOriginalPlayers(data.players || []);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle squad name change
    const handleNameChange = (e) => {
        setSquadName(e.target.value);
        if (nameError) setNameError(null);
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
    };

    // Handle new email change
    const handleEmailChange = (index, value) => {
        const newEmails = [...newPlayerEmails];
        newEmails[index] = value;
        setNewPlayerEmails(newEmails);
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
    };

    // Add new email field
    const addEmailField = (afterIndex) => {
        const newEmails = [...newPlayerEmails];
        newEmails.splice(afterIndex + 1, 0, '');
        setNewPlayerEmails(newEmails);
        
        // Focus on the newly added field after state update
        setTimeout(() => {
            const newIndex = afterIndex + 1;
            if (inputRefs.current[newIndex]) {
                inputRefs.current[newIndex].focus();
            }
        }, 0);
    };

    // Remove email field
    const removeEmailField = (index) => {
        if (newPlayerEmails.length > 1) {
            const newEmails = newPlayerEmails.filter((_, i) => i !== index);
            setNewPlayerEmails(newEmails);
        } else {
            // If only one field, just clear it
            setNewPlayerEmails(['']);
        }
    };

    // Remove existing player via API
    const removeExistingPlayer = async (player) => {
        if (removingPlayerId) return; // Prevent multiple simultaneous removals
        
        setRemovingPlayerId(player.id);
        setError(null);
        if (successMessage) setSuccessMessage(null);

        try {
            const response = await fetch('/api/squads/remove-player/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    squad_id: parseInt(squadId),
                    user_id: player.id
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to remove player');
            }

            // Remove player from local state
            setExistingPlayers(existingPlayers.filter(p => p.id !== player.id));
            setSuccessMessage(`${player.name} removed from squad`);

        } catch (err) {
            setError(err.message);
        } finally {
            setRemovingPlayerId(null);
        }
    };

    // Get valid new emails
    const getValidNewEmails = () => {
        return newPlayerEmails.filter(email => email.trim() !== '' && isValidEmail(email));
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
        if (!squadName.trim()) {
            setNameError('Squad name is required');
            scrollToError('name');
            return false;
        }

        // Check for invalid emails (only filled ones)
        const filledEmails = newPlayerEmails.filter(email => email.trim() !== '');
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
        setSuccessMessage(null);

        try {
            const validNewEmails = getValidNewEmails();
            
            // Build payload for squad_update_api
            const payload = {
                squad_id: parseInt(squadId),
                name: squadName.trim(),
                players: validNewEmails, // New players to add by email
                is_public: isPublic
            };

            const response = await fetch('/api/squads/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update squad');
            }

            setSuccessMessage('Squad updated successfully!');
            setOriginalName(squadName.trim());
            setOriginalIsPublic(isPublic);
            setNewPlayerEmails(['']);
            
            // Reload squad data to get fresh player list
            await loadSquadData();
            
            // Redirect to squad detail page after a short delay
            // Keep loading state active during redirect
            setTimeout(() => {
                window.location.href = `/squads/${squadId}/`;
            }, 1000);

        } catch (err) {
            setIsSubmitting(false);
            setError(err.message);
            scrollToError('general');
        }
    };

    // Handle cancel
    const handleCancel = () => {
        window.location.href = `/squads/${squadId}/`;
    };

    // Check if there are unsaved changes
    const hasChanges = () => {
        if (squadName !== originalName) return true;
        if (existingPlayers.length !== originalPlayers.length) return true;
        if (getValidNewEmails().length > 0) return true;
        return false;
    };

    if (loading) {
        return (
            <main className="edit-squad-page">
                <section className="page-hero">
                    <div className="container">
                        <div className="hero-content">
                            <h1>Edit <span className="glow">Squad</span></h1>
                        </div>
                    </div>
                </section>
                <section className="edit-section">
                    <div className="container">
                        <div className="loading-container">
                            <div className="loading-spinner">
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                                <div className="spinner-ring"></div>
                            </div>
                            <p className="loading-text">Loading Squad...</p>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    if (error && !squadId) {
        return (
            <main className="edit-squad-page">
                <section className="page-hero">
                    <div className="container">
                        <div className="hero-content">
                            <h1>Edit <span className="glow">Squad</span></h1>
                        </div>
                    </div>
                </section>
                <section className="edit-section">
                    <div className="container">
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <h3>Error Loading Squad</h3>
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/squads/'}>
                                Back to Squads
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="edit-squad-page">
            {isSubmitting && (
                <LoadingOverlay 
                    text="Saving Changes..." 
                    subtext="Please wait, this may take a moment"
                />
            )}

            {/* Hero Section */}
            <section className="page-hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="hero-icon">✏️</span>
                            Edit Mode
                        </div>
                        <h1>Edit <span className="glow">Squad</span></h1>
                    </div>
                </div>
            </section>

            {/* Edit Form Section */}
            <section className="edit-section">
                <div className="container">
                    <div className="edit-form-container">
                        <form className="form-card" onSubmit={handleSubmit}>
                            
                            {/* Success Message */}
                            {successMessage && (
                                <div className="success-message">
                                    <span className="success-icon">✓</span>
                                    {successMessage}
                                </div>
                            )}

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
                                </div>
                                <input
                                    type="text"
                                    className={`squad-name-input ${nameError ? 'error' : ''}`}
                                    placeholder="Enter squad name..."
                                    value={squadName}
                                    onChange={handleNameChange}
                                    maxLength={50}
                                />
                                {nameError && (
                                    <span className="form-error">
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

                            {/* Current Players Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">👥</div>
                                    <span className="form-section-title">Current Players</span>
                                    <span className="form-section-subtitle">{existingPlayers.length} player{existingPlayers.length !== 1 ? 's' : ''}</span>
                                </div>

                                <div className="current-players-section">
                                    {existingPlayers.length > 0 ? (
                                        <div className="existing-players-list">
                                            {existingPlayers.map((player) => (
                                                <PlayerCard
                                                    key={player.id}
                                                    player={player}
                                                    onRemove={() => removeExistingPlayer(player)}
                                                    isRemoving={removingPlayerId === player.id}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-players-hint">
                                            <div className="empty-players-hint-icon">👤</div>
                                            <p className="empty-players-hint-text">
                                                No players in this squad yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Add Players Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon add-icon">➕</div>
                                    <span className="form-section-title">Add New Players</span>
                                    <span className="form-section-subtitle optional-badge">Optional</span>
                                </div>

                                <div className="players-input-section">
                                    <div className="players-header">
                                        <div className="players-count">
                                            <span>New players to add:</span>
                                            <span className="players-count-value">{getValidNewEmails().length}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="add-player-btn"
                                            onClick={addEmailField}
                                        >
                                            <span className="btn-icon">+</span>
                                            Add Field
                                        </button>
                                    </div>

                                    <div className="email-inputs-list">
                                        {newPlayerEmails.map((email, index) => (
                                            <EmailInputRow
                                                key={index}
                                                index={index}
                                                email={email}
                                                onChange={handleEmailChange}
                                                onRemove={removeEmailField}
                                                onAddNew={addEmailField}
                                                canRemove={newPlayerEmails.length > 1 || email !== ''}
                                                inputRef={(el) => (inputRefs.current[index] = el)}
                                            />
                                        ))}
                                    </div>
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
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
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
root.render(<EditSquadApp />);
