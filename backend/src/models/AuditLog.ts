import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  actorId!: number; // User ID of the actor

  @Column()
  action!: string; // e.g., 'LOGIN', 'PERMISSION_CHANGE', 'DATA_MUTATION'

  @Column('jsonb')
  details!: any; // Additional details about the event

  @Column()
  correlationId!: string; // Unique ID for correlating events

  @CreateDateColumn()
  timestamp!: Date;
}
