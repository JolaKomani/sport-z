/**
 * SPORT-ZONE Authentication Functions
 * Plain JavaScript - no Babel required
 */

// Auth nav update - checks if user is logged in and updates nav accordingly
async function updateNavAuth() {
    const navActions = document.getElementById('nav-actions');
    if (!navActions) return;

    try {
        const response = await fetch('/api/users/me/');
        if (response.ok) {
            const user = await response.json();
            navActions.innerHTML = `
                <a href="/users/profile/" class="user-name">${user.first_name} ${user.last_name}</a>
                <a href="#" class="btn btn-ghost" onclick="logout()">Log Out</a>
            `;
            
            // Ensure the profile link works by adding explicit click handler
            // This ensures navigation works even if something is preventing default behavior
            const profileLink = navActions.querySelector('.user-name');
            if (profileLink) {
                profileLink.addEventListener('click', function(e) {
                    // Allow normal navigation, but ensure it works
                    window.location.href = '/users/profile/';
                }, false);
            }
        } else {
            navActions.innerHTML = `
                <a href="/users/login/" class="btn btn-ghost">Log In</a>
                <a href="/users/create/" class="btn btn-primary">Join Now</a>
            `;
        }
    } catch (e) {
        navActions.innerHTML = `
            <a href="/users/login/" class="btn btn-ghost">Log In</a>
            <a href="/users/create/" class="btn btn-primary">Join Now</a>
        `;
    }
}

// Logout function
async function logout() {
    await fetch('/api/users/logout/', { method: 'POST' });
    window.location.href = '/';
}
