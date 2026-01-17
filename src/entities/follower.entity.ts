import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Unique('uq_followers_follower_following', ['followerId', 'followingId'])
@Entity('followers')
export class Follower {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'follower_id' })
  followerId: number;

  @Index()
  @Column({ name: 'following_id' })
  followingId: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  followerUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  followingUser: User;
}
