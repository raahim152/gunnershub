const API = '/api';

// --- Tab switching ---
function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`${name}-tab`).classList.add('active');
    document.querySelector(`.tab-btn[onclick="showTab('${name}')"]`).classList.add('active');
    if (name === 'leaderboard') loadLeaderboard();
}

// --- Load fixtures ---
async function loadFixtures() {
    try {
        const res = await fetch(`${API}/fixtures`);
        const fixtures = await res.json();
        const container = document.getElementById('fixtures-list');

        if (fixtures.length === 0) {
            container.innerHTML = '<p class="muted">No fixtures yet.</p>';
            return;
        }

        container.innerHTML = fixtures.map(f => {
            const isPast = f.home_score !== null;
            const dateStr = new Date(f.match_date).toLocaleString();
            const result = isPast
                ? `<span class="result-badge">FT: ${f.home_score} - ${f.away_score}</span>`
                : `<span class="upcoming-badge">Upcoming</span>`;

            const predictionForm = isPast ? '' : `
    <form class="prediction-form" onsubmit="event.preventDefault(); submitPrediction(${f.id}, this);">
        <input type="text" name="username" placeholder="Your name" required>
        <div class="score-inputs">
            <input type="number" name="home_score" min="0" placeholder="ARS" required>
            <span>-</span>
            <input type="number" name="away_score" min="0" placeholder="OPP" required>
        </div>
        <button type="submit">Predict</button>
    </form>
    <div class="admin-tools">
    <button class="btn-admin" onclick="simulateResult(${f.id}, this)">🎲 Simulate Result (Admin)</button>
    </div>
`;

            return `
                <div class="card fixture-card">
                    <div class="fixture-header">
                        <div>
                            <h3>Arsenal vs ${f.opponent}</h3>
                            <p class="muted">${f.competition} · ${f.venue} · ${dateStr}</p>
                        </div>
                        ${result}
                    </div>
                    ${predictionForm}
                    <p class="muted small">${f.prediction_count} prediction(s) submitted</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading fixtures:', err);
    }
}

// --- Submit a prediction ---
async function submitPrediction(fixtureId, form) {
    const data = {
        fixture_id: fixtureId,
        username: form.username.value.trim(),
        home_score: parseInt(form.home_score.value, 10),
        away_score: parseInt(form.away_score.value, 10)
    };

    if (!data.username || isNaN(data.home_score) || isNaN(data.away_score)) {
        alert('Please fill all fields with valid numbers.');
        return;
    }

    try {
        const res = await fetch(`${API}/predictions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Server rejected');
        form.reset();
        loadFixtures(); // refresh counts
    } catch (err) {
        alert('Failed to submit prediction.');
        console.error(err);
    }
}

// --- Admin: simulate a match result with inline feedback ---
async function simulateResult(fixtureId, buttonEl) {
    if (!confirm('Simulate a result for this fixture? This will finalize the match and lock in predictions.')) {
        return;
    }

    // Pick a random result — weighted so 0-0, 1-0, 2-1 etc are common
    const home_score = Math.floor(Math.random() * 5);
    const away_score = Math.floor(Math.random() * 5);

    // Disable the button to prevent double-clicks
    buttonEl.disabled = true;
    buttonEl.textContent = 'Simulating...';

    try {
        const res = await fetch(`${API}/fixtures/${fixtureId}/finalize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ home_score, away_score })
        });

        if (!res.ok) {
            const err = await res.json();
            buttonEl.disabled = false;
            buttonEl.textContent = '🎲 Simulate Result (Admin)';
            showInlineNotice(buttonEl, `❌ ${err.error || 'Failed'}`, 'error');
            return;
        }

        // Find the fixture card and show inline result banner
        const card = buttonEl.closest('.fixture-card');
        const banner = document.createElement('div');
        banner.className = 'result-banner';
        banner.innerHTML = `🎉 Full Time: <strong>Arsenal ${home_score} - ${away_score}</strong>`;
        card.prepend(banner);

        // Fade out the banner and refresh the list after a moment
        setTimeout(() => {
            banner.classList.add('fade-out');
        }, 2200);
        setTimeout(() => {
            loadFixtures();
        }, 2800);
    } catch (err) {
        console.error(err);
        buttonEl.disabled = false;
        buttonEl.textContent = '🎲 Simulate Result (Admin)';
    }
}

// Small helper — appends a transient error/success message to a card
function showInlineNotice(el, message, type) {
    const card = el.closest('.fixture-card');
    const notice = document.createElement('div');
    notice.className = `inline-notice ${type}`;
    notice.textContent = message;
    card.prepend(notice);
    setTimeout(() => notice.remove(), 3000);
}

// --- Admin: reset all predictions + final scores ---
async function resetDemo() {
    if (!confirm('Reset all predictions and clear final results? This cannot be undone.')) {
        return;
    }
    try {
        const res = await fetch(`${API}/admin/reset`, { method: 'POST' });
        if (!res.ok) throw new Error('Reset failed');
        alert('✅ Demo reset. Fixtures are back to their original state.');
        loadFixtures();
        loadLeaderboard();
    } catch (err) {
        console.error(err);
        alert('Reset failed.');
    }
}

// --- Load leaderboard ---
async function loadLeaderboard() {
    try {
        const res = await fetch(`${API}/leaderboard`);
        const rows = await res.json();
        const tbody = document.querySelector('#leaderboard-table tbody');

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="muted">No completed matches yet.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map((r, i) => `
            <tr class="${i === 0 ? 'leader-row' : ''}">
                <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                <td>${r.username}</td>
                <td>${r.predictions_made}</td>
                <td><strong>${r.total_points}</strong></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Error loading leaderboard:', err);
    }
}


// --- Init ---
document.addEventListener('DOMContentLoaded', loadFixtures);