export const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'Error desconocido';

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || '';

  // Authentication specific errors
  if (errorMessage.includes('invalid login credentials') || errorCode === 'invalid_credentials') {
    return 'Email o contraseña incorrectos. Verifica tus datos e intenta de nuevo.';
  }

  if (errorMessage.includes('email not confirmed') || errorCode === 'email_not_confirmed') {
    return 'Tu cuenta aún no está verificada. Revisa tu email y haz clic en el enlace de confirmación.';
  }

  if (errorMessage.includes('signup disabled') || errorCode === 'signup_disabled') {
    return 'El registro de nuevas cuentas está temporalmente deshabilitado.';
  }

  if (errorMessage.includes('email already in use') || errorMessage.includes('already registered')) {
    return 'Este email ya está registrado. Intenta iniciar sesión o recuperar tu contraseña.';
  }

  if (errorMessage.includes('weak password') || errorCode === 'weak_password') {
    return 'La contraseña es demasiado débil. Debe tener al menos 8 caracteres con mayúsculas, minúsculas y números.';
  }

  if (errorMessage.includes('password too short')) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  // Rate limiting errors
  if (errorMessage.includes('too many requests') || errorCode === 'too_many_requests') {
    return 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.';
  }

  if (errorMessage.includes('rate limit') || errorCode === 'rate_limit_exceeded') {
    return 'Has excedido el límite de intentos. Espera antes de volver a intentarlo.';
  }

  // Network and connection errors
  if (errorMessage.includes('failed to fetch') || 
      errorMessage.includes('network error') || 
      errorMessage.includes('fetch') ||
      error instanceof TypeError) {
    return 'Error de conexión. Verifica tu conexión a internet e intenta de nuevo.';
  }

  // Session and token errors
  if (errorMessage.includes('jwt') || 
      errorMessage.includes('token') || 
      errorCode === 'invalid_token') {
    return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
  }

  if (errorMessage.includes('session not found') || errorCode === 'session_not_found') {
    return 'Sesión no encontrada. Por favor, inicia sesión de nuevo.';
  }

  // OAuth specific errors
  if (errorMessage.includes('oauth')) {
    if (errorMessage.includes('popup')) {
      return 'Error con la ventana emergente. Habilita las ventanas emergentes y prueba de nuevo.';
    }
    if (errorMessage.includes('redirect')) {
      return 'Error de redirección durante el inicio de sesión. Intenta de nuevo.';
    }
    return 'Error durante el inicio de sesión con Google. Intenta de nuevo.';
  }

  // Database and server errors
  if (errorMessage.includes('internal server error') || errorCode === 'internal_server_error') {
    return 'Error del servidor. Nuestro equipo ya está trabajando en solucionarlo.';
  }

  if (errorMessage.includes('service unavailable') || errorCode === 'service_unavailable') {
    return 'Servicio temporalmente no disponible. Intenta de nuevo en unos minutos.';
  }

  // Profile creation errors
  if (errorMessage.includes('profile') || errorMessage.includes('constraint')) {
    return 'Error al crear tu perfil. Intenta de nuevo o contacta soporte.';
  }

  // Generic fallbacks
  if (error.message && error.message.length > 0) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo.';
};