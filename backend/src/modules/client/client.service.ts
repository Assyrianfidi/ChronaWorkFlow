import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createClientDto: CreateClientDto): Promise<Client> {
    // Check if the user has access to the specified business
    await this.verifyBusinessAccess(userId, createClientDto.businessId);

    return this.prisma.client.create({
      data: createClientDto,
    });
  }

  async findAll(
    userId: string,
    businessId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: Client[]; total: number }> {
    // Check if the user has access to the specified business
    await this.verifyBusinessAccess(userId, businessId);

    const skip = (page - 1) * limit;
    const where = {
      businessId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(userId: string, id: string): Promise<Client> {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // Check if the user has access to the client's business
    await this.verifyBusinessAccess(userId, client.businessId);

    return client;
  }

  async update(
    userId: string,
    id: string,
    updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    // First get the client to check business access
    const existingClient = await this.findOne(userId, id);

    return this.prisma.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    // First get the client to check business access
    const client = await this.findOne(userId, id);

    await this.prisma.client.delete({
      where: { id: client.id },
    });
  }

  private async verifyBusinessAccess(userId: string, businessId: string): Promise<void> {
    const membership = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this business');
    }
  }
}
