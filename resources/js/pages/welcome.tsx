import { Head, usePage } from '@inertiajs/react';
import { ShaderBackground, SiteHeader, HeroContent, PulsingCircle } from '@/components/ui/shaders-hero-section';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="Shawarma Blog — Share your story" />
            <ShaderBackground>
                <SiteHeader auth={auth} canRegister={canRegister} />
                <HeroContent auth={auth} canRegister={canRegister} />
                <PulsingCircle />
            </ShaderBackground>
        </>
    );
}
