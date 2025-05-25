import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { app } from './firebase-config.js';

async function loadMatches() {
    const db = getDatabase(app);
    const matchesRef = ref(db, 'ligas'); // Ajusta la ruta según tu estructura
    const tableBody = document.querySelector('#matches-table tbody');
    tableBody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';

    try {
        const snapshot = await get(matchesRef);
        let html = '';
        if (snapshot.exists()) {
            snapshot.forEach(ligaSnap => {
                const liga = ligaSnap.val();
                if (liga.matches) {
                    liga.matches.forEach(match => {
                        html += `
                            <tr>
                                <td class="text-end">
                                    <img src="${match.team1_logo}" alt="${match.team1}" style="width:32px;height:32px;"> 
                                    <span>${match.team1}</span>
                                </td>
                                <td class="text-center">vs</td>
                                <td class="text-center">
                                    <strong>${match.score && match.score.ft ? match.score.ft[0] + ' - ' + match.score.ft[1] : 'N/A'}</strong>
                                </td>
                                <td class="text-center">vs</td>
                                <td class="text-start">
                                    <img src="${match.team2_logo}" alt="${match.team2}" style="width:32px;height:32px;"> 
                                    <span>${match.team2}</span>
                                </td>
                            </tr>
                        `;
                    });
                }
            });
        } else {
            html = '<tr><td colspan="5">No hay datos disponibles.</td></tr>';
        }
        tableBody.innerHTML = html;
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', loadMatches);