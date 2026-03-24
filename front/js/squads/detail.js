/**
 * SPORT-ZONE Squad Detail Page
 * Displays detailed information about a specific squad
 */

const { useState, useEffect } = React;

// Initialize nav auth on page load
updateNavAuth();

// Squad emoji mapping
const squadEmojis = ['🦁', '🐺', '🦅', '🐉', '🦈', '🐍', '🦊', '🦇', '🔥', '⚡', '💎', '🌟', '👑', '🎯', '🏆', '💀'];

const getSquadEmoji = (squadName, id) => {
    const hash = (squadName || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return squadEmojis[(hash + (id || 0)) % squadEmojis.length];
};

// Get player initials
const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Using getIdFromUrl from common.js

// Player Card Component
const PlayerCard = ({ player, index, isAdmin = false, avgRating = null }) => (
    <div className={`player-card ${isAdmin ? 'admin-card' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
        <div className={`player-avatar-medium ${isAdmin ? 'admin-avatar' : ''}`}>{getInitials(player.name)}</div>
        <div className="player-info">
            <div className="player-name">{player.name}</div>
            <div className="player-role">{isAdmin ? '👑 Admin' : 'Team Member'}</div>
        </div>
        {avgRating !== null && avgRating !== undefined ? (
            <div className="player-rating-badge">{avgRating.toFixed(1)}</div>
        ) : (
            <div className={`player-status-indicator ${isAdmin ? 'admin-indicator' : ''}`}></div>
        )}
    </div>
);

// Empty Players State
const EmptyPlayersState = ({ squadId }) => (
    <div className="empty-players-state">
        <div className="empty-players-icon">👥</div>
        <h3 className="empty-players-title">No Players Yet</h3>
        <p className="empty-players-text">
            This squad doesn't have any players yet.<br />
            Add players to your team!
        </p>
        <button 
            className="btn btn-primary"
            onClick={() => window.location.href = `/squads/${squadId}/update/`}
        >
            Add Players
        </button>
    </div>
);

// Main Squad Detail App
const SquadDetailApp = () => {
    const [squad, setSquad] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isNewSquad, setIsNewSquad] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [playerRatings, setPlayerRatings] = useState({});

    useEffect(() => {
        loadCurrentUser();
        loadSquadData();
    }, []);

    useEffect(() => {
        if (squad && squad.players) {
            loadPlayerRatings();
        }
    }, [squad]);

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

    const loadSquadData = async () => {
        try {
            setLoading(true);
            
            // First check if we have data from the create page
            const createdSquadData = sessionStorage.getItem('createdSquad');
            
            if (createdSquadData) {
                // Use the data from squad creation
                const squadData = JSON.parse(createdSquadData);
                setSquad(squadData);
                setIsNewSquad(true);
                // Clear the stored data
                sessionStorage.removeItem('createdSquad');
                setLoading(false);
                return;
            }

            // Otherwise, fetch from API
            const squadId = getIdFromUrl('squads');
            
            if (!squadId || squadId === 'new') {
                throw new Error('Squad not found');
            }

            const response = await fetch(`/api/squads/${squadId}/`);
            
            if (!response.ok) {
                throw new Error('Failed to load squad details');
            }

            const data = await response.json();
            setSquad(data);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadPlayerRatings = async () => {
        if (!squad || !squad.players || squad.players.length === 0 || !squad.id) return;
        
        try {
            const playerIds = squad.players.map(p => p.id).join(',');
            const response = await fetch(`/api/users/avg-ratings/?player_ids=${playerIds}&squad_id=${squad.id}`);
            
            if (response.ok) {
                const data = await response.json();
                setPlayerRatings(data);
            }
        } catch (err) {
            console.error('Error loading player ratings:', err);
        }
    };

    // Calculate stats
    const playerCount = squad?.players ? squad.players.length : 0;
    const adminCount = squad?.admins ? squad.admins.length : 0;
    const totalMembers = playerCount + adminCount;
    const emoji = squad ? getSquadEmoji(squad.name, squad.id) : '🛡️';
    
    // Check if current user is an admin
    const isCurrentUserAdmin = currentUserId && squad?.admins 
        ? squad.admins.some(admin => admin.id === currentUserId)
        : false;

    return (
        <main className="squad-detail-page">
            {/* Breadcrumb */}
            <section className="breadcrumb-section">
                <div className="container">
                    <div className="breadcrumb">
                        <a href="/squads/" className="breadcrumb-item">SQUADS</a>
                        <span className="breadcrumb-separator">→</span>
                        <span className="breadcrumb-item active">{squad?.name || 'Loading...'}</span>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="page-hero">
                <div className="container">
                    <div className="hero-content">
                        {isNewSquad && (
                            <div className="hero-badge success-badge">
                                <span className="hero-icon">✓</span>
                                Squad Created Successfully
                            </div>
                        )}
                        <h1>Squad <span className="glow">Profile</span></h1>
                    </div>
                </div>
            </section>

            {/* Squad Detail Section */}
            <section className="squad-detail-section">
                <div className="container">
                    <div className="detail-container">
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner">
                                    <div className="spinner-ring"></div>
                                    <div className="spinner-ring"></div>
                                    <div className="spinner-ring"></div>
                                </div>
                                <p className="loading-text">Loading Squad...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <div className="error-icon">⚠️</div>
                                <h3>Error Loading Squad</h3>
                                <p>{error}</p>
                                <button className="btn btn-primary" onClick={() => window.location.href = '/squads/'}>
                                    Back to Squads
                                </button>
                            </div>
                        ) : squad ? (
                            <>
                                {/* Squad Profile Card */}
                                <div className="squad-profile-card">
                                    {/* Header */}
                                    <div className="squad-profile-header">
                                        <div className="squad-avatar-large">{emoji}</div>
                                        <div className="squad-header-info">
                                            <div className="squad-info-top">
                                                {squad.id && (
                                                    <div className="squad-id-badge">Squad #{squad.id}</div>
                                                )}
                                                {squad.is_public !== undefined && (
                                                    <span className={`squad-visibility ${squad.is_public ? 'public' : 'private'}`}>
                                                        {squad.is_public ? '🌐 Public' : '🔒 Private'}
                                                    </span>
                                                )}
                                            </div>
                                            <h1 className="squad-profile-name">{squad.name}</h1>
                                            <div className="squad-created-date">
                                                <span>📅</span>
                                                <span>Created {isNewSquad ? 'Just Now' : 'Recently'}</span>
                                            </div>
                                        </div>
                                        {isCurrentUserAdmin && (
                                            <div className="squad-header-actions">
                                                <button 
                                                    className="btn btn-primary"
                                                    onClick={() => window.location.href = `/squads/${squad.id}/update/`}
                                                >
                                                    Edit Squad
                                                </button>
                                                <button 
                                                    className="btn btn-danger"
                                                    onClick={() => setDeleteModal(true)}
                                                >
                                                    ✕ Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Bar */}
                                    <div className="squad-stats-bar">
                                        <div className="squad-stat">
                                            <span className="squad-stat-icon">👑</span>
                                            <span className="squad-stat-value accent">{adminCount}</span>
                                            <span className="squad-stat-label">Admin{adminCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="squad-stat">
                                            <span className="squad-stat-icon">👥</span>
                                            <span className="squad-stat-value accent">{playerCount}</span>
                                            <span className="squad-stat-label">Player{playerCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="squad-stat">
                                            <span className="squad-stat-icon">⚔️</span>
                                            <span className="squad-stat-value accent">{squad.match_count || 0}</span>
                                            <span className="squad-stat-label">Match{(squad.match_count || 0) !== 1 ? 'es' : ''}</span>
                                        </div>
                                    </div>

                                    {/* Content - Admins */}
                                    {adminCount > 0 && (
                                        <div className="squad-profile-content">
                                            <div className="players-section-header">
                                                <div className="players-title">
                                                    <div className="players-title-icon">👑</div>
                                                    Squad Admins
                                                </div>
                                                <div className="players-count-badge admin-badge">
                                                    {adminCount} Admin{adminCount !== 1 ? 's' : ''}
                                                </div>
                                            </div>

                                            <div className="players-grid">
                                                {squad.admins.map((admin, index) => (
                                                    <PlayerCard
                                                        key={`admin-${admin.id}`}
                                                        player={admin}
                                                        index={index}
                                                        isAdmin={true}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Content - Players */}
                                    <div className="squad-profile-content">
                                        <div className="players-section-header">
                                            <div className="players-title">
                                                <div className="players-title-icon">👥</div>
                                                Team Players
                                            </div>
                                            <div className="players-count-badge">
                                                {playerCount} Player{playerCount !== 1 ? 's' : ''}
                                            </div>
                                        </div>

                                        {playerCount > 0 ? (
                                            <div className="players-list">
                                                {squad.players
                                                    .map((player) => {
                                                        const ratingData = playerRatings[player.id];
                                                        const avgRating = ratingData?.average_rating;
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
                                                    .map(({ player, avgRating }, index) => {
                                                        const finalRating = avgRating === -1 ? null : avgRating;
                                                        return (
                                                            <PlayerCard
                                                                key={`player-${player.id}`}
                                                                player={player}
                                                                index={index}
                                                                avgRating={finalRating}
                                                            />
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <EmptyPlayersState squadId={squad.id} />
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="squad-actions-bar">
                                    <button 
                                        className="btn btn-ghost btn-lg"
                                        onClick={() => window.location.href = '/squads/'}
                                    >
                                        ← Back to Squads
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </section>

            {/* Delete Confirmation Modal */}
            {squad && (
                <ConfirmationModal
                    isOpen={deleteModal}
                    onClose={() => setDeleteModal(false)}
                    onConfirm={async () => {
                        setIsDeleting(true);
                        try {
                            const response = await fetch('/api/squads/delete/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ squad_id: squad.id })
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(errorText || 'Failed to delete squad');
                            }

                            // Redirect to squads list
                            window.location.href = '/squads/';
                        } catch (err) {
                            alert('Error deleting squad: ' + err.message);
                            setIsDeleting(false);
                            setDeleteModal(false);
                        }
                    }}
                    title="Delete Squad"
                    message={`Are you sure you want to delete "${squad.name}"? This action cannot be undone and will also delete all associated matches.`}
                    confirmText={isDeleting ? "Deleting..." : "Delete"}
                    cancelText="Cancel"
                    type="danger"
                />
            )}
        </main>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SquadDetailApp />);
