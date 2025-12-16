import { IUserRole } from "@/mongodb/models/userModel";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            surname: string;
            role: IUserRole;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        surname: string;
        role: IUserRole;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        email: string;
        name: string;
        surname: string;
        role: IUserRole;
    }
}
