// Calendar functionality
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

let currentMonth = 5; // June (0-indexed)
let currentYear = 2025;

// Sample events data
const events = {
    '2025-06-15': ['Annual Tech Symposium 2024'],
    '2025-06-20': ['Spring Cultural Festival']
};


const user = JSON.parse(localStorage.getItem('user') || '{}');
const currentUserId = user.id;

// function generateCalendar(month, year) {
//     const firstDay = new Date(year, month, 1).getDay();
//     const daysInMonth = new Date(year, month + 1, 0).getDate();
    
//     const calendarDays = document.getElementById('calendarDays');
//     const calendarTitle = document.getElementById('calendarTitle');
    
//     calendarTitle.textContent = `${months[month]} ${year}`;
//     calendarDays.innerHTML = '';

//     // Add empty cells for days before the first day of the month
//     for (let i = 0; i < firstDay; i++) {
//         const emptyDay = document.createElement('div');
//         emptyDay.className = 'calendar-day empty';
//         calendarDays.appendChild(emptyDay);
//     }

//     // Add days of the month
//     for (let day = 1; day <= daysInMonth; day++) {
//         const dayElement = document.createElement('div');
//         dayElement.className = 'calendar-day';
//         dayElement.textContent = day;

//         const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
//         if (events[dateKey]) {
//             dayElement.classList.add('has-event');
//         }

//         if (day === 15 && month === 5 && year === 2025) {
//             dayElement.classList.add('selected');
//         }

//         dayElement.addEventListener('click', () => {
//             document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
//             dayElement.classList.add('selected');
//         });

//         calendarDays.appendChild(dayElement);
//     }
// }
function getDatesBetween(start, end) {
    const dates = [];
    let current = new Date(start);
    end = new Date(end);
    while (current <= end) {
        dates.push(current.toISOString().slice(0, 10)); // 'YYYY-MM-DD'
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
function showCalendarPopup(dateStr, eventNames) {
    const popup = document.getElementById('calendar-popup');
    const popupDate = document.getElementById('calendar-popup-date');
    const popupList = document.getElementById('calendar-popup-list');
    popupDate.textContent = new Date(dateStr).toLocaleDateString();
    popupList.innerHTML = '';

    if (eventNames.length === 0) {
        popupList.innerHTML = '<li>No events on this day.</li>';
    } else {
        eventNames.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            popupList.appendChild(li);
        });
    }
    popup.style.display = 'flex';
}

// Close popup handler
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('calendar-popup');
    const closeBtn = document.getElementById('calendar-popup-close');
    if (closeBtn) {
        closeBtn.onclick = () => { popup.style.display = 'none'; };
    }
    // Optional: close popup when clicking outside content
    popup.addEventListener('click', (e) => {
        if (e.target === popup) popup.style.display = 'none';
    });
});
async function generateCalendar(month, year) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = document.getElementById('calendarDays');
    const calendarTitle = document.getElementById('calendarTitle');
    calendarTitle.textContent = `${months[month]} ${year}`;
    calendarDays.innerHTML = '';

    // Fetch registered events for the current user
    const res = await fetch(`http://localhost:3000/userRegisteredEvents?user_id=${currentUserId}`);
    const events = await res.json();

    const eventsByDate = {};
    events.forEach(event => {
        const start = new Date(event.start_datetime);
        const end = new Date(event.end_datetime || event.start_datetime);
        getDatesBetween(start, end).forEach(dateStr => {
            if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
            eventsByDate[dateStr].push(event.event_name);
        });
    });

    // Build a set of all dates that have a registered event
    const eventDates = new Set();
    events.forEach(event => {
        const start = new Date(event.start_datetime);
        const end = new Date(event.end_datetime || event.start_datetime);
        getDatesBetween(start, end).forEach(dateStr => eventDates.add(dateStr));
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (eventDates.has(dateKey)) {
            dayElement.classList.add('has-event');
        }

        // POPUP: Show events on this date
        dayElement.addEventListener('dblclick', () => {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
            dayElement.classList.add('selected');
            showCalendarPopup(dateKey, eventsByDate[dateKey] || []);
        });

        calendarDays.appendChild(dayElement);
    }
}

// Navigation buttons
document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
});

// Tab switching logic (add this if not present)
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        if (tabName === 'registered') loadRegisteredEvents();
        if (tabName === 'wishlist') loadWishlistEvents();
    });
});

