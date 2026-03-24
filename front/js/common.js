/**
 * SPORT-ZONE Common JavaScript Utilities & Components
 * Shared across all React pages
 */

const { useState } = React;

// ===== UTILITY FUNCTIONS =====

// Format date for display (e.g., "Jan 10")
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Format time for display (e.g., "8:00 PM")
const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
};

// Format date for detail view (e.g., "Monday, January 10, 2024")
const formatDateLong = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

// Get player initials from name
const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Simple email validation (more strict version)
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ===== REACT COMPONENTS =====

// Form Input Component - Reusable form input with label and error handling
const FormInput = ({ label, type, name, value, onChange, placeholder, icon, error, autoComplete }) => (
    <div className="form-group">
        <label htmlFor={name} className="form-label">
            <span className="label-icon">{icon}</span>
            {label}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`form-input ${error ? 'error' : ''}`}
            autoComplete={autoComplete || 'off'}
        />
        {error && <span className="form-error">{error}</span>}
    </div>
);

// Loading Spinner Component - Animated loading indicator
const LoadingSpinner = ({ text = 'Loading...' }) => (
    <div className="loading-container">
        <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
        </div>
        <p className="loading-text">{text}</p>
    </div>
);

// Empty State Component - Shown when no data is available
const EmptyState = ({ icon = '📭', title = 'No Data Found', message, buttonText, onButtonClick }) => (
    <div className="empty-state">
        <div className="empty-icon">{icon}</div>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        {buttonText && (
            <button className="btn btn-primary" onClick={onButtonClick}>
                {buttonText}
            </button>
        )}
    </div>
);

// Error State Component - Shown when an error occurs
const ErrorState = ({ title = 'Error', message, onRetry }) => (
    <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h3>{title}</h3>
        <p>{message}</p>
        {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
                Retry
            </button>
        )}
    </div>
);

// Server Error Alert - Inline error message
const ServerErrorAlert = ({ message }) => (
    <div className="server-error">
        <span className="error-icon">⚠️</span>
        {message}
    </div>
);

// Submit Button - Form submit button with loading state
const SubmitButton = ({ isSubmitting, loadingText, children }) => (
    <button
        type="submit"
        className={`btn btn-primary btn-lg btn-full ${isSubmitting ? 'loading' : ''}`}
        disabled={isSubmitting}
    >
        {isSubmitting ? (
            <>
                <span className="spinner"></span>
                {loadingText || 'Loading...'}
            </>
        ) : (
            children
        )}
    </button>
);

// Loading Overlay Component - Full screen loading overlay
const LoadingOverlay = ({ text, subtext }) => (
    <div className="loading-overlay">
        <div className="loading-content">
            <div className="loading-spinner-large">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">{text}</p>
            {subtext && <p className="loading-subtext">{subtext}</p>}
        </div>
    </div>
);

// ===== MATCH/SQUAD SHARED COMPONENTS =====

// Player Chip Component - Display player with remove button
const PlayerChip = ({ player, onRemove }) => (
    <div className="player-chip">
        <div className="player-chip-avatar">{getInitials(player.name)}</div>
        <span className="player-chip-name">{player.name}</span>
        {onRemove && (
            <button type="button" className="player-chip-remove" onClick={onRemove}>✕</button>
        )}
    </div>
);

// Player Select Dropdown - Select player from available list
const PlayerSelect = ({ players, selectedIds, onSelect, placeholder = "Select a player..." }) => {
    const availablePlayers = players.filter(p => !selectedIds.includes(p.id));
    
    if (availablePlayers.length === 0) {
        return <div className="no-players-available">No more players available</div>;
    }

    return (
        <select 
            className="player-select"
            onChange={(e) => {
                if (e.target.value) {
                    const player = players.find(p => p.id === parseInt(e.target.value));
                    if (player) onSelect(player);
                    e.target.value = '';
                }
            }}
            defaultValue=""
        >
            <option value="">{placeholder}</option>
            {availablePlayers.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
            ))}
        </select>
    );
};

// Player Card Component - Display player in card format
const PlayerCard = ({ player, index = 0, onRemove, isRemoving, isAdmin = false, variant = 'medium', rating = null }) => {
    const avatarClass = `player-avatar-${variant}${isAdmin ? ' admin-avatar' : ''}`;
    
    return (
        <div className="player-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className={avatarClass}>{getInitials(player.name)}</div>
            <div className="player-info">
                <div className="player-name">{player.name}</div>
                {!onRemove && <div className="player-role">{isAdmin ? 'Admin' : 'Player'}</div>}
            </div>
            {onRemove && (
                <button 
                    type="button"
                    className="player-card-remove"
                    onClick={onRemove}
                    disabled={isRemoving}
                >
                    {isRemoving ? '...' : '✕'}
                </button>
            )}
            {!onRemove && (
                rating !== null && rating !== undefined ? (
                    <div className="player-rating-badge">{rating.toFixed(1)}</div>
                ) : (
                    <div className="player-status-indicator"></div>
                )
            )}
        </div>
    );
};

// ===== FORM UTILITIES =====

// Email Input Row Component - Reusable email input with validation and add-on-enter
const EmailInputRow = ({ index, email, onChange, onRemove, canRemove, onAddNew, inputRef }) => {
    const [isFocused, setIsFocused] = useState(false);
    const isValid = email === '' || isValidEmail(email);
    const showValid = email !== '' && isValid;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            // Only add new field if current email is not empty
            if (email.trim() !== '' && onAddNew) {
                onAddNew(index);
            }
        }
    };

    return (
        <div className="email-input-row">
            <div className="email-input-number">{index + 1}</div>
            <div className="email-input-wrapper">
                <span className="email-input-icon">📧</span>
                <input
                    ref={inputRef}
                    type="email"
                    className={`email-input ${!isValid ? 'error' : ''} ${showValid ? 'valid' : ''}`}
                    placeholder="player@email.com"
                    value={email}
                    onChange={(e) => onChange(index, e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
            </div>
            {canRemove && (
                <button
                    type="button"
                    className="remove-email-btn"
                    onClick={() => onRemove(index)}
                    title="Remove player"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

// Generic scroll to error utility
const scrollToError = (errorType, selectors = {}) => {
    setTimeout(() => {
        let element = null;
        const defaultSelectors = {
            name: '.squad-name-input, .form-input[name="name"]',
            email: '.email-input.error',
            location: '.form-input[name="location"]',
            datetime: '.form-input[type="datetime-local"]',
            squad: '.squad-select',
            team: '.team-name-input',
            general: '.server-error'
        };
        
        const selector = selectors[errorType] || defaultSelectors[errorType];
        if (selector) {
            element = document.querySelector(selector);
        }
        
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                element.focus();
            }
        }
    }, 100);
};

// Generic get ID from URL utility
const getIdFromUrl = (pathSegment) => {
    const pathParts = window.location.pathname.split('/').filter(p => p);
    const segmentIndex = pathParts.indexOf(pathSegment);
    if (segmentIndex !== -1 && pathParts[segmentIndex + 1]) {
        return pathParts[segmentIndex + 1];
    }
    return null;
};

// ===== MODAL COMPONENTS =====

// Confirmation Modal Component - Beautiful popup for confirmations
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="modal-container">
                <div className="modal-header">
                    <div className="modal-icon">
                        {type === "danger" ? "⚠️" : "❓"}
                    </div>
                    <h3 className="modal-title">{title}</h3>
                </div>
                <div className="modal-body">
                    <p className="modal-message">{message}</p>
                </div>
                <div className="modal-actions">
                    <button
                        type="button"
                        className="btn btn-cancel"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`btn btn-${type}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
