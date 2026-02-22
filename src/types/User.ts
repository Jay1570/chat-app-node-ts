export type User = {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    password: string;
    createdAt: Date;
    updatedAt: Date;
};

export type JwtUserPayload = Pick<User, "id">;

export type UserWithoutPassword = Omit<User, "password">;

export type RegisterUserPayload = Pick<User, "name" | "email" | "password">;

export type LoginPayload = Pick<User, "email" | "password">;
