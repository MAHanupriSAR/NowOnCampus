// Register button functionality
document.querySelector('.btn-primary').addEventListener('click', function() {
    alert('Registration functionality would be implemented here!');
});

// Wishlist button functionality
document.querySelectorAll('.btn-secondary')[0].addEventListener('click', function() {
    const icon = this.querySelector('i');
    if (icon.classList.contains('fas')) {
        icon.classList.remove('fas');
        icon.classList.add('far');
        this.classList.add('wishlisted');
    } else {
        icon.classList.remove('far');
        icon.classList.add('fas');
        this.classList.remove('wishlisted');
    }
});

// // Calendar button functionality
// document.querySelectorAll('.btn-secondary')[1].addEventListener('click', function() {
//     alert('Add to calendar functionality would be implemented here!');
// });

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

        // Description and agenda
        let descHtml = '';
        if (event.description) {
            descHtml += `<p>${event.description}</p>`;
        }
        if (event.agenda) {
            descHtml += `<h3>Agenda</h3><p>${event.agenda}</p>`;
        }
        document.getElementById('event-description').innerHTML = descHtml || '<p>No details available.</p>';
    } catch (err) {
        document.getElementById('event-title').textContent = 'Error loading event';
        document.getElementById('event-description').innerHTML = '<p>Failed to load event details.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadEventDetails);