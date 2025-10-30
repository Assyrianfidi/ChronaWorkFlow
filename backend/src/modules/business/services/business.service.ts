import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { BusinessResponseDto } from '../dto/business-response.dto';
import { BusinessMemberDto, CreateBusinessMemberDto, UpdateBusinessMemberDto } from '../dto/business-member.dto';

@Injectable()
export class BusinessService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createBusinessDto: CreateBusinessDto): Promise<BusinessResponseDto> {
    return this.prisma.$transaction(async (prisma) => {
      // Create the business
      const business = await prisma.business.create({
        data: {
          ...createBusinessDto,
          ownerId,
          members: {
            create: {
              userId: ownerId,
              role: 'owner',
            },
          },
        },
      });

      return business;
    });
  }

  async findAll(userId: string): Promise<BusinessResponseDto[]> {
    const memberships = await this.prisma.businessMember.findMany({
      where: { userId },
      include: {
        business: true,
      },
    });

    return memberships.map((membership) => membership.business);
  }

  async findOne(id: string, userId: string): Promise<BusinessResponseDto> {
    // Check if user has access to this business
    const membership = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: id,
        },
      },
      include: {
        business: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Business not found or access denied');
    }

    return membership.business;
  }

  async update(
    id: string,
    userId: string,
    updateBusinessDto: UpdateBusinessDto,
  ): Promise<BusinessResponseDto> {
    // Check if user is the owner or admin of the business
    const membership = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: id,
        },
      },
    });

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new ForbiddenException('You do not have permission to update this business');
    }

    return this.prisma.business.update({
      where: { id },
      data: updateBusinessDto,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    // Only the owner can delete the business
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!business || business.members.length === 0 || business.members[0].role !== 'owner') {
      throw new ForbiddenException('Only the business owner can delete the business');
    }

    // Soft delete the business
    await this.prisma.business.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Business Member Management
  async addMember(
    businessId: string,
    userId: string,
    createMemberDto: CreateBusinessMemberDto,
  ): Promise<BusinessMemberDto> {
    // Check if the requesting user is an admin or owner
    const requesterMembership = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId: createMemberDto.userId,
          businessId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this business');
    }

    return this.prisma.businessMember.create({
      data: {
        userId: createMemberDto.userId,
        businessId,
        role: createMemberDto.role,
      },
    });
  }

  async updateMember(
    businessId: string,
    memberId: string,
    userId: string,
    updateMemberDto: UpdateBusinessMemberDto,
  ): Promise<BusinessMemberDto> {
    // Check if the requesting user is an admin or owner
    const requesterMembership = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new ForbiddenException('You do not have permission to update members');
    }

    // Prevent changing owner role unless it's the owner
    const targetMembership = await this.prisma.businessMember.findUnique({
      where: { id: memberId },
    });

    if (targetMembership?.role === 'owner' && requesterMembership.role !== 'owner') {
      throw new ForbiddenException('Only the owner can update owner permissions');
    }

    // Prevent changing the last owner
    if (updateMemberDto.role !== 'owner' && targetMembership?.role === 'owner') {
      const ownerCount = await this.prisma.businessMember.count({
        where: {
          businessId,
          role: 'owner',
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner of the business');
      }
    }

    return this.prisma.businessMember.update({
      where: { id: memberId },
      data: updateMemberDto,
    });
  }

  async removeMember(businessId: string, memberId: string, userId: string): Promise<void> {
    // Check if the requesting user is an admin or owner
    const requesterMembership = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    // Prevent removing self if you're the only admin/owner
    if (memberId === requesterMembership.id) {
      const adminCount = await this.prisma.businessMember.count({
        where: {
          businessId,
          role: {
            in: ['owner', 'admin'],
          },
        },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot remove the last admin/owner of the business');
      }
    }

    // Prevent removing the last owner
    const targetMembership = await this.prisma.businessMember.findUnique({
      where: { id: memberId },
    });

    if (targetMembership?.role === 'owner') {
      const ownerCount = await this.prisma.businessMember.count({
        where: {
          businessId,
          role: 'owner',
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner of the business');
      }
    }

    await this.prisma.businessMember.delete({
      where: { id: memberId },
    });
  }

  async getMembers(businessId: string, userId: string): Promise<BusinessMemberDto[]> {
    // Check if user has access to this business
    const membership = await this.prisma.businessMember.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Business not found or access denied');
    }

    return this.prisma.businessMember.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
