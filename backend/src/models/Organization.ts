import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../User';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  billingPlan!: string; // e.g., 'free', 'pro', 'enterprise'

  @OneToMany(() => User, (user) => user.organization)
  users!: User[];
}
