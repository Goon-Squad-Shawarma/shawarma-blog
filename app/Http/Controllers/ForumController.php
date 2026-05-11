<?php

namespace App\Http\Controllers;

use App\Models\Thread;
use App\Models\ThreadReaction;
use App\Models\ThreadReply;
use App\Models\ThreadVote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ForumController extends Controller
{
    private const CATEGORIES = ['everything', 'questions', 'feedback', 'bounties', 'community'];

    public function index(Request $request): Response
    {
        $category = $request->string('category')->toString();
        $sort = $request->string('sort', 'recent')->toString();

        $query = Thread::query()
            ->with(['user:id,first_name,last_name,avatar_url'])
            ->withCount('replies');

        if ($category && $category !== 'everything' && in_array($category, self::CATEGORIES, true)) {
            $query->where('category', $category);
        }

        match ($sort) {
            'top' => $query->orderByDesc('upvotes_count')->orderByDesc('created_at'),
            'replies' => $query->orderByDesc('replies_count')->orderByDesc('created_at'),
            default => $query->latest(),
        };

        $threads = $query->paginate(15)->withQueryString();

        if (auth()->check()) {
            $votedIds = ThreadVote::query()
                ->where('user_id', auth()->id())
                ->whereIn('thread_id', $threads->getCollection()->pluck('id'))
                ->pluck('thread_id')
                ->all();

            $threads->getCollection()->transform(function (Thread $thread) use ($votedIds) {
                $thread->setAttribute('voted', in_array($thread->id, $votedIds, true));

                return $thread;
            });
        }

        return Inertia::render('forums/index', [
            'threads' => $threads,
            'filters' => [
                'category' => $category ?: 'everything',
                'sort' => $sort,
            ],
            'categories' => self::CATEGORIES,
        ]);
    }

    public function show(Thread $thread): Response
    {
        $thread->load([
            'user:id,first_name,last_name,avatar_url',
            'replies' => fn ($q) => $q->latest(),
            'replies.user:id,first_name,last_name,avatar_url',
            'reactions:id,reactable_id,reactable_type,user_id,emoji',
            'replies.reactions:id,reactable_id,reactable_type,user_id,emoji',
        ]);

        $userId = auth()->id();

        $voted = $userId && ThreadVote::query()
            ->where('user_id', $userId)
            ->where('thread_id', $thread->id)
            ->exists();

        return Inertia::render('forums/show', [
            'thread' => $thread,
            'voted' => (bool) $voted,
            'currentUserId' => $userId,
            'canReply' => auth()->check(),
            'canDelete' => auth()->check() && auth()->user()->can('delete', $thread),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Thread::class);

        $data = $request->validate([
            'title' => 'required|string|min:5|max:255',
            'body' => 'required|string|min:10|max:10000',
            'category' => 'nullable|string|in:'.implode(',', self::CATEGORIES),
            'image' => 'nullable|image|max:5120',
        ]);

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('forums', ['disk' => 's3']);
            $imageUrl = Storage::disk('s3')->url($path);
        }

        $thread = auth()->user()->threads()->create([
            'title' => $data['title'],
            'body' => $data['body'],
            'category' => ($data['category'] ?? null) === 'everything' ? 'community' : ($data['category'] ?? 'community'),
            'image_url' => $imageUrl,
            'status' => 'open',
        ]);

        return redirect()->route('forums.show', $thread)->with('success', 'Thread created.');
    }

    public function storeReply(Request $request, Thread $thread): RedirectResponse
    {
        abort_unless(auth()->check(), 401);

        $data = $request->validate([
            'body' => 'required|string|min:1|max:5000',
            'image' => 'nullable|image|max:5120',
        ]);

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('forums', ['disk' => 's3']);
            $imageUrl = Storage::disk('s3')->url($path);
        }

        ThreadReply::create([
            'thread_id' => $thread->id,
            'user_id' => auth()->id(),
            'body' => $data['body'],
            'image_url' => $imageUrl,
        ]);

        return redirect()->route('forums.show', $thread);
    }

    public function destroy(Thread $thread): RedirectResponse
    {
        $this->authorize('delete', $thread);
        $thread->delete();

        return redirect()->route('forums.index')->with('success', 'Thread deleted.');
    }

    public function toggleVote(Thread $thread): JsonResponse
    {
        abort_unless(auth()->check(), 401);

        $userId = auth()->id();

        $voted = DB::transaction(function () use ($thread, $userId): bool {
            $existing = ThreadVote::query()
                ->where('user_id', $userId)
                ->where('thread_id', $thread->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                $existing->delete();
                $thread->decrement('upvotes_count');

                return false;
            }

            ThreadVote::create([
                'user_id' => $userId,
                'thread_id' => $thread->id,
            ]);
            $thread->increment('upvotes_count');

            return true;
        });

        return response()->json([
            'voted' => $voted,
            'upvotes_count' => $thread->fresh()->upvotes_count,
        ]);
    }

    public function toggleReaction(Request $request): JsonResponse
    {
        abort_unless(auth()->check(), 401);

        $data = $request->validate([
            'type' => 'required|string|in:thread,reply',
            'id' => 'required|integer',
            'emoji' => 'required|string|max:8',
        ]);

        $modelClass = $data['type'] === 'thread' ? Thread::class : ThreadReply::class;
        $reactable = $modelClass::query()->findOrFail($data['id']);

        $existing = ThreadReaction::query()
            ->where('user_id', auth()->id())
            ->where('reactable_type', $modelClass)
            ->where('reactable_id', $reactable->id)
            ->where('emoji', $data['emoji'])
            ->first();

        if ($existing) {
            $existing->delete();
            $reacted = false;
        } else {
            ThreadReaction::create([
                'user_id' => auth()->id(),
                'reactable_type' => $modelClass,
                'reactable_id' => $reactable->id,
                'emoji' => $data['emoji'],
            ]);
            $reacted = true;
        }

        return response()->json([
            'reacted' => $reacted,
            'emoji' => $data['emoji'],
        ]);
    }
}
