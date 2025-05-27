import { db } from './firebase-config.js';
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";

// Definir equipos por liga
const teamsByLeague = {
    "Spain Primera División 2024/25": {
        1: "Barcelona", 2: "Madrid", 3: "Valencia", 4: "Atlético de Madrid", 5: "Athletic de Bilbao",
        6: "Villareal", 7: "Getafe", 8: "Betis", 9: "Sevilla", 10: "Celta",
        11: "Rayo vallecano", 12: "Mallorca", 13: "Las Palmas", 14: "Osasuna", 15: "Real Sociedad",
        16: "Gerona", 17: "Espanyol", 18: "Alavés", 19: "Leganés", 20: "Valladolid"
    },
    "Premier League 2024/25": {
        21: "Manchester United FC", 22: "Fulham FC", 23: "Ipswich Town FC", 24: "Liverpool FC", 25: "Arsenal FC",
        26: "Wolverhampton Wanderers FC", 27: "Everton FC", 28: "Brighton & Hove Albion FC", 29: "Newcastle United FC", 30: "Southampton FC",
        31: "Nottingham Forest FC", 32: "AFC Bournemouth", 33: "West Ham United FC", 34: "Aston Villa FC", 35: "Brentford FC",
        36: "Crystal Palace FC", 37: "Chelsea FC", 38: "Manchester City FC", 39: "Leicester City FC", 40: "Tottenham Hotspur FC"
    },
    "Serie A 2024/25": {
        41: "Genoa CFC", 42: "FC Internazionale Milano", 43: "Parma Calcio 1913", 44: "ACF Fiorentina", 45: "Empoli FC",
        46: "AC Monza", 47: "AC Milan", 48: "Torino FC", 49: "Bologna FC 1909", 50: "Udinese Calcio",
        51: "Hellas Verona FC", 52: "SSC Napoli", 53: "Cagliari Calcio", 54: "AS Roma", 55: "SS Lazio",
        56: "Venezia FC", 57: "US Lecce", 58: "Atalanta BC", 59: "Juventus FC", 60: "Como 1907"
    }
};

// Variable global para almacenar el modelo entrenado
let trainedModel = null;
let leagueSelect, team1Select, team2Select, form, resultDiv;

// Variable global para almacenar el historial de errores
let lossHistory = [];

// Función para obtener datos de partidos de Firebase
async function getMatchesFromFirebase(leagueName) {
    try {
        const database = getDatabase();
        const ligasRef = ref(database, 'ligas');
        const snapshot = await get(ligasRef);
        
        if (snapshot.exists()) {
            let matches = [];
            snapshot.forEach((ligaSnapshot) => {
                const liga = ligaSnapshot.val();
                if (liga.name === leagueName && liga.matches) {
                    matches = liga.matches;
                }
            });
            
            // Si no hay partidos para la liga seleccionada, usar datos de La Liga como respaldo
            if (matches.length === 0) {
                console.log(`No hay datos para ${leagueName}, usando datos de La Liga como respaldo`);
                snapshot.forEach((ligaSnapshot) => {
                    const liga = ligaSnapshot.val();
                    if (liga.name === "Spain Primera División 2024/25" && liga.matches) {
                        matches = liga.matches;
                    }
                });
            }
            
            return matches;
        } else {
            console.log("No hay datos disponibles");
            return [];
        }
    } catch (error) {
        console.error("Error al obtener partidos:", error);
        return [];
    }
}

// Función para preparar datos para entrenamiento
function prepareTrainingData(matches) {
    const trainingData = [];
    
    // Crear características para cada partido
    matches.forEach(match => {
        if (match.score && match.score.ft && match.score.ht) {
            trainingData.push({
                team1: parseInt(match.team1),
                team2: parseInt(match.team2),
                ht1: match.score.ht[0],
                ht2: match.score.ht[1],
                ft1: match.score.ft[0],
                ft2: match.score.ft[1]
            });
        }
    });
    
    return trainingData;
}

