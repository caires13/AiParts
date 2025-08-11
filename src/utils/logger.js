export const Logger = {
  log: (...args) => console.log('[App]', ...args),
  warn: (...args) => console.warn('[App]', ...args),
  error: (...args) => console.error('[App]', ...args),
};

export class AppError extends Error { constructor(message){ super(message); this.name='AppError'; } }
export class ValidationError extends Error { constructor(message){ super(message); this.name='ValidationError'; } }
export class APIError extends Error { constructor(message,status){ super(message); this.name='APIError'; this.status=status; } }


