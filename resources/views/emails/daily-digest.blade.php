<x-mail::message>
# Hi {{ $recipient->first_name }} 👋

Here's what **{{ $author->first_name }} {{ $author->last_name }}** has published recently:

@foreach ($blogs as $blog)
---
### [{{ $blog->title }}]({{ route('blogs.show', $blog) }})

@if ($blog->subtitle)
{{ $blog->subtitle }}
@endif

_{{ $blog->reading_time }} min read · {{ \Illuminate\Support\Carbon::parse($blog->published_at)->diffForHumans() }}_

<x-mail::button :url="route('blogs.show', $blog)">
Read post
</x-mail::button>
@endforeach

Thanks for reading,
{{ config('app.name') }}

@if ($recipient->unsubscribe_token)
---
[Manage email preferences]({{ url('/settings/notifications') }}) · [Unsubscribe from digests]({{ route('unsubscribe.show', ['token' => $recipient->unsubscribe_token, 'type' => 'daily_digest']) }})
@endif
</x-mail::message>
