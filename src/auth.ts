import NextAuth, { CredentialsSignin, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";
import { IUserRole, UserModel } from "./mongodb/models/userModel";
import { connectDB } from "./mongodb/connect";

class UserBlockedError extends CredentialsSignin {
    code = "user_blocked";
}

export const {
    auth,
    handlers: { GET, POST },
    signIn,
    signOut,
} = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                await connectDB();

                const user = await UserModel.findOne({ email: credentials.email }).lean();

                if (!user) return null;

                if (user.is_blocked) throw new UserBlockedError();

                const isValid = await bcrypt.compare(credentials.password as string, user.password);

                if (!isValid) return null;

                return {
                    id: user._id!.toString(),
                    email: user.email,
                    name: user.name,
                    surname: user.surname,
                    role: user.role || "user",
                } as User;
            },
        }),
    ],
    trustHost: true, //!Дает авторизироваться не только c HTTPS

    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.surname = user.surname;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email!;
                session.user.name = token.name!;
                session.user.surname = token.surname as string;
                session.user.role = token.role as IUserRole;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
});
