// Cambiar esto:
import { auth, observarEstadoAuth, cerrarSesion } from './auth.js';

// Por esto:
import { observarEstadoAuth, cerrarSesion } from './auth.js';
import { auth } from './firebase-config.js';

// Función para actualizar la navegación según el estado de autenticación
export const actualizarNavegacion = () => {
    observarEstadoAuth((user) => {
        const menuList = document.querySelector('.menu-list');
        
        // Si existe el elemento de menú
        if (menuList) {
            // Buscar si ya existe un elemento de login/logout
            const loginItem = Array.from(menuList.children).find(
                item => item.querySelector('a').href.includes('login.html')
            );
            
            if (user) {
                // Usuario autenticado
                if (loginItem) {
                    const link = loginItem.querySelector('a');
                    link.textContent = 'Cerrar Sesión';
                    link.href = '#';
                    link.onclick = async (e) => {
                        e.preventDefault();
                        await cerrarSesion();
                        window.location.href = 'index.html';
                    };
                }
            } else {
                // Usuario no autenticado
                if (loginItem) {
                    const link = loginItem.querySelector('a');
                    link.textContent = 'Iniciar Sesión';
                    link.href = 'login.html';
                    link.onclick = null;
                }
            }
        }
    });
};

// Iniciar la actualización de navegación cuando se carga el documento
document.addEventListener('DOMContentLoaded', actualizarNavegacion);