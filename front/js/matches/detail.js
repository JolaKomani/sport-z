/**
 * SPORT-ZONE Match Detail Page
 * Displays detailed information about a specific match
 */

const { useState, useEffect } = React;

// Initialize nav auth on page load
updateNavAuth();

// Location emoji mapping for visual flair
const locationEmojis = ['🐉', '🦊', '🐺', '🦈', '🔥', '⚡', '🌟', '💫', '🦁', '🦅', '🐍', '🦇'];

const getLocationEmoji = (location, id) => {
    const hash = (location || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return locationEmojis[(hash + (id || 0)) % locationEmojis.length];
};

// Using getIdFromUrl from common.js

// Using shared utilities from common.js: getInitials, formatDateLong (as formatDate), formatTime, PlayerCard

// Rating Modal Component
const RatingModal = ({ isOpen, onClose, players, currentUserId, ratings, onSubmit }) => {
    const [playerRatings, setPlayerRatings] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && ratings) {
            const initialRatings = {};
            players.forEach(player => {
                const rating = ratings.find(r => 
                    r.rater_user.id === currentUserId && r.rated_user.id === player.id
                );
                if (rating) {
                    initialRatings[player.id] = rating.rating;
                }
            });
            setPlayerRatings(initialRatings);
        }
    }, [isOpen, players, ratings, currentUserId]);

    if (!isOpen) return null;

    const handleRatingChange = (playerId, score) => {
        setPlayerRatings(prev => ({
            ...prev,
            [playerId]: score
        }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            for (const [playerId, score] of Object.entries(playerRatings)) {
                if (score !== null && score !== undefined) {
                    await onSubmit(parseInt(playerId), parseInt(score));
                }
            }
            onClose();
        } catch (err) {
            console.error('Error submitting ratings:', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content rating-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⭐ Rate Players</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p className="rating-instructions">
                        Rate each player from 1 to 10 based on their performance in this match.
                    </p>
                    <div className="players-rating-list">
                        {players.length === 0 ? (
                            <p className="no-players">No other players to rate in this match.</p>
                        ) : (
                            players.map(player => (
                                <div key={player.id} className="player-rating-item">
                                    <div className="player-rating-info">
                                        <div className="player-rating-avatar">
                                            {getInitials(player.name || player.full_name || player.email || '')}
                                        </div>
                                        <div className="player-rating-name">
                                            {player.name || player.full_name || player.email || 'Unknown Player'}
                                        </div>
                                    </div>
                                    <div className="rating-stars">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                                            <button
                                                key={score}
                                                className={`rating-star ${playerRatings[player.id] === score ? 'active' : ''}`}
                                                onClick={() => handleRatingChange(player.id, score)}
                                                type="button"
                                            >
                                                {score}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                        Cancel
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSubmit}
                        disabled={submitting || players.length === 0}
                    >
                        {submitting ? 'Submitting...' : 'Submit Ratings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Team Card Component
const TeamCard = ({ team, index, playerAverages = {} }) => (
    <div className="team-card" style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="team-header">
            <div className="team-name">{team.name}</div>
            <div className="team-header-right">
                {team.score !== null && team.score !== undefined && (
                    <div className="team-score">⚽ {team.score}</div>
                )}
                <div className="team-count">{team.members.length} player{team.members.length !== 1 ? 's' : ''}</div>
            </div>
        </div>
        <div className="team-players">
            {team.members.length > 0 ? (
                <div className="players-grid">
                    {team.members
                        .map((player) => {
                            const avgData = playerAverages[player.id];
                            const avgRating = avgData?.average_rating;
                            return {
                                player,
                                avgRating: avgRating !== null && avgRating !== undefined ? avgRating : -1
                            };
                        })
                        .sort((a, b) => {
                            // Sort by rating (descending), players without ratings go to the end
                            if (a.avgRating === -1 && b.avgRating === -1) return 0;
                            if (a.avgRating === -1) return 1;
                            if (b.avgRating === -1) return -1;
                            return b.avgRating - a.avgRating;
                        })
                        .map(({ player, avgRating }, idx) => {
                            const finalRating = avgRating === -1 ? null : avgRating;
                            return (
                                <PlayerCard 
                                    key={player.id} 
                                    player={player} 
                                    index={idx} 
                                    variant="medium"
                                    rating={finalRating}
                                />
                            );
                        })}
                </div>
            ) : (
                <div className="empty-players-state">
                    <div className="empty-players-icon">👥</div>
                    <p className="empty-players-text">No players in this team</p>
                </div>
            )}
        </div>
    </div>
);

// Main Match Detail App
const MatchDetailApp = () => {
    const [match, setMatch] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [ratingModal, setRatingModal] = useState(false);
    const [ratings, setRatings] = useState([]);
    const [matchPlayers, setMatchPlayers] = useState([]);
    const [playerAverages, setPlayerAverages] = useState({});

    useEffect(() => {
        loadCurrentUser();
        loadMatchData();
    }, []);

    useEffect(() => {
        if (match) {
            extractMatchPlayers();
            loadRatings();
            loadPlayerAverages();
        }
    }, [match]);

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

    const loadMatchData = async () => {
        try {
            setLoading(true);
            const matchId = getIdFromUrl('matches');
            
            if (!matchId) {
                throw new Error('Match not found');
            }

            const response = await fetch(`/api/matches/${matchId}/`);
            
            if (!response.ok) {
                throw new Error('Failed to load match details');
            }

            const data = await response.json();
            setMatch(data);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const extractMatchPlayers = () => {
        if (!match || !match.teams) return;
        
        const allPlayers = [];
        const playerIds = new Set();
        
        match.teams.forEach(team => {
            if (team.members) {
                team.members.forEach(player => {
                    if (!playerIds.has(player.id)) {
                        playerIds.add(player.id);
                        allPlayers.push(player);
                    }
                });
            }
        });
        
        setMatchPlayers(allPlayers);
    };

    const loadRatings = async () => {
        if (!match) return;
        
        try {
            const response = await fetch(`/api/ratings/match/${match.id}/`);
            if (response.ok) {
                const data = await response.json();
                setRatings(data);
            }
        } catch (err) {
            console.error('Error loading ratings:', err);
        }
    };

    const loadPlayerAverages = async () => {
        if (!match) return;
        
        try {
            const response = await fetch(`/api/ratings/match/${match.id}/?averages=true`);
            if (response.ok) {
                const data = await response.json();
                setPlayerAverages(data);
            }
        } catch (err) {
            console.error('Error loading player averages:', err);
        }
    };

    const isCurrentUserPlayer = () => {
        if (!currentUserId || !match || !match.teams) return false;
        
        // Check if current user is in any team
        for (const team of match.teams) {
            if (team.members) {
                if (team.members.some(player => player.id === currentUserId)) {
                    return true;
                }
            }
        }
        return false;
    };

    const getRatingForPlayer = (playerId) => {
        if (!ratings || !currentUserId) return null;
        const rating = ratings.find(r => 
            r.rater_user.id === currentUserId && r.rated_user.id === playerId
        );
        return rating ? rating.rating : null;
    };

    const handleRatingSubmit = async (ratedUserId, score) => {
        if (!match) return;
        
        try {
            const response = await fetch(`/api/ratings/create/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    match_id: match.id,
                    rated_user_id: ratedUserId,
                    score: score
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to submit rating');
            }

            // Reload ratings and averages
            await loadRatings();
            await loadPlayerAverages();
        } catch (err) {
            alert('Error submitting rating: ' + err.message);
        }
    };

    const emoji = match ? getLocationEmoji(match.location, match.id) : '🏟️';
    const playerCount = match?.players ? match.players.length : 0;
    const teamCount = match?.teams ? match.teams.length : 0;
    const squad = match?.squad;
    
    // Check if current user is an admin
    const isCurrentUserAdmin = currentUserId && squad?.admins
        ? squad.admins.some(admin => admin.id === currentUserId)
        : false;
    
    // Format match date and time for breadcrumb
    const matchDateTime = match?.datetime ? (() => {
        const [datePart, timePart] = match.datetime.split('T');
        const date = formatDate(datePart);
        const time = formatTime(timePart);
        return `${date} ${time}`;
    })() : null;

    return (
        <main className="match-detail-page">
            {/* Breadcrumb */}
            {squad && (
                <section className="breadcrumb-section">
                    <div className="container">
                        <div className="breadcrumb">
                            <a href="/squads/" className="breadcrumb-item">SQUADS</a>
                            <span className="breadcrumb-separator">→</span>
                            <a href={`/squads/${squad.id}/`} className="breadcrumb-item">{squad.name}</a>
                            <span className="breadcrumb-separator">→</span>
                            <a href={`/squads/${squad.id}/matches/`} className="breadcrumb-item">MATCHES</a>
                            {matchDateTime && (
                                <>
                                    <span className="breadcrumb-separator">→</span>
                                    <span className="breadcrumb-item active">{matchDateTime}</span>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Hero Section */}
            <section className="page-hero">
                <div className="container">
                    <div className="hero-content">
                        <h1>Match <span className="glow">Details</span></h1>
                    </div>
                </div>
            </section>

            {/* Match Detail Section */}
            <section className="match-detail-section">
                <div className="container">
                    <div className="detail-container">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner">
                                    <div className="spinner-ring"></div>
                                    <div className="spinner-ring"></div>
                                    <div className="spinner-ring"></div>
                                </div>
                                <p className="loading-text">Loading Match...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <div className="error-icon">⚠️</div>
                                <h3>Error Loading Match</h3>
                                <p>{error}</p>
                                <button className="btn btn-primary" onClick={() => {
                                    if (match?.squad?.id) {
                                        window.location.href = `/squads/${match.squad.id}/matches/`;
                                    } else {
                                        window.location.href = '/squads/';
                                    }
                                }}>
                                    Back to Matches
                                </button>
                            </div>
                        ) : match ? (
                            <>
                                {/* Match Profile Card */}
                                <div className="match-profile-card">
                                    {/* Header */}
                                    <div className="match-profile-header">
                                        <div className="match-avatar-large">{emoji}</div>
                                        <div className="match-header-info">
                                            {match.id && (
                                                <div className="match-id-badge">Match #{match.id}</div>
                                            )}
                                            <h1 className="match-profile-location">{match.location}</h1>
                                            <div className="match-datetime-info">
                                                {match.datetime ? (() => {
                                                    // Extract date and time directly from YYYY-MM-DDTHH:MM format
                                                    const [datePart, timePart] = match.datetime.split('T');
                                                    return (
                                                        <>
                                                            <span>📅</span>
                                                            <span>{formatDateLong(datePart)}</span>
                                                            <span>•</span>
                                                            <span>⏰</span>
                                                            <span>{formatTime(timePart)}</span>
                                                        </>
                                                    );
                                                })() : (
                                                    <>
                                                        <span>📅</span>
                                                        <span>N/A</span>
                                                        <span>•</span>
                                                        <span>⏰</span>
                                                        <span>N/A</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="match-header-actions">
                                            {isCurrentUserPlayer() && (
                                                <button 
                                                    className="btn btn-primary"
                                                    onClick={() => setRatingModal(true)}
                                                >
                                                    ⭐ Rate Players
                                                </button>
                                            )}
                                            {isCurrentUserAdmin && (
                                                <>
                                                    <button 
                                                        className="btn btn-primary"
                                                        onClick={() => window.location.href = `/matches/${match.id}/update/`}
                                                    >
                                                        Edit Match
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger"
                                                        onClick={() => setDeleteModal(true)}
                                                    >
                                                        ✕ Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats Bar */}
                                    <div className="match-stats-bar">
                                        <div className="match-stat">
                                            <span className="match-stat-icon">⚔️</span>
                                            <span className="match-stat-value accent">{teamCount}</span>
                                            <span className="match-stat-label">Team{teamCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="match-stat">
                                            <span className="match-stat-icon">👥</span>
                                            <span className="match-stat-value accent">{playerCount}</span>
                                            <span className="match-stat-label">Player{playerCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="match-stat">
                                            <span className="match-stat-icon">🛡️</span>
                                            <span className="match-stat-value">{squad.name}</span>
                                            <span className="match-stat-label">Squad</span>
                                        </div>
                                    </div>

                                    {/* Teams Section */}
                                    {teamCount > 0 && (
                                        <div className="match-profile-content">
                                            <div className="teams-section-header">
                                                <div className="teams-title">
                                                    <div className="teams-title-icon">⚔️</div>
                                                    Teams
                                                </div>
                                                <div className="teams-count-badge">
                                                    {teamCount} Team{teamCount !== 1 ? 's' : ''}
                                                </div>
                                            </div>

                                            <div className="teams-container">
                                                {match.teams.map((team, index) => (
                                                    <TeamCard 
                                                        key={team.id} 
                                                        team={team} 
                                                        index={index}
                                                        playerAverages={playerAverages}
                                                        PlayerCard={PlayerCard}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="match-actions-bar">
                                    <button 
                                        className="btn btn-ghost btn-lg"
                                        onClick={() => {
                                            if (match?.squad?.id) {
                                                window.location.href = `/squads/${match.squad.id}/matches/`;
                                            } else {
                                                window.location.href = '/squads/';
                                            }
                                        }}
                                    >
                                        ← Back to Matches
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </section>

            {/* Rating Modal */}
            {ratingModal && (
                <RatingModal
                    isOpen={ratingModal}
                    onClose={() => setRatingModal(false)}
                    players={matchPlayers}
                    currentUserId={currentUserId}
                    ratings={ratings}
                    onSubmit={handleRatingSubmit}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal}
                onClose={() => setDeleteModal(false)}
                onConfirm={async () => {
                    setIsDeleting(true);
                    try {
                        const response = await fetch('/api/matches/delete/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ match_id: match.id })
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            throw new Error(errorText || 'Failed to delete match');
                        }

                        // Redirect to squad's matches list
                        if (match?.squad?.id) {
                            window.location.href = `/squads/${match.squad.id}/matches/`;
                        } else {
                            window.location.href = '/squads/';
                        }
                    } catch (err) {
                        alert('Error deleting match: ' + err.message);
                        setIsDeleting(false);
                        setDeleteModal(false);
                    }
                }}
                title="Delete Match"
                message={`Are you sure you want to delete Match #${match?.id}? This action cannot be undone and will also delete all associated teams.`}
                confirmText={isDeleting ? "Deleting..." : "Delete"}
                cancelText="Cancel"
                type="danger"
            />
        </main>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MatchDetailApp />);
