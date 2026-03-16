import { Link } from '@inertiajs/react';
import { Rss } from 'lucide-react';
import type { AuthLayoutProps } from '@/types';
import { home } from '@/routes';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh">
            {/* Branded left panel — hidden on mobile */}
            <div className="relative hidden flex-col justify-between bg-muted p-10 lg:flex lg:w-[45%]">
                <Link href={home()} className="flex items-center gap-2 font-semibold text-foreground">
                    <Rss className="h-5 w-5 text-primary" />
                    Shawarma Blog
                </Link>

                <blockquote className="space-y-2">
                    <p className="text-lg leading-relaxed">
                        "Writing is thinking. To write well is to think clearly. That's why it's so hard."
                    </p>
                    <footer className="text-sm text-muted-foreground">— David McCullough</footer>
                </blockquote>

                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Shawarma Blog
                </p>
            </div>

            {/* Form right panel */}
            <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-12">
                {/* Mobile logo */}
                <Link href={home()} className="mb-8 flex items-center gap-2 font-semibold lg:hidden">
                    <Rss className="h-5 w-5 text-primary" />
                    Shawarma Blog
                </Link>

                <div className="w-full max-w-sm">
                    <div className="mb-8 space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
