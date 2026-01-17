import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { SearchUsersQueryDto } from './dto/search-users.query.dto';
import { SearchUsersResponseDto } from './dto/search-users-response.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { StorageService } from '../common/services/storage.service';

@ApiTags('users')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Поиск пользователей' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей',
    type: [SearchUsersResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchUsers(
    @Query() query: SearchUsersQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.searchUsers({ q: query.q, activeUserId: user.id });
  }

  @Post(':id/follow')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Подписаться на пользователя' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID to follow' })
  @ApiResponse({ status: 201, description: 'Подписан' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Already following' })
  async follow(
    @Param('id', ParseIntPipe) followingId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const relation = await this.usersService.follow({
      followerId: user.id,
      followingId,
    });
    return {
      id: relation.id,
      followerId: relation.followerId,
      followingId: relation.followingId,
      createdAt: relation.createdAt?.toISOString?.() ?? null,
    };
  }

  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отписаться от пользователя' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID to unfollow' })
  @ApiResponse({ status: 204, description: 'Отписан' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Follow relation not found' })
  async unfollow(
    @Param('id', ParseIntPipe) followingId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.usersService.unfollow({ followerId: user.id, followingId });
    return;
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить свой профиль' })
  @ApiResponse({
    status: 200,
    description: 'Профиль текущего пользователя',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOwnProfile(@CurrentUser() user: CurrentUserPayload) {
    const profile = await this.usersService.getUserProfile({
      userId: user.id,
      activeUserId: user.id,
    });
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      bio: profile.bio,
      avatar: profile.avatar,
      postsCount: profile.postsCount,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      isFollowing: profile.isFollowing,
      isOwnProfile: profile.isOwnProfile,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновить свой профиль' })
  @ApiResponse({
    status: 200,
    description: 'Профиль обновлен',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Email уже используется' })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.usersService.updateProfile({
      userId: user.id,
      email: updateProfileDto.email,
      bio: updateProfileDto.bio,
    });

    // Возвращаем обновленный профиль
    const profile = await this.usersService.getUserProfile({
      userId: user.id,
      activeUserId: user.id,
    });

    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      bio: profile.bio,
      avatar: profile.avatar,
      postsCount: profile.postsCount,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      isFollowing: profile.isFollowing,
      isOwnProfile: profile.isOwnProfile,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  @Post('profile/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Загрузить аватар пользователя' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Файл изображения',
    type: UploadAvatarDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Аватар загружен',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000.jpg',
          description:
            'Имя файла аватара. Для получения картинки используйте GET /api/v1/files/avatars/{avatar}',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    // Валидация типа файла
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Неподдерживаемый формат файла. Поддерживаются: JPEG, PNG, WebP',
      );
    }

    // Валидация размера (макс 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Файл слишком большой. Максимум 5MB');
    }

    // Удаляем старый аватар если есть
    const currentProfile = await this.usersService.getUserProfile({
      userId: user.id,
      activeUserId: user.id,
    });
    if (currentProfile.avatar) {
      // avatar теперь содержит только имя файла
      await this.storageService.deleteFile(currentProfile.avatar);
    }

    // Загружаем новый аватар (без префикса, т.к. эндпоинт уже /files/avatars/)
    const fileName = await this.storageService.uploadFile(file);

    // Обновляем профиль (сохраняем только имя файла)
    await this.usersService.updateProfile({
      userId: user.id,
      avatar: fileName,
    });

    return { avatar: fileName };
  }

  @Delete('profile/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить аватар пользователя' })
  @ApiResponse({ status: 204, description: 'Аватар удален' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAvatar(@CurrentUser() user: CurrentUserPayload) {
    const currentProfile = await this.usersService.getUserProfile({
      userId: user.id,
      activeUserId: user.id,
    });

    if (currentProfile.avatar) {
      // avatar теперь содержит только имя файла
      await this.storageService.deleteFile(currentProfile.avatar);

      await this.usersService.updateProfile({
        userId: user.id,
        avatar: null,
      });
    }
  }

  @Put('profile/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Изменить пароль' })
  @ApiResponse({
    status: 204,
    description: 'Пароль успешно изменен',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Неверный текущий пароль' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.usersService.changePassword({
      userId: user.id,
      currentPassword: changePasswordDto.currentPassword,
      newPassword: changePasswordDto.newPassword,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Получить профиль пользователя по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getUserProfile(
    @Param('id', ParseIntPipe) userId: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const profile = await this.usersService.getUserProfile({
      userId,
      activeUserId: user.id,
    });
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      bio: profile.bio,
      avatar: profile.avatar,
      postsCount: profile.postsCount,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      isFollowing: profile.isFollowing,
      isOwnProfile: profile.isOwnProfile,
      createdAt: profile.createdAt.toISOString(),
    };
  }
}
