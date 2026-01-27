# Social Server (NestJS)

Серверная часть социальной сети на NestJS с PostgreSQL, MinIO, Swagger и Docker.

## Технологии

- **NestJS** - фреймворк для Node.js
- **TypeORM** - ORM для работы с базой данных
- **PostgreSQL** - база данных
- **MinIO** - S3-совместимое хранилище для файлов
- **JWT** - аутентификация
- **Swagger** - документация API
- **Docker** - контейнеризация

## Установка

### Локальная разработка

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

3. Настройте переменные окружения в `.env`

4. Запустите PostgreSQL локально или через Docker:

```bash
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=social_db -p 5432:5432 postgres:16-alpine
```

5. Запустите приложение:

```bash
npm run start:dev
```

Приложение будет доступно на `http://localhost:5000`
Swagger документация: `http://localhost:5000/api`

### Docker

#### Development режим (с hot reload)

**Запуск dev окружения:**

```bash
npm run docker:dev
```

При изменении файлов в `src/` сервер автоматически перезапускается благодаря hot reload.

Сервисы:
- API: `http://localhost:5001`
- Swagger: `http://localhost:5001/api`
- PostgreSQL: `localhost:5432`
- MinIO Console: `http://localhost:9001` (minioadmin/minioadmin)
- MinIO API: `http://localhost:9000`

**Остановка:**

```bash
npm run docker:dev:down
```

#### Production режим

**Запуск с нуля:**

1. Если контейнеры уже запущены, остановите и удалите их:

```bash
docker-compose down
```

2. Соберите и запустите контейнеры:

```bash
npm run docker:prod
```

3. Проверьте статус:

```bash
docker-compose ps
```

4. Посмотрите логи (если нужно):

```bash
docker-compose logs -f app
```

**Приложение будет доступно:**

- API: `http://localhost:5001`
- Swagger документация: `http://localhost:5001/api`
- MinIO Console: `http://localhost:9001` (minioadmin/minioadmin)
- MinIO API: `http://localhost:9000`

**Управление контейнерами:**

```bash
# Остановить dev окружение
npm run docker:dev:down

# Остановить production окружение
npm run docker:prod:down

# Остановить и удалить volumes (очистить БД и файлы)
docker-compose down -v

# Перезапустить
docker-compose restart

# Пересобрать и запустить заново
docker-compose up -d --build

# Посмотреть логи
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f minio
```

## API Endpoints

### Auth

- `POST /api/v1/auth/register` - Регистрация (требуется: `username`, `email`, `password`, `confirmPassword`)
- `POST /api/v1/auth/login` - Вход (требуется: `email`, `password`, возвращает `{ accessToken, tokenType, expiresIn }`)

### Users

- `GET /api/v1/users?q=marina` - Поиск пользователей (JWT)
- `GET /api/v1/users/profile` - Получить свой профиль (JWT)
- `PUT /api/v1/users/profile` - Обновить свой профиль (JWT, body: `{ email?, bio? }`)
- `POST /api/v1/users/profile/avatar` - Загрузить аватар (JWT, multipart/form-data, поле: `avatar`)
- `DELETE /api/v1/users/profile/avatar` - Удалить аватар (JWT, 204)
- `PUT /api/v1/users/profile/password` - Изменить пароль (JWT, body: `{ currentPassword, newPassword, confirmPassword }`)
- `GET /api/v1/users/:id` - Получить профиль пользователя по ID (JWT)
- `POST /api/v1/users/:id/follow` - Подписаться на пользователя (JWT)
- `DELETE /api/v1/users/:id/follow` - Отписаться от пользователя (JWT, 204)

### Posts

- `POST /api/v1/posts` - Создать пост (JWT)
- `GET /api/v1/posts?limit=20&offset=0` - Мои посты (JWT)
- `GET /api/v1/posts/user/:userId?limit=20&offset=0` - Посты пользователя по ID (JWT)
- `DELETE /api/v1/posts/:id` - Удалить свой пост (JWT, 204)
- `PUT /api/v1/posts/:id/like` - Лайкнуть/убрать лайк с поста (JWT)
- `POST /api/v1/posts/:id/comments` - Добавить комментарий к посту (JWT)
- `GET /api/v1/posts/:id/comments?limit=50&offset=0` - Получить комментарии к посту (JWT)

### Feed

- `GET /api/v1/feed?limit=20&offset=0` - Лента (посты тех, на кого я подписан) (JWT)
- `GET /api/v1/feed/all?limit=20&offset=0` - Все посты в системе, глобальная лента (JWT)

### Files

- `GET /api/v1/files/avatars/:filename` - Получить аватар по имени файла (публичный)

**Ответы постов включают:**

- `likesCount` - количество лайков
- `isLiked` - лайкнул ли текущий пользователь
- `commentsCount` - количество комментариев
- `comments` - последние 5 комментариев (опционально)

