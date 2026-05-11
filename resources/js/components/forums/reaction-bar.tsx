import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';

interface Reaction {
    id: number;
    user_id: number;
    emoji: string;
    reactable_id: number;
    reactable_type: string;
}

interface ReactionBarProps {
    type: 'thread' | 'reply';
    id: number;
    reactions: Reaction[];
    currentUserId: number | null;
}

const EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '😢'];

function getCsrf(): string {
    const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

export function ReactionBar({ type, id, reactions: initial, currentUserId }: ReactionBarProps) {
    const [reactions, setReactions] = useState<Reaction[]>(initial);
    const [pickerOpen, setPickerOpen] = useState(false);

    const grouped = useMemo(() => {
        const map = new Map<string, { count: number; mine: boolean }>();
        reactions.forEach((r) => {
            const cur = map.get(r.emoji) ?? { count: 0, mine: false };
            cur.count += 1;
            if (currentUserId && r.user_id === currentUserId) cur.mine = true;
            map.set(r.emoji, cur);
        });
        return Array.from(map.entries());
    }, [reactions, currentUserId]);

    const toggle = async (emoji: string) => {
        if (!currentUserId) {
            router.visit('/login');
            return;
        }
        // optimistic
        const prev = reactions;
        const mine = reactions.find((r) => r.emoji === emoji && r.user_id === currentUserId);
        let next: Reaction[];
        if (mine) {
            next = reactions.filter((r) => r !== mine);
        } else {
            next = [
                ...reactions,
                { id: Math.random(), user_id: currentUserId, emoji, reactable_id: id, reactable_type: type },
            ];
        }
        setReactions(next);
        setPickerOpen(false);

        try {
            const res = await fetch('/forums/reactions', {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': getCsrf(),
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ type, id, emoji }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setReactions(prev);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {grouped.map(([emoji, { count, mine }]) => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => toggle(emoji)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                        mine ? 'border-primary/60 bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                >
                    <span>{emoji}</span>
                    <span>{count}</span>
                </button>
            ))}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setPickerOpen((o) => !o)}
                    className="inline-flex size-7 items-center justify-center rounded-full border text-sm hover:bg-muted"
                    aria-label="Add reaction"
                >
                    🙂
                </button>
                {pickerOpen && (
                    <div className="absolute left-0 top-9 z-10 flex gap-1 rounded-md border bg-popover p-1.5 shadow-md">
                        {EMOJIS.map((e) => (
                            <button
                                key={e}
                                type="button"
                                onClick={() => toggle(e)}
                                className="size-7 rounded text-lg hover:bg-muted"
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
