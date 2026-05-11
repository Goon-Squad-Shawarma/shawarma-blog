export type Tag = {
    id: number;
    name: string;
    slug: string;
};

export type BlogView = {
    id: number;
    blog_id: number;
    user_id: number | null;
    ip_address: string | null;
    created_at: string;
};

export type Blog = {
    id: number;
    title: string;
    subtitle: string | null;
    slug: string;
    content: string;
    banner_url: string | null;
    reading_time: number;
    published_at: string | null;
    visibility: 'public' | 'private';
    user_id: number;
    organization_id: number | null;
    user?: User;
    organization?: Organization;
    tags?: Tag[];
    likes_count?: number;
    bookmarks_count?: number;
    views_count?: number;
    is_liked?: boolean;
    is_bookmarked?: boolean;
    created_at: string;
    updated_at: string;
};

export type Bookmark = {
    id: number;
    user_id: number;
    blog_id: number;
    blog?: Blog;
    created_at: string;
};

export type Campaign = {
    id: number;
    user_id: number | null;
    organization_id: number | null;
    subject: string;
    body: string;
    status: 'draft' | 'sending' | 'sent' | 'failed';
    recipient_count: number;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
    organization?: Organization;
};

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    username?: string;
    email?: string;
    avatar_url: string | null;
    bio?: string | null;
};

export type Organization = {
    id: number;
    name: string;
    slug: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};
