import { ref, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { db } from './firebase-config.js';

// Mapeo de IDs de equipos a nombres
const teamNames = {
    // LA LIGA
    "1": "Barcelona",
    "2": "Madrid",
    "3": "Valencia",
    "4": "Atlético de Madrid",
    "5": "Athletic de Bilbao",
    "6": "Villareal",
    "7": "Getafe",
    "8": "Betis",
    "9": "Sevilla",
    "10": "Celta",
    "11": "Rayo vallecano",
    "12": "Mallorca",
    "13": "Las Palmas",
    "14": "Osasuna",
    "15": "Real Sociedad",
    "16": "Gerona",
    "17": "Espanyol",
    "18": "Alavés",
    "19": "Leganés",
    "20": "Valladolid",

    // PREMIER LEAGUE
    "21": "Manchester United FC",
    "22": "Fulham FC",
    "23": "Ipswich Town FC",
    "24": "Liverpool FC",
    "25": "Arsenal FC",
    "26": "Wolverhampton Wanderers FC",
    "27": "Everton FC",
    "28": "Brighton & Hove Albion FC",
    "29": "Newcastle United FC",
    "30": "Southampton FC",
    "31": "Nottingham Forest FC",
    "32": "AFC Bournemouth",
    "33": "West Ham United FC",
    "34": "Aston Villa FC",
    "35": "Brentford FC",
    "36": "Crystal Palace FC",
    "37": "Chelsea FC",
    "38": "Manchester City FC",
    "39": "Leicester City FC",
    "40": "Tottenham Hotspur FC",

    // SERIE A
    "41": "Genoa CFC",
    "42": "FC Internazionale Milano",
    "43": "Parma Calcio 1913",
    "44": "ACF Fiorentina",
    "45": "Empoli FC",
    "46": "AC Monza",
    "47": "AC Milan",
    "48": "Torino FC",
    "49": "Bologna FC 1909",
    "50": "Udinese Calcio",
    "51": "Hellas Verona FC",
    "52": "SSC Napoli",
    "53": "Cagliari Calcio",
    "54": "AS Roma",
    "55": "SS Lazio",
    "56": "Venezia FC",
    "57": "US Lecce",
    "58": "Atalanta BC",
    "59": "Juventus FC",
    "60": "Como 1907"
};

function getTeamName(teamId) {
    return teamNames[String(teamId)] || teamId;
}

let matchesById = {};
let allMatches = [];

function getSelectedLeagues() {
    const select = document.getElementById('league-filter');
    // Si está seleccionada "all", mostrar todas las ligas
    const selected = Array.from(select.selectedOptions).map(opt => opt.value);
    if (selected.includes("all")) return [];
    return selected;
}

function populateTeamFilter(matches) {
    const teamFilter = document.getElementById('team-filter');
    if (!teamFilter) return;
    const teams = new Set();
    matches.forEach(match => {
        teams.add(getTeamName(match.team1));
        teams.add(getTeamName(match.team2));
    });
    teamFilter.innerHTML = '<option value="all">Todos los Equipos</option>';
    Array.from(teams).sort().forEach(team => {
        teamFilter.innerHTML += `<option value="${team}">${team}</option>`;
    });
}

function populateRoundFilter(matches) {
    const roundFilter = document.getElementById('round-filter');
    if (!roundFilter) return;
    const rounds = new Set();
    matches.forEach(match => {
        if (match.round) rounds.add(match.round);
    });
    roundFilter.innerHTML = '<option value="all">Todas las Jornadas</option>';
    Array.from(rounds).sort().forEach(round => {
        roundFilter.innerHTML += `<option value="${round}">${round}</option>`;
    });
}

function renderMatches(matches) {
    const tableBody = document.querySelector('#matches-table tbody');
    let html = '';
    let matchCount = 0;
    matchesById = {};

    matches.forEach(match => {
        const matchId = match.id;
        matchesById[matchId] = match;
        const matchDate = match.date ? new Date(match.date).toLocaleDateString() : 'N/A';
        const team1Name = getTeamName(match.team1);
        const team2Name = getTeamName(match.team2);
        html += `
            <tr data-match-id="${matchId}" class="match-row">
                <td>${match.liga}</td>
                <td class="text-right">
                    <div class="d-flex align-items-center justify-content-end">
                        <span class="mr-2">${team1Name}</span>
                        <img src="./escudos/${match.team1}.png" alt="${team1Name}" class="team-logo-small" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                    </div>
                </td>
                <td class="text-center">
                    <strong>${match.score && match.score.ft ? match.score.ft[0] + ' - ' + match.score.ft[1] : 'N/A'}</strong>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="./escudos/${match.team2}.png" alt="${team2Name}" class="team-logo-small" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                        <span class="ml-2">${team2Name}</span>
                    </div>
                </td>
                <td>${matchDate}</td>
                <td>
                    <button class="btn btn-sm btn-success view-details" data-match-id="${matchId}" style="background-color: #baff00; border-color: #baff00; color: #222222;">Ver detalles</button>
                </td>
            </tr>
        `;
        matchCount++;
    });

    if (matchCount === 0) {
        html = '<tr><td colspan="6" class="text-center">No hay partidos disponibles para los filtros seleccionados.</td></tr>';
    }

    tableBody.innerHTML = html;

    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const matchId = this.getAttribute('data-match-id');
            showMatchDetails(matchId);
        });
    });

    document.querySelectorAll('.match-row').forEach(row => {
        row.addEventListener('click', function() {
            const matchId = this.getAttribute('data-match-id');
            showMatchDetails(matchId);
        });
    });
}