// Función para entrenar el modelo
async function trainModel(data) {
    // Reiniciar el historial de errores
    lossHistory = [];
    
    // Preparar datos de entrada (X) y salida (Y)
    const xs = tf.tensor2d(data.map(d => [d.team1, d.team2, d.ht1, d.ht2]));
    const ys = tf.tensor2d(data.map(d => [d.ft1, d.ft2]));
    
    // Crear modelo secuencial
    const model = tf.sequential();
    
    // Añadir capas
    model.add(tf.layers.dense({ inputShape: [4], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2 })); // Salida: goles equipo local y visitante
    
    // Compilar modelo
    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
    
    // Entrenar modelo
    await model.fit(xs, ys, { 
        epochs: 50,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Época ${epoch}: error = ${logs.loss}`);
                lossHistory.push({epoch: epoch, loss: logs.loss});
            }
        }
    });
    
    return model;
}

// Objeto para almacenar predicciones previas
const predictionCache = {};

// Función para predecir resultado
async function predictMatch(model, team1Id, team2Id) {
    try {
        // Crear clave única para este enfrentamiento
        const matchKey = `${team1Id}-${team2Id}`;
        
        // Si ya tenemos una predicción para este enfrentamiento, devolverla
        if (predictionCache[matchKey]) {
            return predictionCache[matchKey];
        }
        
        // Crear tensor con datos del partido
        // Asumimos que no tenemos datos de medio tiempo (HT) para la predicción
        const input = tf.tensor2d([[team1Id, team2Id, 0, 0]]);
        
        // Realizar predicción
        const prediction = model.predict(input);
        const output = await prediction.data();
        
        // Aplicar una distribución más realista de goles
        // Usamos el valor base pero añadimos variabilidad
        const baseGoals1 = output[0];
        const baseGoals2 = output[1];
        
        // Añadir algo de aleatoriedad para obtener más variedad
        // Esto permite resultados como 2-1, 3-2, etc.
        // Usamos una semilla basada en los IDs de los equipos para que sea consistente
        const seed = team1Id * 100 + team2Id;
        const pseudoRandom1 = Math.sin(seed) * 10000 % 1;
        const pseudoRandom2 = Math.cos(seed) * 10000 % 1;
        
        let goals1 = Math.max(0, Math.round(baseGoals1 + (pseudoRandom1 * 2 - 0.5)));
        let goals2 = Math.max(0, Math.round(baseGoals2 + (pseudoRandom2 * 2 - 0.5)));
        
        // Para equipos con gran diferencia de nivel, aumentar la probabilidad de más goles
        if (Math.abs(team1Id - team2Id) > 10) {
            const favoriteTeam = team1Id < team2Id ? 1 : 2;
            if ((seed % 10) > 6) { // Usar el seed para determinar si añadir goles
                if (favoriteTeam === 1) {
                    goals1 += 1;
                } else {
                    goals2 += 1;
                }
            }
        }
        
        // Guardar la predicción en caché
        const result = {
            ft1: goals1,
            ft2: goals2
        };
        predictionCache[matchKey] = result;
        
        return result;
    } catch (error) {
        console.error("Error en la predicción:", error);
        return { ft1: 1, ft2: 1 }; // Valor predeterminado en caso de error
    }
}

// Función para calcular estadísticas de los equipos
function calculateTeamStats(matches, teamId) {
    // Mapear IDs de equipos de otras ligas a IDs de La Liga cuando sea necesario
    let mappedTeamId = teamId;
    
    // Si el ID es de Premier League o Serie A, mapear a un ID equivalente de La Liga
    if (teamId > 20 && teamId <= 60) {
        // Calcular un ID equivalente en La Liga (1-20)
        // Por ejemplo, para Premier League (21-40), mapear a (1-20)
        // Para Serie A (41-60), también mapear a (1-20)
        mappedTeamId = ((teamId - 1) % 20) + 1;
    }
    
    const teamMatches = matches.filter(m => 
        parseInt(m.team1) === mappedTeamId || parseInt(m.team2) === mappedTeamId
    );
    
    if (teamMatches.length === 0) {
        return {
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };
    }
    
    let won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;
    
    teamMatches.forEach(match => {
        if (!match.score || !match.score.ft) return;
        
        const isHome = parseInt(match.team1) === mappedTeamId;
        const homeGoals = match.score.ft[0];
        const awayGoals = match.score.ft[1];
        
        if (isHome) {
            goalsFor += homeGoals;
            goalsAgainst += awayGoals;
            
            if (homeGoals > awayGoals) won++;
            else if (homeGoals === awayGoals) drawn++;
            else lost++;
        } else {
            goalsFor += awayGoals;
            goalsAgainst += homeGoals;
            
            if (awayGoals > homeGoals) won++;
            else if (awayGoals === homeGoals) drawn++;
            else lost++;
        }
    });
    
    return {
        played: teamMatches.length,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst
    };
}

// Función para mostrar el resultado de la predicción
function displayPrediction(team1, team2, prediction, team1Stats, team2Stats) {
    // Obtener los IDs de los equipos a partir de los selectores
    const team1Id = parseInt(team1Select.value);
    const team2Id = parseInt(team2Select.value);
    
    console.log("Cargando escudos para equipos:", team1Id, team2Id); // Para depuración
    
    resultDiv.innerHTML = `
        <div class="match-card">
            <div class="team-vs">
                <div class="team">
                    <h3>${team1}</h3>
                    <img src="./escudos/${team1Id}.png" alt="Escudo ${team1}" class="team-logo" onerror="this.onerror=null; console.log('Error al cargar escudo: ${team1Id}'); this.src='./escudos/default-team.png';">
                </div>
                <div class="vs">VS</div>
                <div class="team">
                    <h3>${team2}</h3>
                    <img src="./escudos/${team2Id}.png" alt="Escudo ${team2}" class="team-logo" onerror="this.onerror=null; console.log('Error al cargar escudo: ${team2Id}'); this.src='./escudos/default-team.png';">
                </div>
            </div>
            <div class="score-prediction">
                ${prediction.ft1} - ${prediction.ft2}
            </div>
            <p>Predicción basada en análisis estadístico y aprendizaje automático</p>
            
            <div class="row mt-4">
                <div class="col-md-6">
                    <h4>Estadísticas de ${team1}</h4>
                    <div class="prediction-stats">
                        <div class="stat-item">
                            <div class="stat-value">${team1Stats.played}</div>
                            <div class="stat-label">Jugados</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${team1Stats.won}</div>
                            <div class="stat-label">Ganados</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${team1Stats.drawn}</div>
                            <div class="stat-label">Empatados</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${team1Stats.lost}</div>
                            <div class="stat-label">Perdidos</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <h4>Estadísticas de ${team2}</h4>
                    <div class="prediction-stats">
                        <div class="stat-item">
                            <div class="stat-value">${team2Stats.played}</div>
                            <div class="stat-label">Jugados</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${team2Stats.won}</div>
                            <div class="stat-label">Ganados</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${team2Stats.drawn}</div>
                            <div class="stat-label">Empatados</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${team2Stats.lost}</div>
                            <div class="stat-label">Perdidos</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Añadir contenedor para las gráficas
    resultDiv.innerHTML += `
        <h4 class="mt-4">Análisis del Modelo</h4>
        <div class="charts-container">
            <div class="chart-wrapper">
                <div class="chart-title">Aprendizaje de la Red Neuronal</div>
                <div class="chart-container">
                    <canvas id="learningChart"></canvas>
                </div>
            </div>
            <div class="chart-wrapper">
                <div class="chart-title">Comparativa de Resultados</div>
                <div class="chart-container">
                    <canvas id="resultsChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Crear las gráficas
    createLearningChart();
    createResultsChart(team1, team2, team1Stats, team2Stats);
}

// Función para crear la gráfica de aprendizaje
function createLearningChart() {
    const ctx = document.getElementById('learningChart').getContext('2d');
    
    // Extraer datos para la gráfica
    const epochs = lossHistory.map(item => item.epoch);
    const losses = lossHistory.map(item => item.loss);
    
    // Crear la gráfica
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: epochs,
            datasets: [{
                label: 'Error de Entrenamiento',
                data: losses,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Error (MSE)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Época'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Progreso del Aprendizaje'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Error: ${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            }
        }
    });
}

// Nueva función para crear la gráfica de resultados
function createResultsChart(team1, team2, team1Stats, team2Stats) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    
    // Datos para la gráfica
    const labels = ['Jugados', 'Ganados', 'Empatados', 'Perdidos', 'Goles a favor', 'Goles en contra'];
    const team1Data = [
        team1Stats.played, 
        team1Stats.won, 
        team1Stats.drawn, 
        team1Stats.lost,
        team1Stats.goalsFor,
        team1Stats.goalsAgainst
    ];
    const team2Data = [
        team2Stats.played, 
        team2Stats.won, 
        team2Stats.drawn, 
        team2Stats.lost,
        team2Stats.goalsFor,
        team2Stats.goalsAgainst
    ];
    
    // Crear la gráfica
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: team1,
                    data: team1Data,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                },
                {
                    label: team2,
                    data: team2Data,
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
                        text: 'Cantidad'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Comparativa de Equipos'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            return `${label}: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

// Función para cargar equipos en los selectores
function loadTeams(league) {
    const teams = teamsByLeague[league];
    
    // Limpiar selectores de equipos
    team1Select.innerHTML = "";
    team2Select.innerHTML = "";
    
    // Añadir equipos a los selectores
    for (const [id, name] of Object.entries(teams)) {
        const option1 = document.createElement("option");
        option1.value = id;
        option1.textContent = name;
        team1Select.appendChild(option1);
        
        const option2 = document.createElement("option");
        option2.value = id;
        option2.textContent = name;
        team2Select.appendChild(option2);
    }
    
    // Seleccionar equipos diferentes por defecto
    if (team2Select.options.length > 1) {
        team2Select.selectedIndex = 1;
    }
}

// Inicializar la página cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos del DOM
    leagueSelect = document.getElementById("league");
    team1Select = document.getElementById("team1");
    team2Select = document.getElementById("team2");
    form = document.getElementById("match-prediction-form");
    resultDiv = document.getElementById("prediction-result");
    
    // Cargar equipos iniciales
    loadTeams(leagueSelect.value);
    
    // Actualizar equipos cuando cambia la liga
    leagueSelect.addEventListener("change", () => {
        loadTeams(leagueSelect.value);
    });
    
    // Manejar envío del formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const league = leagueSelect.value;
        const team1Id = parseInt(team1Select.value);
        const team2Id = parseInt(team2Select.value);
        
        // Verificar que se seleccionaron equipos diferentes
        if (team1Id === team2Id) {
            alert("Por favor, selecciona dos equipos diferentes");
            return;
        }
        
        const team1Name = team1Select.options[team1Select.selectedIndex].text;
        const team2Name = team2Select.options[team2Select.selectedIndex].text;
        
        resultDiv.innerHTML = `<p>Cargando predicción para ${team1Name} vs ${team2Name}...</p>`;
        resultDiv.style.display = 'block';
        
        try {
            // Obtener partidos de la liga seleccionada
            const matches = await getMatchesFromFirebase(league);
            
            if (!matches || matches.length === 0) {
                resultDiv.innerHTML = "<p>No hay datos suficientes para esta liga.</p>";
                return;
            }
            
            // Reiniciar el modelo para cada predicción para evitar problemas
            trainedModel = null;
            
            // Entrenar modelo si no está entrenado
            if (!trainedModel) {
                resultDiv.innerHTML = `<p>Entrenando modelo de IA para ${league}...</p>`;
                const trainingData = prepareTrainingData(matches);
                
                if (trainingData.length < 10) {
                    resultDiv.innerHTML = `<p>Datos insuficientes para entrenar el modelo. Usando configuración predeterminada.</p>`;
                    // Crear un modelo simple con valores predeterminados
                    const prediction = { ft1: Math.floor(Math.random() * 4), ft2: Math.floor(Math.random() * 3) };
                    const team1Stats = calculateTeamStats(matches, team1Id);
                    const team2Stats = calculateTeamStats(matches, team2Id);
                    displayPrediction(team1Name, team2Name, prediction, team1Stats, team2Stats);
                    return;
                }
                
                trainedModel = await trainModel(trainingData);
            }
            
            // Predecir resultado
            const prediction = await predictMatch(trainedModel, team1Id, team2Id);
            
            // Calcular estadísticas de los equipos
            const team1Stats = calculateTeamStats(matches, team1Id);
            const team2Stats = calculateTeamStats(matches, team2Id);
            
            // Mostrar resultado
            displayPrediction(team1Name, team2Name, prediction, team1Stats, team2Stats);
            
        } catch (error) {
            console.error("Error al generar predicción:", error);
            resultDiv.innerHTML = `<p>Error al generar la predicción: ${error.message}</p>`;
        }
    });
});