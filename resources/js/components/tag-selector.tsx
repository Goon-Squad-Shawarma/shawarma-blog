import { useCallback, useState } from 'react'

import MultipleSelector, { type Option } from '@/components/ui/multiselect'

interface Tag {
    id: number
    name: string
    slug: string
}

interface TagSelectorProps {
    value: number[]
    onChange: (tagIds: number[]) => void
    defaultTags?: Tag[]
    placeholder?: string
}

function getCsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : ''
}

function tagToOption(tag: Tag): Option {
    return {
        value: tag.name,
        label: tag.name,
        tagId: String(tag.id),
    }
}

export default function TagSelector({ value, onChange, defaultTags = [], placeholder = 'Search or create tags…' }: TagSelectorProps) {
    const [selected, setSelected] = useState<Option[]>(() => defaultTags.filter((t) => value.includes(t.id)).map(tagToOption))

    const searchTags = useCallback(async (query: string): Promise<Option[]> => {
        const url = query ? `/tags/search?q=${encodeURIComponent(query)}` : '/tags/search'
        const res = await fetch(url, { credentials: 'include' })
        if (!res.ok) return []
        const tags: Tag[] = await res.json()
        return tags.map(tagToOption)
    }, [])

    const handleChange = useCallback(
        async (options: Option[]) => {
            const resolved: Option[] = []
            const ids: number[] = []

            for (const option of options) {
                if (option.tagId) {
                    resolved.push(option)
                    ids.push(Number(option.tagId))
                } else {
                    // New tag typed by the user — persist it first
                    const res = await fetch('/tags', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': getCsrfToken(),
                            Accept: 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ name: option.value }),
                    })
                    if (res.ok) {
                        const tag: Tag = await res.json()
                        resolved.push(tagToOption(tag))
                        ids.push(tag.id)
                    }
                }
            }

            setSelected(resolved)
            onChange(ids)
        },
        [onChange],
    )

    return (
        <MultipleSelector
            value={selected}
            onSearch={searchTags}
            onChange={handleChange}
            creatable
            triggerSearchOnFocus
            placeholder={placeholder}
            hidePlaceholderWhenSelected
            delay={300}
            commandProps={{ label: 'Select tags' }}
            selectFirstItem={false}
        />
    )
}
