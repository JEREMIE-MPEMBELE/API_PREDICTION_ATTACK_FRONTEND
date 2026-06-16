// ============================================
// Configuration
// ============================================

const API_URL = 'https://api-prediction-attack-backend.onrender.com/predict';

const form = document.getElementById('predictForm');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');
const errorBox = document.getElementById('errorBox');

// ============================================
// Validation des champs
// ============================================

function validateField(value, fieldName, min, max) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        return { valid: false, message: `${fieldName} doit être un nombre.` };
    }
    if (num < min) {
        return { valid: false, message: `${fieldName} doit être ≥ ${min}.` };
    }
    if (num > max) {
        return { valid: false, message: `${fieldName} doit être ≤ ${max}.` };
    }
    return { valid: true, value: num };
}

// ============================================
// Soumission du formulaire
// ============================================

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // --- 1. Récupération des valeurs ---
    const raw_network = document.getElementById('network_size').value;
    const raw_login = document.getElementById('login_attempt').value;
    const raw_session = document.getElementById('session').value;
    const raw_ip = document.getElementById('ip_reputation').value;
    const raw_failed = document.getElementById('failed_login').value;

    // --- 2. Validation ---
    const validations = [
        validateField(raw_network, 'Taille du réseau', 0, 100000),
        validateField(raw_login, 'Tentatives de connexion', 0, 10000),
        validateField(raw_session, 'Durée session', 0, 100000),
        validateField(raw_ip, 'Réputation IP', 0, 1),
        validateField(raw_failed, 'Échecs de connexion', 0, 1000)
    ];

    for (const v of validations) {
        if (!v.valid) {
            showError(v.message);
            return;
        }
    }

    const network_size = validations[0].value;
    const login_attempt = validations[1].value;
    const session = validations[2].value;
    const ip_reputation = validations[3].value;
    const failed_login = validations[4].value;

    // --- 3. Construction du payload (conforme au schéma Pydantic) ---
    const payload = {
        network_packet_size: network_size,
        login_attempts: login_attempt,
        session_duration: session,
        ip_reputation_score: ip_reputation,
        failed_logins: failed_login
    };

    hideResults();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // --- 4. Gestion des erreurs HTTP ---
        if (!response.ok) {
            let errorMessage = `Erreur ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = typeof errorData.detail === 'string' 
                        ? errorData.detail 
                        : JSON.stringify(errorData.detail);
                }
            } catch (_) {
                // Si le corps n'est pas JSON, on garde le message par défaut
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        displayResult(data);

    } catch (error) {
        showError(error.message || 'Erreur de connexion au serveur.');
        console.error('Erreur:', error);
    }
});

// ============================================
// Fonctions d'affichage
// ============================================

function displayResult(data) {
    const classe = data.classe;
    const score = data.score !== undefined ? (data.score * 100).toFixed(1) : '—';

    let classeText = '';
    let classeClass = '';

    if (classe === 1) {
        classeText = '🚨 Attaque détectée';
        classeClass = 'attack';
    } else if (classe === 0) {
        classeText = '✅ Sécurisé';
        classeClass = 'safe';
    } else {
        classeText = `Classe ${classe}`;
        classeClass = '';
    }

    resultContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
            <span style="font-size:20px; font-weight:600; color:#fff;" class="${classeClass}">
                ${classeText}
            </span>
            <span style="background:rgba(255,255,255,0.06); padding:4px 14px; border-radius:30px; font-size:14px; color:#8892b0;">
                Score : ${score}%
            </span>
        </div>
    `;

    resultBox.classList.add('show');
}

function showError(message) {
    errorBox.textContent = '❌ ' + message;
    errorBox.classList.add('show');
}

function hideResults() {
    resultBox.classList.remove('show');
    errorBox.classList.remove('show');
    errorBox.textContent = '';
}

// ============================================
// Gestion clavier (Entrée)
// ============================================

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        form.dispatchEvent(new Event('submit'));
    }
});

console.log('🛡️ CyberPred - Frontend chargé avec succès !');
console.log(`📡 API cible : ${API_URL}`);