/**
 * SPORT-ZONE Squads Page
 * Displays user squads and other squads with team management
 */

const { useState, useEffect } = React;

// Initialize nav auth on page load
updateNavAuth();

// Squad emoji mapping for visual identity
const squadEmojis = ['🦁', '🐺', '🦅', '🐉', '🦈', '🐍', '🦊', '🦇', '🔥', '⚡', '💎', '🌟', '👑', '🎯', '🏆', '💀'];

const getSquadEmoji = (squadName, id) => {
    const hash = (squadName || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return squadEmojis[(hash + (id || 0)) % squadEmojis.length];
};

// Get player initials for avatar
const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Player Item Component
const PlayerItem = ({ player, index }) => (
    <div className="player-item" style={{ animationDelay: `${index * 0.05}s` }}>
        <div className="player-avatar">{getInitials(player.name)}</div>
        <span className="player-name">{player.name}</span>
        <div className="player-status"></div>
    </div>
);

// Squad Card Component
const SquadCard = ({ squad, isUserSquad, index, onDelete }) => {
    const emoji = getSquadEmoji(squad.name, squad.id);
    const playerCount = squad.players ? squad.players.length : 0;

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) onDelete(squad);
    };

    const handleMatchesClick = (e) => {
        e.stopPropagation();
        window.location.href = `/squads/${squad.id}/matches/`;
    };

    const handleDetailsClick = (e) => {
        e.stopPropagation();
        window.location.href = `/squads/${squad.id}/`;
    };

    return (
        <div 
            className={`squad-card ${isUserSquad ? 'user-squad' : ''}`} 
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="squad-header">
                <div className="squad-identity">
                    <div className="squad-avatar">{emoji}</div>
                    <div className="squad-info">
                        <div className="squad-info-top">
                            <span className="squad-id">Squad #{squad.id}</span>
                            {squad.is_public !== undefined && (
                                <span className={`squad-visibility ${squad.is_public ? 'public' : 'private'}`}>
                                    {squad.is_public ? '🌐 Public' : '🔒 Private'}
                                </span>
                            )}
                        </div>
                        <h3 className="squad-name">{squad.name}</h3>
                    </div>
                </div>
                <div className="squad-header-actions">
                    {isUserSquad && (
                        <button
                            type="button"
                            className="squad-delete-btn"
                            onClick={handleDeleteClick}
                            title="Delete squad"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="squad-players">
                <div className="players-label">
                    <span className="players-label-icon">👥</span>
                    <span>Roster ({playerCount} Players)</span>
                </div>
                
                {playerCount > 0 ? (
                    <div className="players-list">
                        {squad.players.map((player, idx) => (
                            <PlayerItem 
                                key={player.id} 
                                player={player} 
                                index={idx}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-players">
                        <div className="empty-players-icon">👤</div>
                        <p className="empty-players-text">No players yet</p>
                    </div>
                )}
            </div>

            <div className="squad-actions">
                <button 
                    className="btn btn-primary"
                    onClick={handleMatchesClick}
                >
                    Matches
                </button>
                <button 
                    className="btn btn-primary"
                    onClick={handleDetailsClick}
                >
                    Details
                </button>
            </div>

        </div>
    );
};

// Section Title Component
const SectionTitle = ({ icon, iconClass, title, count }) => (
    <div className="section-title-row">
        <h2>
            <div className={`section-icon ${iconClass}`}>{icon}</div>
            {title}
        </h2>
        <div className="section-line"></div>
        <div className="squad-count">{count} Squad{count !== 1 ? 's' : ''}</div>
    </div>
);

// Main App Component
const SquadsApp = () => {
    const [userSquads, setUserSquads] = useState([]);
    const [memberSquads, setMemberSquads] = useState([]);
    const [publicSquads, setPublicSquads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, squad: null });

    useEffect(() => {
        fetchSquads();
    }, []);

    const fetchSquads = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/squads/');
            if (!response.ok) throw new Error('Failed to fetch squads');
            const data = await response.json();
            
            // Handle the expected payload structure:
            // { "user_squads": [...], "member_squads": [...], "public_squads": [...] }
            setUserSquads(data.user_squads || []);
            setMemberSquads(data.member_squads || []);
            setPublicSquads(data.public_squads || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (squad) => {
        setDeleteModal({ isOpen: true, squad });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.squad) return;

        try {
            const response = await fetch('/api/squads/delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ squad_id: deleteModal.squad.id })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete squad');
            }

            // Remove squad from appropriate list(s)
            setUserSquads(prev => prev.filter(s => s.id !== deleteModal.squad.id));
            setMemberSquads(prev => prev.filter(s => s.id !== deleteModal.squad.id));
            setPublicSquads(prev => prev.filter(s => s.id !== deleteModal.squad.id));
            setDeleteModal({ isOpen: false, squad: null });
        } catch (err) {
            alert('Error deleting squad: ' + err.message);
            setDeleteModal({ isOpen: false, squad: null });
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, squad: null });
    };

    // Combine user squads and member squads into "My Squads"
    const mySquads = [...userSquads, ...memberSquads];
    // Always show both sections, even if empty

    return (
        <main className="squads-page">
            {/* Breadcrumb */}
            <section className="breadcrumb-section">
                <div className="container">
                    <div className="breadcrumb-container">
                        <div className="breadcrumb">
                            <span className="breadcrumb-item">SQUADS</span>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => window.location.href = '/squads/create/'}>
                            <span className="btn-icon">+</span>
                            Create Squad
                        </button>
                    </div>
                </div>
            </section>

            {/* Squads Section */}
            <section className="squads-section">
                <div className="container">
                    {loading ? (
                        <LoadingSpinner text="Loading Squads..." />
                    ) : error ? (
                        <ErrorState
                            title="Error Loading Squads"
                            message={error}
                            onRetry={fetchSquads}
                        />
                    ) : (
                        <>
                            {/* My Squads Section (User's squads + Member squads) */}
                            <SectionTitle 
                                icon="⚡" 
                                iconClass="user-icon"
                                title="MY SQUADS" 
                                count={mySquads.length}
                            />
                            {mySquads.length > 0 ? (
                                <div className="squads-grid">
                                    {mySquads.map((squad, index) => {
                                        // Check if user is admin (in userSquads) or just a member
                                        const isUserSquad = userSquads.some(us => us.id === squad.id);
                                        return (
                                            <SquadCard 
                                                key={squad.id} 
                                                squad={squad} 
                                                isUserSquad={isUserSquad}
                                                index={index}
                                                onDelete={isUserSquad ? handleDeleteClick : null}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-section">
                                    <p className="empty-section-text">You don't have any squads yet. Create one to get started!</p>
                                </div>
                            )}

                            {/* Public Squads Section */}
                            <SectionTitle 
                                icon="🌐" 
                                iconClass="other-icon"
                                title="PUBLIC SQUADS" 
                                count={publicSquads.length}
                            />
                            {publicSquads.length > 0 ? (
                                <div className="squads-grid">
                                    {publicSquads.map((squad, index) => (
                                        <SquadCard 
                                            key={squad.id} 
                                            squad={squad} 
                                            isUserSquad={false}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section">
                                    <p className="empty-section-text">No public squads available at the moment.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Squad"
                message={`Are you sure you want to delete "${deleteModal.squad?.name}"? This action cannot be undone and will also delete all associated matches.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </main>
    );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SquadsApp />);
