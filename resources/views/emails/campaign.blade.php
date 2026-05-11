<x-mail::message>
# {{ $campaign->subject }}

{!! $campaign->body !!}

---
You're receiving this because you follow {{ $campaign->user?->first_name ?? $campaign->organization?->name }}.

<x-mail::button :url="url('/settings/notifications')">
Manage your subscription
</x-mail::button>

@if ($recipient->unsubscribe_token)
[Unsubscribe from campaigns]({{ route('unsubscribe.show', ['token' => $recipient->unsubscribe_token, 'type' => 'campaigns']) }})
@endif

@if (!empty($trackingToken))
<img src="{{ route('campaigns.track.open', ['token' => $trackingToken]) }}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
@endif
</x-mail::message>
