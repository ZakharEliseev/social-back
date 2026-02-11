export const JWT_EXPIRATION_TIME = 60 * 60 * 24 * 30; // 30 days in seconds
export const BCRYPT_SALT_ROUNDS = 10;

export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Пользователь с таким email не найден',
  INVALID_PASSWORD: 'Неверный пароль',
  EMAIL_REGISTERED: 'Email уже зарегистрирован',
  USER_NOT_FOUND: 'Пользователь не найден',
  POST_NOT_FOUND: 'Пост не найден',
  UNAUTHORIZED: 'Не авторизован',
} as const;
