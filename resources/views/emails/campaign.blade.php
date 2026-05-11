<x-mail::message>
# {{ $campaign->subject }}

{!! $campaign->body !!}

---
You're receiving this because you follow {{ $campaign->user?->first_name ?? $campaign->organization?->name }}.

<x-mail::button :url="url('/settings/profile')">
Manage your subscription
</x-mail::button>
</x-mail::message>
