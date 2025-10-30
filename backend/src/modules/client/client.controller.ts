import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@ApiTags('clients')
@Controller('api/v1/clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully', type: Client })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Req() req, @Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientService.create(req.user.id, createClientDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.ACCOUNTANT, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get all clients for a business' })
  @ApiQuery({ name: 'businessId', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of clients', type: [Client] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Req() req,
    @Query('businessId') businessId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.clientService.findAll(req.user.id, businessId, page, limit, search);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.ACCOUNTANT, UserRole.MEMBER)
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiResponse({ status: 200, description: 'Client found', type: Client })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  findOne(@Req() req, @Param('id') id: string): Promise<Client> {
    return this.clientService.findOne(req.user.id, id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: 200, description: 'Client updated', type: Client })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientService.update(req.user.id, id, updateClientDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BUSINESS_OWNER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: 200, description: 'Client deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  remove(@Req() req, @Param('id') id: string): Promise<void> {
    return this.clientService.remove(req.user.id, id);
  }
}
