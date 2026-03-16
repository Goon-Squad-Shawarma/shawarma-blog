import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import Navbar from '@/components/navbar';
import ErrorToast from '@/components/error-toast';
import SuccessToast from '@/components/success-toast';
import WarningToast from '@/components/warning-toast';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    showSearch = false,
}: AppLayoutProps) {
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) {
            toast.custom(() => <SuccessToast message={flash.success!} />);
        }
        if (flash?.error) {
            toast.custom(() => <ErrorToast message={flash.error!} />);
        }
        if (flash?.warning) {
            toast.custom(() => <WarningToast message={flash.warning!} />);
        }
    }, [flash?.success, flash?.error, flash?.warning]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <Navbar breadcrumbs={breadcrumbs} showSearch={showSearch} />
                {children}
            </AppContent>
        </AppShell>
    );
}
