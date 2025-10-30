import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { BusinessResponseDto } from '../dto/business-response.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { UserRole } from '../../../users/enums/user-role.enum';
import { BusinessMemberDto, CreateBusinessMemberDto, UpdateBusinessMemberDto } from '../dto/business-member.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@ApiTags('Businesses')
@Controller('businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Create a new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully', type: BusinessResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Req() req, @Body() createBusinessDto: CreateBusinessDto): Promise<BusinessResponseDto> {
    return this.businessService.create(req.user.id, createBusinessDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of businesses', type: [BusinessResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Req() req, @Query() paginationDto: PaginationDto): Promise<BusinessResponseDto[]> {
    return this.businessService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business by ID' })
  @ApiResponse({ status: 200, description: 'Business found', type: BusinessResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  findOne(@Req() req, @Param('id', ParseUUIDPipe) id: string): Promise<BusinessResponseDto> {
    return this.businessService.findOne(id, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update a business' })
  @ApiResponse({ status: 200, description: 'Business updated', type: BusinessResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
  ): Promise<BusinessResponseDto> {
    return this.businessService.update(id, req.user.id, updateBusinessDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Delete a business' })
  @ApiResponse({ status: 200, description: 'Business deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.businessService.remove(id, req.user.id);
  }

  // Business Member Endpoints
  @Post(':id/members')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Add a member to a business' })
  @ApiResponse({ status: 201, description: 'Member added', type: BusinessMemberDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  addMember(
    @Req() req,
    @Param('id', ParseUUIDPipe) businessId: string,
    @Body() createMemberDto: CreateBusinessMemberDto,
  ): Promise<BusinessMemberDto> {
    return this.businessService.addMember(businessId, req.user.id, createMemberDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get all members of a business' })
  @ApiResponse({ status: 200, description: 'List of members', type: [BusinessMemberDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  getMembers(
    @Req() req,
    @Param('id', ParseUUIDPipe) businessId: string,
  ): Promise<BusinessMemberDto[]> {
    return this.businessService.getMembers(businessId, req.user.id);
  }

  @Put('members/:memberId')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Update a business member' })
  @ApiResponse({ status: 200, description: 'Member updated', type: BusinessMemberDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateMember(
    @Req() req,
    @Param('id', ParseUUIDPipe) businessId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() updateMemberDto: UpdateBusinessMemberDto,
  ): Promise<BusinessMemberDto> {
    return this.businessService.updateMember(businessId, memberId, req.user.id, updateMemberDto);
  }

  @Delete('members/:memberId')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Remove a member from a business' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  removeMember(
    @Req() req,
    @Param('id', ParseUUIDPipe) businessId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    return this.businessService.removeMember(businessId, memberId, req.user.id);
  }
}
