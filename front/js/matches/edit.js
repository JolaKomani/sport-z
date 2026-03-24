/**
 * SPORT-ZONE Match Edit Page
 * Form for editing match details including teams and players
 */

const { useState, useEffect } = React;

// Initialize nav auth on page load
updateNavAuth();

// Using shared components from common.js: getInitials, PlayerChip, PlayerSelect

// Team Section Component
const TeamSection = ({ 
    teamId,
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

// Squad Display Component (read-only in edit mode)
const SquadDisplay = ({ squadName, loading }) => (
    <div className="squad-display">
        <label className="form-label">
            <span className="label-icon">🛡️</span>
            Squad
        </label>
        {loading ? (
            <div className="squad-loading">Loading squad...</div>
        ) : (
            <div className="squad-name-display">
                <span className="squad-name-value">{squadName || 'No squad assigned'}</span>
            </div>
        )}
    </div>
);

// Using LoadingOverlay from common.js

// Main Edit Match App
const EditMatchApp = () => {
    const [matchId, setMatchId] = useState(null);
    const [location, setLocation] = useState('');
    const [datetime, setDatetime] = useState('');
    const [teams, setTeams] = useState([]); // Array of {id, name, players: []}
    const [matchSquadId, setMatchSquadId] = useState(null);
    const [matchSquadName, setMatchSquadName] = useState('');
    
    // Data state
    const [squadPlayers, setSquadPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    
    // UI state
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [datetimeError, setDatetimeError] = useState(null);
    const [teamErrors, setTeamErrors] = useState([null, null]); // Array for 2 teams
    const [successMessage, setSuccessMessage] = useState(null);

    // Load match data on mount
    useEffect(() => {
        loadMatchData();
    }, []);

    // Load squad players when match squad is loaded
    useEffect(() => {
        if (matchSquadId) {
            loadSquadPlayers(matchSquadId);
        } else {
            setSquadPlayers([]);
        }
    }, [matchSquadId]);

    const loadSquadPlayers = async (squadId) => {
        try {
            setLoadingPlayers(true);
            const response = await fetch(`/api/squads/${squadId}/players/`);
            if (!response.ok) throw new Error('Failed to load players');
            const data = await response.json();
            setSquadPlayers(data.players || data || []);
        } catch (err) {
            console.error('Error loading players:', err);
            setSquadPlayers([]);
        } finally {
            setLoadingPlayers(false);
        }
    };

    const loadMatchData = async () => {
        try {
            setLoading(true);
            const id = getIdFromUrl('matches');
            
            if (!id) {
                throw new Error('Match not found');
            }

            setMatchId(id);

            const response = await fetch(`/api/matches/${id}/`);
            
            if (!response.ok) {
                throw new Error('Failed to load match details');
            }

            const data = await response.json();
            setLocation(data.location || '');
            
            // Set datetime - API now returns it in YYYY-MM-DDTHH:MM format (no timezone)
            if (data.datetime) {
                setDatetime(data.datetime);
            }

            // Load squad
            if (data.squad) {
                setMatchSquadId(data.squad.id);
                setMatchSquadName(data.squad.name);
            }

            // Load teams data - always ensure 2 teams
            if (data.teams && data.teams.length > 0) {
                const teamsData = data.teams.map(team => ({
                    id: team.id,
                    name: team.name,
                    score: team.score !== null && team.score !== undefined ? team.score : null,
                    players: team.members || []
                }));
                // Ensure we have exactly 2 teams
                while (teamsData.length < 2) {
                    teamsData.push({
                        id: null,
                        name: `Team ${teamsData.length + 1}`,
                        score: null,
                        players: []
                    });
                }
                // Limit to 2 teams
                setTeams(teamsData.slice(0, 2));
            } else {
                // If no teams, initialize with 2 empty teams
                setTeams([
                    { id: null, name: 'Team 1', score: null, players: [] },
                    { id: null, name: 'Team 2', score: null, players: [] }
                ]);
            }
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Using getIdFromUrl from common.js

    // Get all selected player IDs (from all teams)
    const allSelectedPlayerIds = teams.flatMap(team => team.players.map(p => p.id));

    // Team management functions
    const updateTeamName = (teamIndex, newName) => {
        const updatedTeams = [...teams];
        updatedTeams[teamIndex].name = newName;
        setTeams(updatedTeams);
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
        // Clear team error when user starts typing
        if (teamErrors[teamIndex]) {
            const newErrors = [...teamErrors];
            newErrors[teamIndex] = null;
            setTeamErrors(newErrors);
        }
    };

    const updateTeamScore = (teamIndex, newScore) => {
        const updatedTeams = [...teams];
        updatedTeams[teamIndex].score = newScore;
        setTeams(updatedTeams);
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
    };

    const addPlayerToTeam = (teamIndex, player) => {
        const updatedTeams = [...teams];
        if (!updatedTeams[teamIndex].players.find(p => p.id === player.id)) {
            updatedTeams[teamIndex].players = [...updatedTeams[teamIndex].players, player];
            setTeams(updatedTeams);
        }
    };

    const removePlayerFromTeam = (teamIndex, playerId) => {
        const updatedTeams = [...teams];
        updatedTeams[teamIndex].players = updatedTeams[teamIndex].players.filter(p => p.id !== playerId);
        setTeams(updatedTeams);
    };

    // Handle location change
    const handleLocationChange = (e) => {
        setLocation(e.target.value);
        if (locationError) setLocationError(null);
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
    };

    // Handle datetime change
    const handleDatetimeChange = (e) => {
        setDatetime(e.target.value);
        if (datetimeError) setDatetimeError(null);
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
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

    // Validate form
    const validateForm = () => {
        let isValid = true;
        let firstError = null;
        const newTeamErrors = [null, null];

        // Clear previous errors
        setLocationError(null);
        setDatetimeError(null);
        setTeamErrors([null, null]);
        setError(null);

        if (!location.trim()) {
            setLocationError('Location is required');
            if (!firstError) firstError = 'location';
            isValid = false;
        }

        if (!datetime) {
            setDatetimeError('Date and time are required');
            if (!firstError) firstError = 'datetime';
            isValid = false;
        }

        // Validate teams - always need 2 teams
        if (teams.length !== 2) {
            setError('Two teams are required');
            if (!firstError) firstError = 'team';
            isValid = false;
        }

        for (let i = 0; i < teams.length && i < 2; i++) {
            if (!teams[i].name.trim()) {
                newTeamErrors[i] = `Team ${i + 1} name is required`;
                if (!firstError) firstError = 'team';
                isValid = false;
            }
        }
        
        setTeamErrors(newTeamErrors);

        if (!isValid && firstError) {
            scrollToError(firstError);
        }

        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const teamsPayload = teams.map(team => ({
                id: team.id, // Include team ID if it exists (for updates)
                name: team.name.trim(),
                score: team.score !== null && team.score !== undefined ? parseInt(team.score) : null,
                player_ids: team.players.map(p => p.id)
            }));

            const payload = {
                match_id: parseInt(matchId),
                location: location.trim(),
                datetime: datetime,
                teams: teamsPayload
            };

            const response = await fetch('/api/matches/update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update match');
            }

            // Show success message and keep loading state during redirect
            setSuccessMessage('Match updated successfully!');
            
            // Redirect to match detail page after a short delay
            // Keep isSubmitting true during the delay for better UX
            setTimeout(() => {
                window.location.href = `/matches/${matchId}/`;
            }, 1000);

        } catch (err) {
            setIsSubmitting(false);
            setError(err.message);
            scrollToError('general');
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (matchSquadId) {
            window.location.href = `/squads/${matchSquadId}/matches/`;
        } else {
            window.location.href = `/matches/${matchId}/`;
        }
    };

    // Format match date and time for breadcrumb
    const matchDateTime = datetime ? (() => {
        const [datePart, timePart] = datetime.split('T');
        const date = formatDate(datePart);
        const time = formatTime(timePart);
        return `${date} ${time}`;
    })() : null;

    if (loading) {
        return (
            <main className="edit-match-page">
                <section className="page-hero">
                    <div className="container">
                        <div className="hero-content">
                            <h1>Edit <span className="glow">Match</span></h1>
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
                            <p className="loading-text">Loading Match...</p>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    if (error && !matchId) {
        return (
            <main className="edit-match-page">
                <section className="page-hero">
                    <div className="container">
                        <div className="hero-content">
                            <h1>Edit <span className="glow">Match</span></h1>
                        </div>
                    </div>
                </section>
                <section className="edit-section">
                    <div className="container">
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <h3>Error Loading Match</h3>
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={() => {
                                if (matchSquadId) {
                                    window.location.href = `/squads/${matchSquadId}/matches/`;
                                } else {
                                    window.location.href = '/squads/';
                                }
                            }}>
                                Back to Matches
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="edit-match-page">
            {isSubmitting && (
                <LoadingOverlay 
                    text="Saving Changes..." 
                    subtext="Please wait, this may take a moment"
                />
            )}

            {/* Breadcrumb */}
            {matchSquadId && matchSquadName && (
                <section className="breadcrumb-section">
                    <div className="container">
                        <div className="breadcrumb">
                            <a href="/squads/" className="breadcrumb-item">SQUADS</a>
                            <span className="breadcrumb-separator">→</span>
                            <a href={`/squads/${matchSquadId}/`} className="breadcrumb-item">{matchSquadName}</a>
                            <span className="breadcrumb-separator">→</span>
                            <a href={`/squads/${matchSquadId}/matches/`} className="breadcrumb-item">Matches</a>
                            {matchDateTime && (
                                <>
                                    <span className="breadcrumb-separator">→</span>
                                    <a href={`/matches/${matchId}/`} className="breadcrumb-item">{matchDateTime}</a>
                                </>
                            )}
                            <span className="breadcrumb-separator">→</span>
                            <span className="breadcrumb-item active">Edit</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Hero Section */}
            <section className="page-hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="hero-icon">✏️</span>
                            Edit Mode
                        </div>
                        <h1>Edit <span className="glow">Match</span></h1>
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
                                            onChange={handleLocationChange}
                                            maxLength={120}
                                        />
                                        {locationError && (
                                            <span className="form-error">
                                                {locationError}
                                            </span>
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
                                            onChange={handleDatetimeChange}
                                        />
                                        {datetimeError && (
                                            <span className="form-error">
                                                {datetimeError}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Squad Display (read-only) */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">🛡️</div>
                                    <span className="form-section-title">Squad</span>
                                </div>
                                
                                <SquadDisplay
                                    squadName={matchSquadName}
                                    loading={loadingPlayers}
                                />
                                
                                {loadingPlayers && (
                                    <div className="loading-players">Loading squad players...</div>
                                )}
                            </div>

                            {/* Teams Section */}
                            <div className="form-section">
                                <div className="form-section-header">
                                    <div className="form-section-icon">⚔️</div>
                                    <span className="form-section-title">Teams</span>
                                </div>
                                
                                <div className="teams-container">
                                    {/* Always show exactly 2 teams */}
                                    {[0, 1].map((index) => {
                                        const team = teams[index] || { id: null, name: `Team ${index + 1}`, score: null, players: [] };
                                        return (
                                            <React.Fragment key={team.id || index}>
                                                <TeamSection
                                                    teamId={team.id}
                                                    teamNumber={index + 1}
                                                    teamName={team.name}
                                                    score={team.score}
                                                    onScoreChange={(score) => updateTeamScore(index, score)}
                                                    onNameChange={(name) => {
                                                        if (teams[index]) {
                                                            updateTeamName(index, name);
                                                        } else {
                                                            // Add new team if it doesn't exist
                                                            const updatedTeams = [...teams];
                                                            while (updatedTeams.length <= index) {
                                                                updatedTeams.push({ id: null, name: `Team ${updatedTeams.length + 1}`, score: null, players: [] });
                                                            }
                                                            updatedTeams[index].name = name;
                                                            setTeams(updatedTeams);
                                                        }
                                                    }}
                                                    players={team.players || []}
                                                    allSquadPlayers={squadPlayers}
                                                    allSelectedPlayerIds={allSelectedPlayerIds}
                                                    onAddPlayer={(player) => {
                                                        if (teams[index]) {
                                                            addPlayerToTeam(index, player);
                                                        } else {
                                                            const updatedTeams = [...teams];
                                                            while (updatedTeams.length <= index) {
                                                                updatedTeams.push({ id: null, name: `Team ${updatedTeams.length + 1}`, score: null, players: [] });
                                                            }
                                                            updatedTeams[index].players.push(player);
                                                            setTeams(updatedTeams);
                                                        }
                                                    }}
                                                    onRemovePlayer={(playerId) => {
                                                        if (teams[index]) {
                                                            removePlayerFromTeam(index, playerId);
                                                        }
                                                    }}
                                                    error={teamErrors[index]}
                                                    onErrorClear={() => {
                                                        const newErrors = [...teamErrors];
                                                        newErrors[index] = null;
                                                        setTeamErrors(newErrors);
                                                    }}
                                                />
                                                {index === 0 && (
                                                    <div className="teams-vs">VS</div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
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
root.render(<EditMatchApp />);
