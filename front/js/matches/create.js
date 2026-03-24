/**
 * SPORT-ZONE Match Create Page
 * Form for creating new matches with teams and players
 */

const { useState, useEffect } = React;

// Initialize nav auth on page load
updateNavAuth();

// Using shared components from common.js: getInitials, PlayerChip, PlayerSelect

// Team Section Component
const TeamSection = ({ 
    teamNumber, 
    teamName, 
    onNameChange, 
    score,
    onScoreChange,
    players, 
    allSquadPlayers, 
    allSelectedPlayerIds,
    onAddPlayer, 
    onRemovePlayer,
    error,
    onErrorClear
}) => (
    <div className="team-section">
        <div className="team-header">
            <div className="team-number">Team {teamNumber}</div>
            <div className="team-name-input-wrapper">
                <input
                    type="text"
                    className={`team-name-input ${error ? 'error' : ''}`}
                    value={teamName}
                    onChange={(e) => {
                        onNameChange(e.target.value);
                        if (error && onErrorClear) onErrorClear();
                    }}
                    placeholder={`Team ${teamNumber} Name`}
                />
                {error && (
                    <span className="form-error">{error}</span>
                )}
            </div>
        </div>
        
        <div className="team-score-wrapper">
            <label className="team-score-label">
                <span>⚽</span>
                <span>Score (optional)</span>
            </label>
            <input
                type="number"
                className="team-score-input"
                value={score || ''}
                onChange={(e) => onScoreChange(e.target.value === '' ? null : e.target.value)}
                placeholder="Goals"
                min="0"
            />
        </div>
        
        <div className="team-players">
            <div className="team-players-label">
                <span>👥</span>
                <span>Players ({players.length})</span>
            </div>
            
            {players.length > 0 ? (
                <div className="team-players-list">
                    {players.map(player => (
                        <PlayerChip 
                            key={player.id} 
                            player={player} 
                            onRemove={() => onRemovePlayer(player.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="team-players-empty">No players added yet</div>
            )}
            
            <PlayerSelect
                players={allSquadPlayers}
                selectedIds={allSelectedPlayerIds}
                onSelect={onAddPlayer}
                placeholder="+ Add player from squad..."
            />
        </div>
    </div>
);

// Squad Selector Component
const SquadSelector = ({ squads, selectedSquadId, onSelect, loading, error, onErrorClear, disabled, disabledMessage }) => (
    <div className="squad-selector">
        <label className="form-label">
            <span className="label-icon">🛡️</span>
            Select Squad to Pick Players From
        </label>
        {loading ? (
            <div className="squad-loading">Loading squads...</div>
        ) : squads.length === 0 ? (
            <div className="no-squads">No squads available. Create a squad first.</div>
        ) : (
            <>
                <select 
                    className={`squad-select ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
                    value={selectedSquadId || ''}
                    onChange={(e) => {
                        onSelect(e.target.value ? parseInt(e.target.value) : null);
                        if (error && onErrorClear) onErrorClear();
                    }}
                    disabled={loading || disabled}
                    title={disabled ? disabledMessage : ''}
                >
                    <option value="">Select a squad...</option>
                    {squads.map(squad => (
                        <option key={squad.id} value={squad.id}>{squad.name}</option>
                    ))}
                </select>
                {error && (
                    <span className="form-error">{error}</span>
                )}
                {disabled && disabledMessage && !error && (
                    <span className="form-hint">{disabledMessage}</span>
                )}
            </>
        )}
    </div>
);

// Loading Overlay Component
// Using LoadingOverlay from common.js

// Main Create Match App
const CreateMatchApp = () => {
    // Get squad_id from URL query parameter synchronously
    const urlParams = new URLSearchParams(window.location.search);
    const squadIdParam = urlParams.get('squad_id');
    const initialSquadId = squadIdParam ? (() => {
        const id = parseInt(squadIdParam);
        return (!isNaN(id) && id > 0) ? id : null;
    })() : null;
    
    // Redirect immediately if no valid squad_id
    if (!initialSquadId) {
        window.location.href = '/squads/';
        return null; // Return null to prevent rendering
    }
    
    // Form state
    const [location, setLocation] = useState('');
    const [datetime, setDatetime] = useState('');
    const [team1Name, setTeam1Name] = useState('Team 1');
    const [team2Name, setTeam2Name] = useState('Team 2');
    const [team1Score, setTeam1Score] = useState(null);
    const [team2Score, setTeam2Score] = useState(null);
    const [team1Players, setTeam1Players] = useState([]);
    const [team2Players, setTeam2Players] = useState([]);
    
    // Data state
    const [squadId, setSquadId] = useState(initialSquadId);
    const [squadName, setSquadName] = useState(null);
    const [squadPlayers, setSquadPlayers] = useState([]);
    const [loadingSquad, setLoadingSquad] = useState(true);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    
    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [datetimeError, setDatetimeError] = useState(null);
    const [team1Error, setTeam1Error] = useState(null);
    const [team2Error, setTeam2Error] = useState(null);

    // Load squad data and players
    const loadSquadData = async (squadId) => {
        try {
            setLoadingSquad(true);
            const response = await fetch(`/api/squads/${squadId}/`);
            if (!response.ok) throw new Error('Failed to load squad');
            const data = await response.json();
            setSquadName(data.name);
            loadSquadPlayers(squadId);
        } catch (err) {
            setError(err.message);
            setLoadingSquad(false);
        }
    };

    // Load squad data on mount
    useEffect(() => {
        if (initialSquadId) {
            loadSquadData(initialSquadId);
        }
    }, []);

    const loadSquadPlayers = async (squadId) => {
        try {
            setLoadingPlayers(true);
            const response = await fetch(`/api/squads/${squadId}/players/`);
            if (!response.ok) throw new Error('Failed to load players');
            const data = await response.json();
            setSquadPlayers(data.players || data || []);
            setLoadingSquad(false);
        } catch (err) {
            console.error('Error loading players:', err);
            setSquadPlayers([]);
            setLoadingSquad(false);
        } finally {
            setLoadingPlayers(false);
        }
    };

    // Get all selected player IDs (from both teams)
    const allSelectedPlayerIds = [
        ...team1Players.map(p => p.id),
        ...team2Players.map(p => p.id)
    ];

    // Team player management
    const addPlayerToTeam1 = (player) => {
        setTeam1Players([...team1Players, player]);
    };

    const addPlayerToTeam2 = (player) => {
        setTeam2Players([...team2Players, player]);
    };

    const removePlayerFromTeam1 = (playerId) => {
        setTeam1Players(team1Players.filter(p => p.id !== playerId));
    };

    const removePlayerFromTeam2 = (playerId) => {
        setTeam2Players(team2Players.filter(p => p.id !== playerId));
    };

    // Scroll to first error field
    const scrollToError = (errorType) => {
        setTimeout(() => {
            let element = null;
            
            if (errorType === 'location') {
                // Find location input by looking for label with "Location" text
                const labels = Array.from(document.querySelectorAll('.form-label'));
                const locationLabel = labels.find(label => label.textContent.includes('Location'));
                if (locationLabel) {
                    const formGroup = locationLabel.closest('.form-group');
                    element = formGroup?.querySelector('input[type="text"]');
                }
            } else if (errorType === 'datetime') {
                element = document.querySelector('input[type="datetime-local"]');
            } else if (errorType === 'team') {
                element = document.querySelector('.team-name-input');
            } else if (errorType === 'general') {
                element = document.querySelector('.server-error');
            }
            
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
                    element.focus();
                }
            }
        }, 100);
    };

    // Form validation
    const validateForm = () => {
        let isValid = true;
        
        // Clear previous errors
        setLocationError(null);
        setDatetimeError(null);
        setTeam1Error(null);
        setTeam2Error(null);
        setError(null);
        
        if (!location.trim()) {
            setLocationError('Location is required');
            if (isValid) scrollToError('location');
            isValid = false;
        }
        if (!datetime) {
            setDatetimeError('Date and time are required');
            if (isValid) scrollToError('datetime');
            isValid = false;
        }
        if (!squadId) {
            setError('Squad ID is required');
            isValid = false;
        }
        if (!team1Name.trim()) {
            setTeam1Error('Team 1 name is required');
            if (isValid) scrollToError('team');
            isValid = false;
        }
        if (!team2Name.trim()) {
            setTeam2Error('Team 2 name is required');
            if (isValid) scrollToError('team');
            isValid = false;
        }
        
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                location: location.trim(),
                datetime: datetime,
                squad_id: squadId,
                teams: [
                    {
                        name: team1Name.trim(),
                        members_ids: team1Players.map(p => p.id),
                        score: team1Score !== null ? parseInt(team1Score) : null
                    },
                    {
                        name: team2Name.trim(),
                        members_ids: team2Players.map(p => p.id),
                        score: team2Score !== null ? parseInt(team2Score) : null
                    }
                ]
            };

            const response = await fetch('/api/matches/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create match');
            }

            // Show success message briefly before redirect to squad's matches
            // Keep loading state active during redirect
            setTimeout(() => {
                if (squadId) {
                    window.location.href = `/squads/${squadId}/matches/`;
                } else {
                    // Fallback if no squad (shouldn't happen due to validation)
                    window.location.href = '/squads/';
                }
            }, 500);

        } catch (err) {
            setIsSubmitting(false);
            setError(err.message);
            scrollToError('general');
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (squadId) {
            window.location.href = `/squads/${squadId}/matches/`;
        } else {
            window.location.href = '/squads/';
        }
    };

    if (loadingSquad) {
        return (
            <main className="create-match-page">
                <section className="page-hero">
                    <div className="container">
                        <div className="hero-content">
                            <h1><span className="glow">NEW MATCH</span></h1>
                        </div>
                    </div>
                </section>
                <section className="create-section">
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

    // If no squad_id, don't render the form (will redirect in useEffect)
    if (!squadId && !loadingSquad) {
        return null; // Will redirect in useEffect
    }

    return (
        <main className="create-match-page">
            {isSubmitting && (
                <LoadingOverlay 
                    text="Creating Match..." 
                    subtext="Please wait, this may take a moment"
                />
            )}

            {/* Breadcrumb */}
            {squadId && squadName && (
                <section className="breadcrumb-section">
                    <div className="container">
                        <div className="breadcrumb">
                            <a href="/squads/" className="breadcrumb-item">SQUADS</a>
                            <span className="breadcrumb-separator">→</span>
                            <a href={`/squads/${squadId}/`} className="breadcrumb-item">{squadName}</a>
                            <span className="breadcrumb-separator">→</span>
                            <a href={`/squads/${squadId}/matches/`} className="breadcrumb-item">Matches</a>
                            <span className="breadcrumb-separator">→</span>
                            <span className="breadcrumb-item active">Create new match</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Hero Section */}
            <section className="page-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1><span className="glow">NEW MATCH</span></h1>
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

                            {/* Match Details Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">📍</div>
                                    <span className="form-section-title">Match Details</span>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">🏟️</span>
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-input ${locationError ? 'error' : ''}`}
                                            placeholder="Enter venue/location..."
                                            value={location}
                                            onChange={(e) => {
                                                setLocation(e.target.value);
                                                if (locationError) setLocationError(null);
                                                if (error) setError(null);
                                            }}
                                        />
                                        {locationError && (
                                            <span className="form-error">{locationError}</span>
                                        )}
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">📅</span>
                                            Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            className={`form-input ${datetimeError ? 'error' : ''}`}
                                            value={datetime}
                                            onChange={(e) => {
                                                setDatetime(e.target.value);
                                                if (datetimeError) setDatetimeError(null);
                                                if (error) setError(null);
                                            }}
                                        />
                                        {datetimeError && (
                                            <span className="form-error">{datetimeError}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Teams Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">⚔️</div>
                                    <span className="form-section-title">Teams</span>
                                </div>
                                
                                <div className="teams-container">
                                    <TeamSection
                                        teamNumber={1}
                                        teamName={team1Name}
                                        onNameChange={setTeam1Name}
                                        score={team1Score}
                                        onScoreChange={setTeam1Score}
                                        players={team1Players}
                                        allSquadPlayers={squadPlayers}
                                        allSelectedPlayerIds={allSelectedPlayerIds}
                                        onAddPlayer={addPlayerToTeam1}
                                        onRemovePlayer={removePlayerFromTeam1}
                                    />
                                    
                                    <div className="teams-vs">VS</div>
                                    
                                    <TeamSection
                                        teamNumber={2}
                                        teamName={team2Name}
                                        onNameChange={setTeam2Name}
                                        score={team2Score}
                                        onScoreChange={setTeam2Score}
                                        players={team2Players}
                                        allSquadPlayers={squadPlayers}
                                        allSelectedPlayerIds={allSelectedPlayerIds}
                                        onAddPlayer={addPlayerToTeam2}
                                        onRemovePlayer={removePlayerFromTeam2}
                                    />
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
                                        'Create Match'
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
root.render(<CreateMatchApp />);
