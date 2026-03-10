// This component has to be adapted to our project

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useCompaniesStore } from "@/lib/stores/companies.store";
import type { UserCompany } from "@/lib/api/types";
import { toast } from "sonner";
import { CircleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { RiExpandUpDownLine, RiAddLine } from "@remixicon/react";

export function TeamSwitcher() {
  const { companyId, setAuth, updateUser } = useAuthStore();
  const { 
    companies, 
    isLoading, 
    setCompanies, 
    setLoading, 
  } = useCompaniesStore();
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  const activeCompany = React.useMemo(
    () => companies.find((c) => c.company_id === companyId),
    [companies, companyId]
  );

  // Only fetch companies when dropdown is opened and we don't have data yet
  const handleOpenChange = React.useCallback(async (open: boolean) => {
    setIsOpen(open);
    
    if (open && companies.length === 0 && !isLoading) {
      setLoading(true);
      try {
        const response = await authApi.getUserCompanies();
        setCompanies(response.companies);
        
        // Update user with avatar_url and full_name from response
        if (response.user) {
          updateUser({
            avatar_url: response.user.avatar_url,
            full_name: response.user.full_name,
          });
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        toast.custom(() => (
          <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600 bg-background shadow-lg">
            <p className="text-sm">
              <CircleAlert
                className="me-3 -mt-0.5 inline-flex opacity-60"
                size={16}
                aria-hidden="true"
              />
              Failed to load companies
            </p>
          </div>
        ));
      }
    }
  }, [companies.length, isLoading, setCompanies, setLoading, updateUser]);

  const handleSwitchCompany = async (company: UserCompany) => {
    if (company.company_id === companyId || isSwitching) return;

    setIsSwitching(true);
    try {
      const response = await authApi.switchCompany({
        company_id: company.company_id,
      });
      
      // Clear app stores to simulate a fresh login state
      if (typeof window !== "undefined") {
        import("@/lib/stores/dispatch.store").then(({ useDispatchStore }) => useDispatchStore.getState().reset());
        import("@/lib/stores/gross-board.store").then(({ useGrossBoardStore }) => {
          const store = useGrossBoardStore.getState();
          store.reset();
          // Trigger a refresh after reset so the dashboard loads new data if already on it
          store.refreshGrossBoard().catch(() => {});
        });
        import("@/lib/stores/email-nylas.store").then(({ useEmailNylasStore }) => useEmailNylasStore.getState().reset());
        import("@/lib/stores/email-threads.store").then(({ useEmailThreadsStore }) => useEmailThreadsStore.getState().reset());
        import("@/lib/stores/email-attributes.store").then(({ useEmailAttributesStore }) => useEmailAttributesStore.getState().reset());
        import("@/lib/stores/telegram-auth.store").then(({ useTelegramAuthStore }) => useTelegramAuthStore.getState().reset());
        import("@/lib/stores/telegram-dialogs.store").then(({ useTelegramDialogsStore }) => useTelegramDialogsStore.getState().reset());
        import("@/lib/stores/telegram-messages.store").then(({ useTelegramMessagesStore }) => useTelegramMessagesStore.getState().reset());
        import("@/lib/stores/telegram-attributes.store").then(({ useTelegramAttributesStore }) => useTelegramAttributesStore.getState().reset());
        import("@/lib/stores/integrations.store").then(({ useIntegrationsStore }) => useIntegrationsStore.getState().reset());
      }

      // Update auth store with new context
      setAuth(response);

      toast.custom(() => (
        <div className="rounded-md border border-emerald-500/50 px-4 py-3 text-emerald-600 bg-background shadow-lg">
          <p className="text-sm">
            Switched to {company.company_name}
          </p>
        </div>
      ));

      router.push("/");
    } catch (error) {
      console.error("Failed to switch company:", error);
      toast.custom(() => (
        <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600 bg-background shadow-lg">
          <p className="text-sm">
            <CircleAlert
              className="me-3 -mt-0.5 inline-flex opacity-60"
              size={16}
              aria-hidden="true"
            />
            Failed to switch company
          </p>
        </div>
      ));
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!companies.length) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-3 [&>svg]:size-auto"
              disabled={isSwitching}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground">
                <img
                  src={activeCompany?.logo_url || "/logos/comp-logo.png"}
                  width={36}
                  height={36}
                  alt={activeCompany?.company_name ?? "Company"}
                />
              </div>
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-medium">
                  {activeCompany?.company_name ?? "Select a Company"}
                </span>
              </div>
              <RiExpandUpDownLine
                className="ms-auto text-muted-foreground/60"
                size={20}
                aria-hidden="true"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="uppercase text-muted-foreground/60 text-xs">
              Companies
            </DropdownMenuLabel>
            {companies.map((company) => (
              <DropdownMenuItem
                key={company.company_id}
                onClick={() => handleSwitchCompany(company)}
                className="gap-2 p-2"
                disabled={company.company_id === companyId || isSwitching}
              >
                <div className="flex size-6 items-center justify-center rounded-md overflow-hidden">
                  <img
                    src={company.logo_url || "/logos/comp-logo.png"}
                    width={36}
                    height={36}
                    alt={company.company_name}
                  />
                </div>
                <span className="font-medium">{company.company_name}</span>
                {company.company_id === companyId && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}