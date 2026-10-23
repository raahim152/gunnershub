const API_URL = '/api/predictions';

async function fetchPredictions() {
    try {
        const response = await fetch(API_URL);
        const predictions = await response.json();
        const list = document.getElementById('prediction-list');
        list.innerHTML = ''; 
        
        predictions.forEach(p => {
            const li = document.createElement('li');
            // Make it look a bit nicer
            li.innerHTML = `<strong>${p.prediction}</strong><span>Predicted by: ${p.username}</span>`;
            list.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching predictions:", error);
    }
}

async function addPrediction() {
    const username = document.getElementById('username').value;
    const prediction = document.getElementById('prediction').value;

    if (!username || !prediction) {
        alert("Please fill in both fields!");
        return;
    }

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, prediction })
        });
        
        document.getElementById('username').value = '';
        document.getElementById('prediction').value = '';
        fetchPredictions();
    } catch (error) {
        console.error("Error adding prediction:", error);
    }
}

document.addEventListener('DOMContentLoaded', fetchPredictions);