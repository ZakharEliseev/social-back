import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  JWT_EXPIRATION_TIME,
  BCRYPT_SALT_ROUNDS,
  ERROR_MESSAGES,
} from '../common/constants';
import { JwtPayload, AccessTokenResponse } from '../common/interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      this.logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_EMAIL);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for user: ${email}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    const result: any = { ...user };
    delete result.password;
    return result;
  }

  private generateToken(payload: JwtPayload): AccessTokenResponse {
    const expiresIn = JWT_EXPIRATION_TIME; // в секундах
    const exp = Math.floor(Date.now() / 1000) + expiresIn;

    // ВАЖНО: не добавляем exp в payload, библиотека добавит его автоматически через expiresIn
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: `${expiresIn}s`,
      }),
      tokenType: 'Bearer',
      expiresIn: exp,
    };
  }

  async login(loginDto: LoginDto): Promise<AccessTokenResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const tokenData = this.generateToken(payload);

    this.logger.log(`User logged in successfully: ${user.email}`);

    return tokenData;
  }

  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    // Проверяем email
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUserByEmail) {
      this.logger.warn(
        `Registration attempt with existing email: ${registerDto.email}`,
      );
      throw new ConflictException('Email уже зарегистрирован');
    }

    // Проверяем username
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUserByUsername) {
      this.logger.warn(
        `Registration attempt with existing username: ${registerDto.username}`,
      );
      throw new ConflictException('Имя пользователя уже занято');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      BCRYPT_SALT_ROUNDS,
    );

    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const result: any = { ...savedUser };
    delete result.password;

    this.logger.log(`New user registered: ${savedUser.email}`);

    return result;
  }
}
