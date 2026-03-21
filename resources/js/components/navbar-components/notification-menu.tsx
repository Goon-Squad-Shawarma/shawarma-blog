import { Inbox, Notifications, useCounts } from "@novu/react";
import * as themes from "@novu/react/themes";
import { usePage } from "@inertiajs/react";
import { BellIcon } from "lucide-react";

import { useAppearance } from "@/hooks/use-appearance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function NotificationBell() {
  const { counts } = useCounts({
    filters: [{ read: false }],
  });

  const unreadCount = counts?.[0]?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Open notifications"
          className="relative size-8 rounded-full text-muted-foreground shadow-none"
          size="icon"
          variant="ghost"
        >
          <BellIcon aria-hidden="true" size={16} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="h-[600px] w-96 overflow-hidden p-0" style={{ zIndex: 9999 }}>
        <Notifications />
      </PopoverContent>
    </Popover>
  );
}

export default function NotificationMenu() {
  const { auth } = usePage().props;
  const { resolvedAppearance } = useAppearance();

  if (!auth.user) {
    return null;
  }

  const isDark = resolvedAppearance === "dark";

  return (
    <Inbox
      applicationIdentifier={import.meta.env.VITE_NOVU_APPLICATION_IDENTIFIER ?? ""}
      subscriberId={auth.user.uuid as string}
      appearance={isDark ? { baseTheme: [themes.dark] } : undefined}
    >
      <NotificationBell />
    </Inbox>
  );
}