async function loadMatches() {
    const matchesRef = ref(db, 'ligas');
    const tableBody = document.querySelector('#matches-table tbody');
    const selectedLeagues = getSelectedLeagues();
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

    try {
        const snapshot = await get(matchesRef);
        allMatches = [];
        if (snapshot.exists()) {
            snapshot.forEach(ligaSnap => {
                const liga = ligaSnap.val();
                // Si no hay filtro o la liga está seleccionada
                if (liga.matches && (selectedLeagues.length === 0 || selectedLeagues.includes(liga.name))) {
                    liga.matches.forEach((match, index) => {
                        allMatches.push({
                            ...match,
                            liga: liga.name,
                            id: `${liga.name}-${index}`
                        });
                    });
                }
            });
        }
        populateTeamFilter(allMatches);
        populateRoundFilter(allMatches);
        filterAndRender();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error: ${error.message}</td></tr>`;
        console.error('Error al cargar los partidos:', error);
    }
}

function filterAndRender() {
    const teamFilterValue = document.getElementById('team-filter')?.value || 'all';
    const roundFilterValue = document.getElementById('round-filter')?.value || 'all';

    let filteredMatches = allMatches;
    if (teamFilterValue !== 'all') {
        filteredMatches = filteredMatches.filter(match =>
            getTeamName(match.team1) === teamFilterValue || getTeamName(match.team2) === teamFilterValue
        );
    }
    if (roundFilterValue !== 'all') {
        filteredMatches = filteredMatches.filter(match =>
            match.round === roundFilterValue
        );
    }
    renderMatches(filteredMatches);
}

function showMatchDetails(matchId) {
    const match = matchesById[matchId];
    const detailsContainer = document.getElementById('match-details');

    if (!match) {
        detailsContainer.innerHTML = '<div class="alert alert-danger">No se encontró información del partido.</div>';
        detailsContainer.style.display = 'block';
        return;
    }

    const team1Name = getTeamName(match.team1);
    const team2Name = getTeamName(match.team2);

    const homeGoals = match.score && match.score.ft ? match.score.ft[0] : 0;
    const awayGoals = match.score && match.score.ft ? match.score.ft[1] : 0;
    const homeHalfGoals = match.score && match.score.ht ? match.score.ht[0] : 0;
    const awayHalfGoals = match.score && match.score.ht ? match.score.ht[1] : 0;
    const secondHalfHomeGoals = homeGoals - homeHalfGoals;
    const secondHalfAwayGoals = awayGoals - awayHalfGoals;

    detailsContainer.innerHTML = `
        <div class="match-card">
            <h3 class="text-center mb-4">${match.liga}</h3>
            <div class="team-vs">
                <div class="team">
                    <h3>${team1Name}</h3>
                    <img src="./escudos/${match.team1}.png" alt="Escudo ${team1Name}" class="team-logo" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                </div>
                <div class="vs">
                    <div class="score-prediction">${homeGoals} - ${awayGoals}</div>
                    <p class="text-muted">Resultado Final</p>
                </div>
                <div class="team">
                    <h3>${team2Name}</h3>
                    <img src="./escudos/${match.team2}.png" alt="Escudo ${team2Name}" class="team-logo" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-md-6">
                    <h4 class="text-center">Primer Tiempo</h4>
                    <div class="text-center mb-3">
                        <strong>${homeHalfGoals} - ${awayHalfGoals}</strong>
                    </div>
                </div>
                <div class="col-md-6">
                    <h4 class="text-center">Segundo Tiempo</h4>
                    <div class="text-center mb-3">
                        <strong>${secondHalfHomeGoals} - ${secondHalfAwayGoals}</strong>
                    </div>
                </div>
            </div>
            <div class="charts-container mt-4">
                <div class="chart-wrapper">
                    <div class="chart-title">Distribución de Goles</div>
                    <div class="chart-container">
                        <canvas id="goalsChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    detailsContainer.style.display = 'block';
    createGoalsChart(match);
    detailsContainer.scrollIntoView({ behavior: 'smooth' });
}

function createGoalsChart(match) {
    const ctx = document.getElementById('goalsChart').getContext('2d');
    const homeGoals = match.score && match.score.ft ? match.score.ft[0] : 0;
    const awayGoals = match.score && match.score.ft ? match.score.ft[1] : 0;
    const homeHalfGoals = match.score && match.score.ht ? match.score.ht[0] : 0;
    const awayHalfGoals = match.score && match.score.ht ? match.score.ht[1] : 0;
    const secondHalfHomeGoals = homeGoals - homeHalfGoals;
    const secondHalfAwayGoals = awayGoals - awayHalfGoals;
    const team1Name = getTeamName(match.team1);
    const team2Name = getTeamName(match.team2);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Primer Tiempo', 'Segundo Tiempo', 'Total'],
            datasets: [
                {
                    label: team1Name,
                    data: [homeHalfGoals, secondHalfHomeGoals, homeGoals],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                },
                {
                    label: team2Name,
                    data: [awayHalfGoals, secondHalfAwayGoals, awayGoals],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Goles'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Goles por Tiempo'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            return `${label}: ${context.parsed.y} goles`;
                        }
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Crea los filtros de equipo y jornada dinámicamente si no existen
    if (!document.getElementById('team-filter')) {
        const col = document.createElement('div');
        col.className = 'col-md-3';
        col.innerHTML = `
            <div class="form-group">
                <label for="team-filter">Filtrar por Equipo:</label>
                <select id="team-filter" class="form-control">
                    <option value="all">Todos los Equipos</option>
                </select>
            </div>
        `;
        document.querySelector('.filter-container .row').appendChild(col);
    }
    if (!document.getElementById('round-filter')) {
        const col = document.createElement('div');
        col.className = 'col-md-3';
        col.innerHTML = `
            <div class="form-group">
                <label for="round-filter">Filtrar por Jornada:</label>
                <select id="round-filter" class="form-control">
                    <option value="all">Todas las Jornadas</option>
                </select>
            </div>
        `;
        document.querySelector('.filter-container .row').appendChild(col);
    }

    loadMatches();

    document.getElementById('league-filter')?.addEventListener('change', loadMatches);
    document.getElementById('team-filter')?.addEventListener('change', filterAndRender);
    document.getElementById('round-filter')?.addEventListener('change', filterAndRender);
});

/*
// Por esto:
import { ref, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { db, app } from './firebase-config.js';

// Mapeo de IDs de equipos a nombres
const teamNames = {
    // LA LIGA
    "1": "Barcelona",
    "2": "Madrid",
    "3": "Valencia",
    "4": "Atlético de Madrid",
    "5": "Athletic de Bilbao",
    "6": "Villareal",
    "7": "Getafe",
    "8": "Betis",
    "9": "Sevilla",
    "10": "Celta",
    "11": "Rayo vallecano",
    "12": "Mallorca",
    "13": "Las Palmas",
    "14": "Osasuna",
    "15": "Real Sociedad",
    "16": "Gerona",
    "17": "Espanyol",
    "18": "Alavés",
    "19": "Leganés",
    "20": "Valladolid",
    
    // PREMIER LEAGUE
    "21": "Manchester United FC",
    "22": "Fulham FC",
    "23": "Ipswich Town FC",
    "24": "Liverpool FC",
    "25": "Arsenal FC",
    "26": "Wolverhampton Wanderers FC",
    "27": "Everton FC",
    "28": "Brighton & Hove Albion FC",
    "29": "Newcastle United FC",
    "30": "Southampton FC",
    "31": "Nottingham Forest FC",
    "32": "AFC Bournemouth",
    "33": "West Ham United FC",
    "34": "Aston Villa FC",
    "35": "Brentford FC",
    "36": "Crystal Palace FC",
    "37": "Chelsea FC",
    "38": "Manchester City FC",
    "39": "Leicester City FC",
    "40": "Tottenham Hotspur FC",
    
    // SERIE A
    "41": "Genoa CFC",
    "42": "FC Internazionale Milano",
    "43": "Parma Calcio 1913",
    "44": "ACF Fiorentina",
    "45": "Empoli FC",
    "46": "AC Monza",
    "47": "AC Milan",
    "48": "Torino FC",
    "49": "Bologna FC 1909",
    "50": "Udinese Calcio",
    "51": "Hellas Verona FC",
    "52": "SSC Napoli",
    "53": "Cagliari Calcio",
    "54": "AS Roma",
    "55": "SS Lazio",
    "56": "Venezia FC",
    "57": "US Lecce",
    "58": "Atalanta BC",
    "59": "Juventus FC",
    "60": "Como 1907"
};

// Función para obtener el nombre del equipo a partir de su ID
function getTeamName(teamId) {
    return teamNames[String(teamId)] || teamId;
}


// Objeto para almacenar los partidos por ID
let matchesById = {};

// Función para cargar los partidos desde Firebase
async function loadMatches() {
    // Eliminar esta línea:
    // const db = getDatabase(app);
    
    const matchesRef = ref(db, 'ligas');
    const tableBody = document.querySelector('#matches-table tbody');
    const leagueFilter = document.getElementById('league-filter').value;
    
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

    try {
        const snapshot = await get(matchesRef);
        let html = '';
        let matchCount = 0;
        
        if (snapshot.exists()) {
            // Reiniciar el objeto de partidos
            matchesById = {};
            
            snapshot.forEach(ligaSnap => {
                const liga = ligaSnap.val();
                
                if (liga.matches && (leagueFilter === 'all' || liga.name === leagueFilter)) {
                    liga.matches.forEach((match, index) => {
                        // Generar un ID único para el partido
                        const matchId = `${liga.name}-${index}`;
                        
                        // Almacenar el partido en el objeto
                        matchesById[matchId] = {
                            ...match,
                            liga: liga.name,
                            id: matchId
                        };
                        
                        // Formatear la fecha si existe
                        const matchDate = match.date ? new Date(match.date).toLocaleDateString() : 'N/A';
                        
                        // Obtener los nombres de los equipos
                        const team1Name = getTeamName(match.team1);
                        const team2Name = getTeamName(match.team2);
                        
                        // Crear la fila de la tabla
                        html += `
                            <tr data-match-id="${matchId}" class="match-row">
                                <td>${liga.name}</td>
                                <td class="text-right">
                                    <div class="d-flex align-items-center justify-content-end">
                                        <span class="mr-2">${team1Name}</span>
                                        <img src="./escudos/${match.team1}.png" alt="${team1Name}" class="team-logo-small" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                                    </div>
                                </td>
                                <td class="text-center">
                                    <strong>${match.score && match.score.ft ? match.score.ft[0] + ' - ' + match.score.ft[1] : 'N/A'}</strong>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <img src="./escudos/${match.team2}.png" alt="${team2Name}" class="team-logo-small" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                                        <span class="ml-2">${team2Name}</span>
                                    </div>
                                </td>
                                <td>${matchDate}</td>
                                <td>
                                    <button class="btn btn-sm btn-success view-details" data-match-id="${matchId}" style="background-color: #baff00; border-color: #baff00; color: #222222;">Ver detalles</button>
                                </td>
                            </tr>
                        `;
                        
                        matchCount++;
                    });
                }
            });
        }
        
        if (matchCount === 0) {
            html = '<tr><td colspan="6" class="text-center">No hay partidos disponibles para los filtros seleccionados.</td></tr>';
        }
        
        tableBody.innerHTML = html;
        
        // Añadir event listeners a los botones de detalles
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
        
        // También hacer que las filas sean clickeables
        document.querySelectorAll('.match-row').forEach(row => {
            row.addEventListener('click', function() {
                const matchId = this.getAttribute('data-match-id');
                showMatchDetails(matchId);
            });
        });
        
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error: ${error.message}</td></tr>`;
        console.error('Error al cargar los partidos:', error);
    }
}

// Función para mostrar los detalles de un partido
function showMatchDetails(matchId) {
    const match = matchesById[matchId];
    const detailsContainer = document.getElementById('match-details');
    
    if (!match) {
        detailsContainer.innerHTML = '<div class="alert alert-danger">No se encontró información del partido.</div>';
        detailsContainer.style.display = 'block';
        return;
    }
    
    // Obtener los nombres de los equipos
    const team1Name = getTeamName(match.team1);
    const team2Name = getTeamName(match.team2);
    
    // Calcular estadísticas adicionales
    const homeGoals = match.score && match.score.ft ? match.score.ft[0] : 0;
    const awayGoals = match.score && match.score.ft ? match.score.ft[1] : 0;
    const totalGoals = homeGoals + awayGoals;
    const homeHalfGoals = match.score && match.score.ht ? match.score.ht[0] : 0;
    const awayHalfGoals = match.score && match.score.ht ? match.score.ht[1] : 0;
    const secondHalfHomeGoals = homeGoals - homeHalfGoals;
    const secondHalfAwayGoals = awayGoals - awayHalfGoals;
    
    // Crear el HTML para los detalles del partido
    detailsContainer.innerHTML = `
        <div class="match-card">
            <h3 class="text-center mb-4">${match.liga}</h3>
            <div class="team-vs">
                <div class="team">
                    <h3>${team1Name}</h3>
                    <img src="./escudos/${match.team1}.png" alt="Escudo ${team1Name}" class="team-logo" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                </div>
                <div class="vs">
                    <div class="score-prediction">${homeGoals} - ${awayGoals}</div>
                    <p class="text-muted">Resultado Final</p>
                </div>
                <div class="team">
                    <h3>${team2Name}</h3>
                    <img src="./escudos/${match.team2}.png" alt="Escudo ${team2Name}" class="team-logo" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h4 class="text-center">Primer Tiempo</h4>
                    <div class="text-center mb-3">
                        <strong>${homeHalfGoals} - ${awayHalfGoals}</strong>
                    </div>
                </div>
                <div class="col-md-6">
                    <h4 class="text-center">Segundo Tiempo</h4>
                    <div class="text-center mb-3">
                        <strong>${secondHalfHomeGoals} - ${secondHalfAwayGoals}</strong>
                    </div>
                </div>
            </div>
            
            <div class="charts-container mt-4">
                <div class="chart-wrapper">
                    <div class="chart-title">Distribución de Goles</div>
                    <div class="chart-container">
                        <canvas id="goalsChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    detailsContainer.style.display = 'block';
    
    // Crear la gráfica de distribución de goles
    createGoalsChart(match);
    
    // Hacer scroll a los detalles
    detailsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Función para crear la gráfica de distribución de goles
function createGoalsChart(match) {
    const ctx = document.getElementById('goalsChart').getContext('2d');
    
    const homeGoals = match.score && match.score.ft ? match.score.ft[0] : 0;
    const awayGoals = match.score && match.score.ft ? match.score.ft[1] : 0;
    const homeHalfGoals = match.score && match.score.ht ? match.score.ht[0] : 0;
    const awayHalfGoals = match.score && match.score.ht ? match.score.ht[1] : 0;
    const secondHalfHomeGoals = homeGoals - homeHalfGoals;
    const secondHalfAwayGoals = awayGoals - awayHalfGoals;
    
    // Obtener los nombres de los equipos
    const team1Name = getTeamName(match.team1);
    const team2Name = getTeamName(match.team2);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Primer Tiempo', 'Segundo Tiempo', 'Total'],
            datasets: [
                {
                    label: team1Name,
                    data: [homeHalfGoals, secondHalfHomeGoals, homeGoals],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                },
                {
                    label: team2Name,
                    data: [awayHalfGoals, secondHalfAwayGoals, awayGoals],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Goles'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Goles por Tiempo'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            return `${label}: ${context.parsed.y} goles`;
                        }
                    }
                }
            }
        }
    });
}

// Inicializar la página cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Cargar partidos iniciales
    loadMatches();
    
    // Añadir event listener para el filtro de ligas
    document.getElementById('league-filter').addEventListener('change', loadMatches);
});


*/