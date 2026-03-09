import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(signupDto: SignupDto): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    }>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        createdAt: string;
    }>;
}
