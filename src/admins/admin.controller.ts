// admin.controller.ts
import { Controller, Post, Delete, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createAdmin(
    @Body('admin_fname') admin_fname: string,
    @Body('admin_lname') admin_lname: string,
    @Body('admin_username') admin_username: string,
    @Body('admin_password') admin_password: string,
  ) {
    return this.adminService.createAdmin(
      admin_fname,
      admin_lname,
      admin_username,
      admin_password
    );
  }

  @Delete(':id')
  async deleteAdmin(@Param('id') admin_id: number) {
    await this.adminService.deleteAdmin(admin_id);
    return { message: 'Admin deleted successfully' };
  }
}