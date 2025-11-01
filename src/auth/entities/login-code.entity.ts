import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('login_codes')
export class LoginCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  code: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