// Event action buttons
document.querySelectorAll('.btn-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const action = e.target.closest('.btn-action').classList.contains('btn-view') ? 'view' :
                        e.target.closest('.btn-action').classList.contains('btn-cancel') ? 'cancel' :
                        e.target.closest('.btn-action').classList.contains('btn-register') ? 'register' : 'remove';
        
        alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action would be implemented here!`);
    });
});

// Initialize calendar
generateCalendar(currentMonth, currentYear);

// Fetch and render registered events
async function loadRegisteredEvents() {
    const container = document.querySelector('#registered-tab .events-list');
    container.innerHTML = 'Loading...';
    try {
        const res = await fetch(`http://localhost:3000/userRegisteredEvents?user_id=${currentUserId}`);
        const events = await res.json();
        if (!Array.isArray(events) || events.length === 0) {
            container.innerHTML = '<div>No registered events found.</div>';
            return;
        }
        container.innerHTML = events.map(event => {
            const start = new Date(event.start_datetime);
            const dateStr = `${start.toLocaleDateString()} at ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            return `
                <div class="event-item">
                    <div class="event-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="event-info">
                        <h3 class="event-title">${event.event_name}</h3>
                        <p class="event-details">
                            <i class="fas fa-calendar-alt detail-icon"></i>
                            ${dateStr}
                        </p>
                        <p class="event-details">
                            <i class="fas fa-map-marker-alt detail-icon"></i>
                            ${event.venue}
                        </p>
                    </div>
                    <div class="event-actions">
                        <button class="btn-action btn-view">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        <button class="btn-action btn-cancel" data-event-id="${event.event_id}">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<div>Failed to load events.</div>';
    }
}

// Load registered events when the Registered tab is shown
document.querySelector('[data-tab="registered"]').addEventListener('click', loadRegisteredEvents);

// Optionally, load on page load if Registered tab is default
if (document.querySelector('[data-tab="registered"]').classList.contains('active')) {
    loadRegisteredEvents();
}

// Delegate cancel button click in registered events
document.querySelector('#registered-tab .events-list').addEventListener('click', async function(e) {
    const btn = e.target.closest('.btn-cancel');
    if (btn) {
        const eventId = btn.getAttribute('data-event-id');
        if (confirm('Are you sure you want to cancel your registration for this event?')) {
            try {
                const res = await fetch('http://localhost:3000/unregisterEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    // Reload the registered events list
                    loadRegisteredEvents();
                } else {
                    alert(data.error || 'Failed to cancel registration');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }
});

//Fetch the user's registered event IDs before rendering the wishlist:
async function fetchUserRegisteredEvents(userId) {
    try {
        const res = await fetch(`http://localhost:3000/userRegisteredEvents?user_id=${userId}`);
        if (!res.ok) return [];
        const data = await res.json();
        // If your endpoint returns full event objects, map to IDs:
        return data.map(item => String(item.event_id));
    } catch (err) {
        return [];
    }
}
// Load wishlisted events
async function loadWishlistEvents() {
    const container = document.querySelector('#wishlist-tab .events-list');
    container.innerHTML = 'Loading...';
    try {
        // Fetch both wishlisted and registered event IDs
        const [wishlistRes, registeredIds] = await Promise.all([
            fetch(`http://localhost:3000/userWishlist?user_id=${currentUserId}`),
            fetchUserRegisteredEvents(currentUserId)
        ]);
        const events = await wishlistRes.json();
        if (!Array.isArray(events) || events.length === 0) {
            container.innerHTML = '<div>No wishlisted events found.</div>';
            return;
        }
        container.innerHTML = events.map(event => {
            const isRegistered = registeredIds.includes(String(event.event_id));
            const registerBtnClass = isRegistered ? 'btn-action btn-register registered' : 'btn-action btn-register';
            const registerBtnContent = isRegistered
                ? '<i class="fas fa-check register-icon"></i> Registered'
                : '<i class="fas fa-user-plus register-icon"></i> Register';
            const start = new Date(event.start_datetime);
            const dateStr = `${start.toLocaleDateString()} at ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            return `
                <div class="event-item">
                    <div class="event-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="event-info">
                        <h3 class="event-title">${event.event_name}</h3>
                        <p class="event-details">
                            <i class="fas fa-calendar-alt detail-icon"></i>
                            ${dateStr}
                        </p>
                        <p class="event-details">
                            <i class="fas fa-map-marker-alt detail-icon"></i>
                            ${event.venue}
                        </p>
                    </div>
                    <div class="event-actions">
                        <button class="${registerBtnClass}" data-event-id="${event.event_id}">
                            ${registerBtnContent}
                        </button>
                        <button class="btn-action btn-remove" data-event-id="${event.event_id}">
                            <i class="fas fa-heart-broken"></i>
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<div>Failed to load wishlist events.</div>';
    }
}

// Delegate register and remove button clicks in wishlist events
document.querySelector('#wishlist-tab .events-list').addEventListener('click', async function(e) {
    const registerBtn = e.target.closest('.btn-register');
    const removeBtn = e.target.closest('.btn-remove');
    const card = e.target.closest('.event-item');
    if (!card) return;
    const eventId = card.querySelector('[data-event-id]').getAttribute('data-event-id');

    // Register/Unregister event
    if (registerBtn) {
        const isRegistered = registerBtn.classList.contains('registered');
        if (!isRegistered) {
            // Register
            try {
                const res = await fetch('http://localhost:3000/registerEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    loadWishlistEvents();
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (err) {
                alert('Server error');
            }
        } else {
            // Unregister
            try {
                const res = await fetch('http://localhost:3000/unregisterEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    loadWishlistEvents();
                } else {
                    alert(data.error || 'Unregister failed');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }

    // Remove from wishlist
    if (removeBtn) {
        if (confirm('Remove this event from your wishlist?')) {
            try {
                const res = await fetch('http://localhost:3000/unwishlistEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: currentUserId, event_id: eventId })
                });
                const data = await res.json();
                if (res.ok) {
                    loadWishlistEvents();
                } else {
                    alert(data.error || 'Failed to remove from wishlist');
                }
            } catch (err) {
                alert('Server error');
            }
        }
    }
});