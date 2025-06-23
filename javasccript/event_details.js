function getEventIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('event_id');
}

async function loadEventDetails() {
    const eventId = getEventIdFromUrl();
    if (!eventId) return;

    try {
        const res = await fetch(`http://localhost:3000/event/${eventId}`);
        if (!res.ok) {
            document.getElementById('event-title').textContent = 'Event not found';
            document.getElementById('event-description').innerHTML = '<p>Event not found.</p>';
            return;
        }
        const event = await res.json();
        const statusBadge = document.getElementById('event-status');
        if (statusBadge) {
            const status = (event.event_status || '').toLowerCase();
            statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusBadge.className = 'status-badge ' + status; // e.g., status-badge upcoming
        }

        // Fill all fields
        document.getElementById('event-title').textContent = event.event_name || '';
        document.getElementById('event-start').textContent = event.start_datetime
            ? new Date(event.start_datetime).toLocaleString()
            : '';
        document.getElementById('event-end').textContent = event.end_datetime
            ? new Date(event.end_datetime).toLocaleString()
            : '';
        document.getElementById('event-venue').textContent = event.venue || '';
        document.getElementById('event-organiser').textContent = event.organiser_name || '';
        document.getElementById('event-department').textContent = event.department || '';
        document.getElementById('event-registrations').textContent = event.registrations ?? '';
        document.getElementById('event-capacity').textContent = event.capacity ? `${event.capacity} attendees` : '';
        document.getElementById('event-type').textContent = event.event_type || '';

        // Description and agenda
        let descHtml = '';
        if (event.description) {
            descHtml += `<p>${event.description}</p>`;
        }
        if (event.agenda) {
            descHtml += `<h3>Agenda</h3><p>${event.agenda}</p>`;
        }
        document.getElementById('event-description').innerHTML = descHtml || '<p>No details available.</p>';
        updateActionButtons(eventId);
    } catch (err) {
        document.getElementById('event-title').textContent = 'Error loading event';
        document.getElementById('event-description').innerHTML = '<p>Failed to load event details.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadEventDetails);

// Helper: get current user ID (replace with your actual logic)
const user = JSON.parse(localStorage.getItem('user') || '{}');
const currentUserId = user.id;

// Fetch registration and wishlist status for this event
async function fetchUserEventStatus(eventId) {
    const [regRes, wishRes] = await Promise.all([
        fetch(`http://localhost:3000/userRegisteredEvents?user_id=${currentUserId}`),
        fetch(`http://localhost:3000/userWishlist?user_id=${currentUserId}`)
    ]);
    const registeredEvents = await regRes.json();
    const wishlistedEvents = await wishRes.json();
    return {
        isRegistered: registeredEvents.some(ev => String(ev.event_id) === String(eventId)),
        isWishlisted: wishlistedEvents.some(ev => String(ev.event_id) === String(eventId))
    };
}

// Update button UI and handlers
async function updateActionButtons(eventId) {
    const registerBtn = document.getElementById('register-btn');
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (!registerBtn || !wishlistBtn) return;

    const { isRegistered, isWishlisted } = await fetchUserEventStatus(eventId);

    // Register button UI
    if (isRegistered) {
        registerBtn.classList.add('registered');
        registerBtn.innerHTML = '<i class="fas fa-check btn-icon"></i> Registered';
    } else {
        registerBtn.classList.remove('registered');
        registerBtn.innerHTML = '<i class="fas fa-user-plus btn-icon"></i> Register Now';
    }

    // Wishlist button UI
    const icon = wishlistBtn.querySelector('i');
    if (isWishlisted) {
        wishlistBtn.classList.add('wishlisted');
        icon.classList.remove('far');
        icon.classList.add('fas');
    } else {
        wishlistBtn.classList.remove('wishlisted');
        icon.classList.remove('fas');
        icon.classList.add('far');
    }

    // Register button click
    registerBtn.onclick = async function() {
        if (!isRegistered) {
            // Register
            const res = await fetch('http://localhost:3000/registerEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Registration failed');
        } else {
            // Unregister
            const res = await fetch('http://localhost:3000/unregisterEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Unregister failed');
        }
    };

    // Wishlist button click
    wishlistBtn.onclick = async function() {
        if (!isWishlisted) {
            // Add to wishlist
            const res = await fetch('http://localhost:3000/wishlistEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Failed to add to wishlist');
        } else {
            // Remove from wishlist
            const res = await fetch('http://localhost:3000/unwishlistEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
            });
            if (res.ok) updateActionButtons(eventId);
            else alert('Failed to remove from wishlist');
        }
    };
}