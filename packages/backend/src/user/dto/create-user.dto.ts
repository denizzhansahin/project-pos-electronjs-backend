import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { Role } from "src/auth/enums/role.enum";

export class CreateUserDto {
    @IsString()
    firstName: string

    @IsString()
    lastName: string

    @IsString()
    @IsEmail()
    email: string

    @IsString()
    @IsUrl()
    @IsOptional()
    avatarUrl: string

    @IsString()
    password: string

    @IsEnum(Role) // Role enum'una uygunluğunu doğrular
    @IsNotEmpty()
    role: Role; // Yeni eklenen alan

}
