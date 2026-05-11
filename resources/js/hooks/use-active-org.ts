import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

const STORAGE_KEY = 'active_org_id';

function readStored(): number | null {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function activeOrgIdFromUrl(url: string, ids: number[]): number | null {
    const match = url.match(/^\/organizations\/(\d+)(\/|$|\?)/);
    if (!match) return null;
    const id = Number(match[1]);
    return ids.includes(id) ? id : null;
}

/**
 * Determines the currently-active organization id with sticky behavior:
 * - If the URL is under /organizations/{id}/..., that id wins (and is persisted).
 * - Otherwise, fall back to the last persisted id (if user is still a member).
 * - Returns null when the user has explicitly switched to Personal or has no orgs.
 */
export function useActiveOrgId(): number | null {
    const page = usePage<SharedData>();
    const orgIds = (page.props.auth?.organizations ?? []).map((o) => o.id);
    const fromUrl = activeOrgIdFromUrl(page.url, orgIds);

    const [stickyId, setStickyId] = useState<number | null>(() => {
        const stored = readStored();
        if (stored && orgIds.includes(stored)) return stored;
        return null;
    });

    useEffect(() => {
        if (fromUrl !== null) {
            window.sessionStorage.setItem(STORAGE_KEY, String(fromUrl));
            setStickyId(fromUrl);
            return;
        }
        const stored = readStored();
        if (stored && orgIds.includes(stored)) {
            setStickyId(stored);
        } else {
            setStickyId(null);
        }
    }, [page.url, fromUrl, orgIds.join(',')]);

    return fromUrl ?? stickyId;
}

export function clearActiveOrg(): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(STORAGE_KEY);
}

export function setActiveOrg(id: number): void {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(STORAGE_KEY, String(id));
}
