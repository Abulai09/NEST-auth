import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getAll() {
    try {
      return await this.userRepo.find();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async update(dto: any, userId: number) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Not found:(');

      Object.assign(user, dto);
      await this.userRepo.save(user);

      return user;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async delete(userId: number) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Not found:(');

      await this.userRepo.remove(user);
      return { message: 'Deleted successfully' };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }
}
