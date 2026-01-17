export const JWT_EXPIRATION_TIME = 60 * 60; // 1 hour in seconds
export const BCRYPT_SALT_ROUNDS = 10;

export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'invalid_email',
  INVALID_PASSWORD: 'invalid_password',
  EMAIL_REGISTERED: 'email_registered',
  USER_NOT_FOUND: 'User not found',
  POST_NOT_FOUND: 'Post not found',
  UNAUTHORIZED: 'Unauthorized',
} as const;
