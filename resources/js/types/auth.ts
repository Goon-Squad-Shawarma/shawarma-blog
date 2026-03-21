export type User = {
    id: number;
    uuid: string;
    first_name: string;
    last_name: string;
    username: string | null;
    email: string;
    avatar_url?: string | null;
    background_url?: string | null;
    website?: string | null;
    bio?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Organization = {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
};

export type Auth = {
    user: User;
    organizations: Organization[];
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
