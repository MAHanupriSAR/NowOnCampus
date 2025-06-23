// View toggle functionality
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// Favorite toggle functionality
document.querySelectorAll('.btn-favorite').forEach(btn => {
    btn.addEventListener('click', function() {
        const icon = this.querySelector('.favorite-icon');
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            this.classList.add('favorited');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            this.classList.remove('favorited');
        }
    });
});

// Search functionality
document.querySelector('.search-input').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    document.querySelectorAll('.event-card').forEach(card => {
        const title = card.querySelector('.event-title').textContent.toLowerCase();
        const description = card.querySelector('.event-description').textContent.toLowerCase();
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', function (e) {
        // If clicked element is inside a button, don't navigate
        if (!e.target.closest('button')) {
            window.location.href = 'event_details.html';
        }
    });
});

// Fetch and render events from the database
async function loadEvents(filterStatus = '', searchTerm = '') {
    const grid = document.getElementById('events-grid');
    grid.innerHTML = 'Loading...';
    try {
        const res = await fetch('http://localhost:3000/events');
        let events = await res.json();
        if (!Array.isArray(events) || events.length === 0) {
            grid.innerHTML = '<div>No events found.</div>';
            return;
        }

        // Filter by status if filterStatus is set
        if (filterStatus) {
            events = events.filter(event => {
                let status = (event.event_status || '').toLowerCase();
                return status === filterStatus.toLowerCase();
            });
        }

        // Filter by search term if set
        if (searchTerm) {
            events = events.filter(event => {
                const title = (event.event_name || '').toLowerCase();
                const description = (event.description || '').toLowerCase();
                return title.includes(searchTerm) || description.includes(searchTerm);
            });
        }

        grid.innerHTML = events.map(event => {
            const start = new Date(event.start_datetime);
            const dateStr = `${start.toLocaleDateString()} at ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            const typeBadge = event.event_type ? `<span class="event-type ${event.event_type.toLowerCase()}">${event.event_type}</span>` : '';
            const statusBadge = event.event_status ? `<span class="event-status ${event.event_status.toLowerCase()}">${event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1)}</span>` : '';
            const dept = event.department || '-';
            return `
                <div class="event-card" data-event-id="${event.event_id}">
                    <div class="event-icon-wrapper">
                        <div class="event-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                    </div>
                    <div class="event-content">
                        <div class="event-badges">
                            ${typeBadge}
                            ${statusBadge}
                        </div>
                        <h3 class="event-title">${event.event_name}</h3>
                        <p class="event-description">${event.description}</p>
                        <div class="event-details">
                            <div class="event-detail">
                                <i class="fas fa-calendar-alt detail-icon"></i>
                                <span class="detail-text">${dateStr}</span>
                            </div>
                            <div class="event-detail">
                                <i class="fas fa-map-marker-alt detail-icon"></i>
                                <span class="detail-text">${event.venue}</span>
                            </div>
                            <div class="event-detail">
                                <i class="fas fa-users detail-icon"></i>
                                <span class="detail-text">${dept}</span>
                            </div>
                        </div>
                        <div class="event-actions">
                            <button class="btn-register">
                                <i class="fas fa-user-plus register-icon"></i>
                                Register
                            </button>
                            <button class="btn-favorite">
                                <i class="far fa-heart favorite-icon"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        grid.innerHTML = '<div>Failed to load events.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    let currentFilter = '';
    let currentSearch = '';

    const statusSelect = document.querySelector('.filter-select');
    const searchInput = document.querySelector('.search-input');

    function updateEvents() {
        loadEvents(currentFilter, currentSearch);
    }

    statusSelect.addEventListener('change', function() {
        currentFilter = this.value;
        updateEvents();
    });

    searchInput.addEventListener('input', function() {
        currentSearch = this.value.toLowerCase();
        updateEvents();
    });

    updateEvents();
});


// Helper: get current user ID (replace with your actual logic)
const user = JSON.parse(localStorage.getItem('user') || '{}');
const currentUserId = user.id;

// Delegate register and wishlist button click
document.getElementById('events-grid').addEventListener('click', async function(e) {
    // Register
    if (e.target.closest('.btn-register')) {
        const card = e.target.closest('.event-card');
        const eventId = card.getAttribute('data-event-id');
        try {
            const res = await fetch('http://localhost:3000/registerEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Registered successfully!');
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            alert('Server error');
        }
    }
    // Wishlist toggle
    if (e.target.closest('.btn-favorite')) {
        const btn = e.target.closest('.btn-favorite');
        const card = btn.closest('.event-card');
        const eventId = card.getAttribute('data-event-id');
        const isFavorited = btn.classList.contains('favorited');
        if (!isFavorited) {
            // Add to wishlist
            try {
                const res = await fetch('http://localhost:3000/wishlistEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    btn.classList.add('favorited');
                    btn.querySelector('.favorite-icon').classList.remove('far');
                    btn.querySelector('.favorite-icon').classList.add('fas');
                } else {
                    alert(data.error || 'Wishlist failed');
                }
            } catch (err) {
                alert('Server error');
            }
        } else {
            // Remove from wishlist
            try {
                const res = await fetch('http://localhost:3000/unwishlistEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    btn.classList.remove('favorited');
                    btn.querySelector('.favorite-icon').classList.remove('fas');
                    btn.querySelector('.favorite-icon').classList.add('far');
                } else {
                    alert(data.error || 'Remove from wishlist failed');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }
});

//for show already wishlisted events as red hearts on page load,
async function getUserWishlistIds(userId) {
    try {
        const res = await fetch(`http://localhost:3000/userWishlist?user_id=${userId}`);
        const wishlist = await res.json();
        // Return an array of event_id
        return Array.isArray(wishlist) ? wishlist.map(w => w.event_id) : [];
    } catch (err) {
        return [];
    }
}

