// Cambiar esto:
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { app } from './firebase-config.js';

// Por esto:
import { ref, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { db } from './firebase-config.js';

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
                        
                        // Crear la fila de la tabla
                        html += `
                            <tr data-match-id="${matchId}" class="match-row">
                                <td>${liga.name}</td>
                                <td class="text-right">
                                    <div class="d-flex align-items-center justify-content-end">
                                        <span class="mr-2">${match.team1}</span>
                                        <img src="./escudos/${match.team1}.png" alt="${match.team1}" class="team-logo-small" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                                    </div>
                                </td>
                                <td class="text-center">
                                    <strong>${match.score && match.score.ft ? match.score.ft[0] + ' - ' + match.score.ft[1] : 'N/A'}</strong>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <img src="./escudos/${match.team2}.png" alt="${match.team2}" class="team-logo-small" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                                        <span class="ml-2">${match.team2}</span>
                                    </div>
                                </td>
                                <td>${matchDate}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary view-details" data-match-id="${matchId}">Ver detalles</button>
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
                    <h3>${match.team1}</h3>
                    <img src="./escudos/${match.team1}.png" alt="Escudo ${match.team1}" class="team-logo" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
                </div>
                <div class="vs">
                    <div class="score-prediction">${homeGoals} - ${awayGoals}</div>
                    <p class="text-muted">Resultado Final</p>
                </div>
                <div class="team">
                    <h3>${match.team2}</h3>
                    <img src="./escudos/${match.team2}.png" alt="Escudo ${match.team2}" class="team-logo" onerror="this.onerror=null; this.src='./escudos/default-team.png';">
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
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Primer Tiempo', 'Segundo Tiempo', 'Total'],
            datasets: [
                {
                    label: match.team1,
                    data: [homeHalfGoals, secondHalfHomeGoals, homeGoals],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                },
                {
                    label: match.team2,
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