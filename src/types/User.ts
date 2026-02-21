export type User = {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
    password: string;
};

export type JwtUserPayload = Pick<User, "id">;

export type UserWithoutPassword = Omit<User, "password">;
