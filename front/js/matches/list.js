/**
 * SPORT-ZONE Matches Page
 * Displays all available matches with filtering
 */

const { useState, useEffect } = React;

// Initialize nav auth on page load
updateNavAuth();

// Location emoji mapping for visual flair
const locationEmojis = ['🐉', '🦊', '🐺', '🦈', '🔥', '⚡', '🌟', '💫', '🦁', '🦅', '🐍', '🦇'];

const getLocationEmoji = (location, index) => {
    const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return locationEmojis[(hash + index) % locationEmojis.length];
};

// Match Card Component
const MatchCard = ({ match, index, onDelete, canDelete = false }) => {
    const team1 = match.teams && match.teams[0] ? (typeof match.teams[0] === 'string' ? { name: match.teams[0], score: null } : match.teams[0]) : { name: 'Team 1', score: null };
    const team2 = match.teams && match.teams[1] ? (typeof match.teams[1] === 'string' ? { name: match.teams[1], score: null } : match.teams[1]) : { name: 'Team 2', score: null };
    const team1Name = team1.name || team1;
    const team2Name = team2.name || team2;
    const team1Score = team1.score !== null && team1.score !== undefined ? team1.score : null;
    const team2Score = team2.score !== null && team2.score !== undefined ? team2.score : null;

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDelete(match);
    };

    return (
        <div 
            className="match-card clickable" 
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => window.location.href = `/matches/${match.id}/`}
        >
            <div className="match-card-header">
                <div className="match-id">
                    <span className="match-id-label">Match</span>
                    <span className="match-id-value">#{match.id}</span>
                </div>
                <div className="match-header-actions">
                    <span className="match-status open">Open</span>
                    {canDelete && (
                        <button
                            type="button"
                            className="match-delete-btn"
                            onClick={handleDeleteClick}
                            title="Delete match"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {match.squad && (
                <div className="match-squad-display">
                    <span className="squad-icon">🛡️</span>
                    <span className="squad-name">{match.squad.name}</span>
                </div>
            )}

            {/* Match Content Section */}
            <div className="match-content">
                {/* Teams & Score Section */}
                <div className="match-teams-section">
                    <div className="team-card-compact">
                        <div className="team-name-compact">{team1Name}</div>
                    </div>
                    <div className="vs-container">
                        {team1Score !== null && team2Score !== null ? (
                            <div className="score-display">
                                <span className="score-value">{team1Score}</span>
                                <span className="score-separator">-</span>
                                <span className="score-value">{team2Score}</span>
                            </div>
                        ) : (
                            <span className="vs-divider">VS</span>
                        )}
                    </div>
                    <div className="team-card-compact">
                        <div className="team-name-compact">{team2Name}</div>
                    </div>
                </div>

                {/* Match Details Section */}
                <div className="match-details-section">
                    <div className="detail-item">
                        <div className="detail-icon">🏟️</div>
                        <div className="detail-content">
                            <div className="detail-label">Location</div>
                            <div className="detail-value">{match.location}</div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-icon">📅</div>
                        <div className="detail-content">
                            <div className="detail-label">Date</div>
                            <div className="detail-value">{match.datetime ? (() => {
                                const [datePart] = match.datetime.split('T');
                                return formatDate(datePart);
                            })() : 'N/A'}</div>
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-icon">⏰</div>
                        <div className="detail-content">
                            <div className="detail-label">Time</div>
                            <div className="detail-value">{match.datetime ? (() => {
                                const [, timePart] = match.datetime.split('T');
                                return formatTime(timePart);
                            })() : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main App Component
const MatchesApp = () => {
    const [squadId, setSquadId] = useState(null);
    const [squadName, setSquadName] = useState(null);
    const [squadAdmins, setSquadAdmins] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, match: null });

    useEffect(() => {
        loadCurrentUser();
        fetchMatches();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const response = await fetch('/api/users/me/');
            if (response.ok) {
                const user = await response.json();
                setCurrentUserId(user.id);
            }
        } catch (err) {
            // User not authenticated, that's okay
            console.log('User not authenticated');
        }
    };

    const fetchMatches = async () => {
        try {
            setLoading(true);
            // Get squad_id from URL path (format: /squads/<squad_id>/matches/)
            const pathParts = window.location.pathname.split('/').filter(part => part);
            let squadId = null;
            
            // Check if we're on /squads/<squad_id>/matches/ path
            if (pathParts.length >= 3 && pathParts[0] === 'squads' && pathParts[2] === 'matches') {
                const potentialSquadId = parseInt(pathParts[1]);
                if (!isNaN(potentialSquadId)) {
                    squadId = potentialSquadId;
                }
            }
            
            // Squad ID is required
            if (!squadId) {
                throw new Error('Squad ID is required. Invalid URL path.');
            }
            
            setSquadId(squadId);
            const apiUrl = `/api/matches/?squad_id=${squadId}`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch matches');
            const data = await response.json();
            setMatches(data);
            
            // If we have matches, try to get admins from first match's squad
            if (data.length > 0 && data[0].squad && data[0].squad.admins) {
                setSquadAdmins(data[0].squad.admins);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (match) => {
        setDeleteModal({ isOpen: true, match });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.match) return;

        try {
            const response = await fetch('/api/matches/delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ match_id: deleteModal.match.id })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete match');
            }

            // Remove match from list and refresh
            fetchMatches();
            setDeleteModal({ isOpen: false, match: null });
        } catch (err) {
            alert('Error deleting match: ' + err.message);
            setDeleteModal({ isOpen: false, match: null });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, match: null });
    };

    useEffect(() => {
        if (squadId) {
            fetchSquadName();
        }
    }, [squadId]);
    
    const fetchSquadName = async () => {
        try {
            const response = await fetch(`/api/squads/${squadId}/`);
            if (response.ok) {
                const data = await response.json();
                setSquadName(data.name);
                setSquadAdmins(data.admins || []);
            }
        } catch (err) {
            console.error('Failed to fetch squad name:', err);
        }
    };
    
    // Check if current user is an admin
    const isCurrentUserAdmin = currentUserId && squadAdmins.length > 0
        ? squadAdmins.some(admin => admin.id === currentUserId)
        : false;

    return (
        <main className="matches-page">
            {/* Breadcrumb */}
            {squadId && (
                <section className="breadcrumb-section">
                    <div className="container">
                        <div className="breadcrumb-container">
                            <div className="breadcrumb">
                                <a href="/squads/" className="breadcrumb-item">SQUADS</a>
                                <span className="breadcrumb-separator">→</span>
                                <a href={`/squads/${squadId}/`} className="breadcrumb-item">{squadName || 'Loading...'}</a>
                                <span className="breadcrumb-separator">→</span>
                                <span className="breadcrumb-item active">Matches</span>
                            </div>
                            {isCurrentUserAdmin && (
                                <button 
                                    className="btn btn-primary btn-sm" 
                                    onClick={() => {
                                        if (squadId) {
                                            window.location.href = `/matches/create/?squad_id=${squadId}`;
                                        } else {
                                            alert('Squad ID is not available. Please refresh the page.');
                                        }
                                    }}
                                >
                                    <span className="btn-icon">+</span>
                                    Create Match
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Matches Section */}
            <section className="matches-section">
                <div className="container">
                    {loading ? (
                        <LoadingSpinner text="Loading Matches..." />
                    ) : error ? (
                        <ErrorState
                            title="Error Loading Matches"
                            message={error}
                            onRetry={fetchMatches}
                        />
                    ) : matches.length === 0 ? (
                        <EmptyState
                            icon="🏟️"
                            title="No Matches Found"
                            message="There are no scheduled matches for this squad. Create a new match to get started!"
                            buttonText={isCurrentUserAdmin ? "Create Match" : null}
                            onButtonClick={isCurrentUserAdmin ? () => {
                                if (squadId) {
                                    window.location.href = `/matches/create/?squad_id=${squadId}`;
                                } else {
                                    alert('Squad ID is not available. Please refresh the page.');
                                }
                            } : null}
                        />
                    ) : (
                        <div className="matches-grid">
                                {matches.map((match, index) => (
                                <MatchCard 
                                    key={match.id} 
                                    match={match} 
                                    index={index}
                                    onDelete={handleDeleteClick}
                                    canDelete={isCurrentUserAdmin}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Match"
                message={`Are you sure you want to delete Match #${deleteModal.match?.id}? This action cannot be undone and will also delete all associated teams.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </main>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MatchesApp />);
