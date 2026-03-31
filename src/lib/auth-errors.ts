const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos",
  "Email not confirmed": "Necesitás confirmar tu email antes de ingresar",
  "User already registered": "Ya existe una cuenta con ese email",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
  "Email rate limit exceeded": "Demasiados intentos. Esperá unos minutos antes de reintentar",
  "For security purposes, you can only request this once every 60 seconds": "Por seguridad, solo podés solicitar esto una vez por minuto",
  "New password should be different from the old password": "La nueva contraseña debe ser diferente a la anterior",
  "Auth session missing!": "Sesión expirada. Iniciá sesión nuevamente",
  "User not found": "No se encontró una cuenta con ese email",
  "Invalid email": "El email ingresado no es válido",
  "Signup requires a valid password": "Se requiere una contraseña válida",
};

export function translateAuthError(message: string): string {
  return ERROR_MAP[message] || "Ocurrió un error. Intentá de nuevo";
}
