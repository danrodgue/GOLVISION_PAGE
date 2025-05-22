import { 
    registrarUsuario, 
    iniciarSesion, 
    iniciarSesionConGoogle, 
    cerrarSesion, 
    restablecerContrasena,
    observarEstadoAuth
} from './auth.js';

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleLoginBtn = document.getElementById('googleLogin');
const forgotPasswordLink = document.getElementById('forgotPassword');
const authMessage = document.getElementById('authMessage');

// Función para mostrar mensajes
const mostrarMensaje = (mensaje, esExito = true) => {
    authMessage.textContent = mensaje;
    authMessage.className = `auth-message ${esExito ? 'auth-success' : 'auth-error'}`;
    authMessage.style.display = 'block';
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        authMessage.style.display = 'none';
    }, 5000);
};

// Iniciar sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const resultado = await iniciarSesion(email, password);
    
    if (resultado.success) {
        mostrarMensaje('Has iniciado sesión correctamente');
        // Redirigir al usuario a la página principal después de 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        mostrarMensaje(resultado.error, false);
    }
});

// Registrar usuario
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Verificar que las contraseñas coincidan
    if (password !== confirmPassword) {
        mostrarMensaje('Las contraseñas no coinciden', false);
        return;
    }
    
    const resultado = await registrarUsuario(email, password);
    
    if (resultado.success) {
        mostrarMensaje('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
        // Cambiar a la pestaña de inicio de sesión
        document.getElementById('login-tab').click();
    } else {
        mostrarMensaje(resultado.error, false);
    }
});

// Iniciar sesión con Google
googleLoginBtn.addEventListener('click', async () => {
    const resultado = await iniciarSesionConGoogle();
    
    if (resultado.success) {
        mostrarMensaje('Has iniciado sesión con Google correctamente');
        // Redirigir al usuario a la página principal después de 1 segundo
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        mostrarMensaje(resultado.error, false);
    }
});

// Olvidé mi contraseña
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    
    if (!email) {
        mostrarMensaje('Por favor, introduce tu correo electrónico', false);
        return;
    }
    
    const resultado = await restablecerContrasena(email);
    
    if (resultado.success) {
        mostrarMensaje('Se ha enviado un correo para restablecer tu contraseña');
    } else {
        mostrarMensaje(resultado.error, false);
    }
});

// Verificar estado de autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    observarEstadoAuth((user) => {
        if (user) {
            console.log('Usuario autenticado:', user.email);
            // Aquí puedes actualizar la interfaz para usuarios autenticados
        } else {
            console.log('Usuario no autenticado');
            // Aquí puedes actualizar la interfaz para usuarios no autenticados
        }
    });
});