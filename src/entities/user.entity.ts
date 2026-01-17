import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