**Профиль пользователя включает:**

- `id`, `username`, `email`, `bio`, `avatar` (имя файла или null)
- `postsCount` - количество постов
- `followersCount` - количество подписчиков
- `followingCount` - количество подписок
- `isFollowing` - подписан ли текущий пользователь
- `isOwnProfile` - это профиль текущего пользователя
- `createdAt` - дата создания профиля

**Для получения URL аватара используйте:**
- `GET /api/v1/files/avatars/{avatar}` где `{avatar}` - значение поля `avatar` из профиля

## Seed данных

При первом запуске в development режиме база данных автоматически заполняется тестовыми данными:

- **10 пользователей** (пароль для всех: `password123`)
- **7 постов**
- **8 подписок**
- **9 лайков**
- **6 комментариев**

**Тестовые пользователи:**

- alice (alice@example.com)
- bob (bob@example.com)
- charlie (charlie@example.com)
- diana (diana@example.com)
- eve (eve@example.com)
- frank (frank@example.com)
- grace (grace@example.com)
- henry (henry@example.com)
- ivy (ivy@example.com)
- jack (jack@example.com)

**Ручной запуск seed:**

```bash
npm run seed
```

## Структура проекта

```
src/
├── auth/           # Модуль аутентификации
├── users/          # Модуль пользователей
├── posts/          # Модуль постов (лайки, комментарии, feed)
├── files/          # Модуль для работы с файлами (получение аватаров)
├── common/
│   ├── services/   # StorageService (MinIO)
│   ├── decorators/ # Декораторы (CurrentUser)
│   ├── filters/    # Exception фильтры
│   ├── interceptors/ # Interceptors (логирование)
│   ├── dto/        # Общие DTO
│   └── constants/  # Константы
├── config/         # Конфигурация (database, minio)
├── migrations/     # Миграции (создание схемы + seed)
├── scripts/        # Seed скрипты
├── entities/       # TypeORM entities (User, Post, Like, Comment, Follower)
└── main.ts         # Точка входа
```

## Работа с файлами (аватары)

Аватары пользователей хранятся в MinIO (S3-совместимое хранилище).

### Загрузка аватара

```bash
curl -X POST http://localhost:5000/api/v1/users/profile/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

Ответ:
```json
{
  "avatar": "550e8400-e29b-41d4-a716-446655440000.jpg"
}
```

Для получения изображения используйте:
```
GET /api/v1/files/avatars/550e8400-e29b-41d4-a716-446655440000.jpg
```

### Удаление аватара

```bash
curl -X DELETE http://localhost:5000/api/v1/users/profile/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ограничения:**
- Формат: JPEG, PNG, WebP
- Максимальный размер: 5MB
- Старый аватар автоматически удаляется при загрузке нового

**MinIO Console:**
- URL: `http://localhost:9001`
- Логин: `minioadmin`
- Пароль: `minioadmin`

Там можно просматривать и управлять загруженными файлами.

## Переменные окружения

- `NODE_ENV` - окружение (development/production)
- `PORT` - порт приложения (по умолчанию 5000)
- `DB_HOST` - хост PostgreSQL
- `DB_PORT` - порт PostgreSQL (по умолчанию 5432)
- `DB_USERNAME` - имя пользователя БД
- `DB_PASSWORD` - пароль БД
- `DB_NAME` - имя базы данных
- `JWT_SECRET` - секретный ключ для JWT
- `CORS_ORIGIN` - разрешенные источники для CORS (по умолчанию `*`)
- `MINIO_ENDPOINT` - хост MinIO (по умолчанию localhost)
- `MINIO_PORT` - порт MinIO (по умолчанию 9000)
- `MINIO_ACCESS_KEY` - access key MinIO (по умолчанию minioadmin)
- `MINIO_SECRET_KEY` - secret key MinIO (по умолчанию minioadmin)
- `MINIO_USE_SSL` - использовать SSL для MinIO (по умолчанию false)
- `MINIO_BUCKET` - имя bucket для аватаров (по умолчанию avatars)

## Функциональность

- ✅ Аутентификация и авторизация (JWT)
- ✅ Регистрация и вход пользователей
- ✅ Поиск пользователей
- ✅ Управление профилем (обновление email, bio)
- ✅ Загрузка и удаление аватаров (MinIO)
- ✅ Изменение пароля
- ✅ Подписки/отписки на пользователей
- ✅ Создание и просмотр постов
- ✅ Удаление своих постов
- ✅ Лента постов (посты тех, на кого подписан)
- ✅ Лайки постов (toggle)
- ✅ Комментарии к постам
- ✅ Получение файлов (аватаров) через API
- ✅ Автоматическое заполнение тестовыми данными (dev режим)
- ✅ Swagger документация API
- ✅ Hot reload в development режиме (Docker)
- ✅ Валидация данных (class-validator)
- ✅ Глобальная обработка ошибок
- ✅ Логирование запросов