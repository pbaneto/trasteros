// Security and validation constants
export const VALIDATION_RULES = {
  // Name validation
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+$/,
    PATTERN_MESSAGE: 'Solo se permiten letras, espacios, guiones y apostrofes'
  },
  
  // Email validation
  EMAIL: {
    MAX_LENGTH: 100,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  
  // Phone validation
  PHONE: {
    MIN_LENGTH: 9,
    MAX_LENGTH: 20,
    PATTERN: /^[+]?[0-9\s\-()]{9,20}$/,
    PATTERN_MESSAGE: 'Formato inválido. Ejemplo: +34 612 345 678'
  },
  
  // Password validation
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    PATTERN_MESSAGE: 'Debe contener al menos: 1 mayúscula, 1 minúscula y 1 número'
  }
};

// Security-focused input sanitization
export const sanitizeInput = (input: string, options: {
  maxLength?: number;
  allowSpecialChars?: boolean;
  allowHtml?: boolean;
} = {}): string => {
  if (!input || typeof input !== 'string') return '';
  
  const {
    maxLength = 100,
    allowSpecialChars = false,
    allowHtml = false
  } = options;
  
  let sanitized = input.trim();
  
  // Remove null bytes and control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Remove potentially dangerous patterns
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/&[#\w]+;/g, ''); // Remove HTML entities
  }
  
  if (!allowSpecialChars) {
    // Only allow alphanumeric, spaces, and basic punctuation
    sanitized = sanitized.replace(/[^\w\s@.\-+áéíóúàèìòùâêîôûäëïöüñç']/gi, '');
  }
  
  // Limit length
  return sanitized.substring(0, maxLength);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) return false;
  return VALIDATION_RULES.EMAIL.PATTERN.test(email);
};

// Validate phone number
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional
  if (phone.length < VALIDATION_RULES.PHONE.MIN_LENGTH || 
      phone.length > VALIDATION_RULES.PHONE.MAX_LENGTH) return false;
  return VALIDATION_RULES.PHONE.PATTERN.test(phone);
};

// Validate name (first name, last name)
export const isValidName = (name: string): boolean => {
  if (!name || name.length < VALIDATION_RULES.NAME.MIN_LENGTH || 
      name.length > VALIDATION_RULES.NAME.MAX_LENGTH) return false;
  return VALIDATION_RULES.NAME.PATTERN.test(name);
};

// Password strength validation
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    errors.push(`Debe tener al menos ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} caracteres`);
  }
  
  if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
    errors.push(`No puede superar los ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} caracteres`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  
  // Check for common weak patterns
  if (/^.*(123|password|admin|qwerty).*$/i.test(password)) {
    errors.push('No puede contener patrones comunes como "123" o "password"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Prevent common injection attacks
export const hasInjectionPattern = (input: string): boolean => {
  if (!input) return false;
  
  const injectionPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /on\w+\s*=/gi, // Event handlers
    /\b(eval|exec|system|shell_exec)\s*\(/gi, // Dangerous functions
    /('|(\\')|(;)|(\\)|(\/\*)|\*\/)/g, // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi // SQL commands
  ];
  
  return injectionPatterns.some(pattern => pattern.test(input));
};

// Rate limiting helper for client-side
export class ClientRateLimit {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  canAttempt(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    if (!attempt || now > attempt.resetTime) {
      // First attempt or window expired
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  getRemainingTime(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    const remaining = attempt.resetTime - Date.now();
    return Math.max(0, remaining);
  }
}

export const authRateLimit = new ClientRateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes