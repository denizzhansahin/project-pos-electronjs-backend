import { ColdObservable } from "rxjs/internal/testing/ColdObservable";
import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";


import * as bcrypt from "bcrypt"
import { Role } from "src/auth/enums/role.enum";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    email: string

    @Column({ default: "/" })
    avatarUrl: string

    @CreateDateColumn()
    createdAt: Date

    @Column()
    //@JoinColumn()
    password: string

    @Column({
        type: 'text',//enum olmadı
        enum: Role,
        default: Role.USER
    })
    role: Role



    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10)
    }

    @Column({ nullable: true})
    hashedRefreshToken: string;
}