<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    /**
     * Search tags by name.
     */
    public function search(Request $request): JsonResponse
    {
        $tags = Tag::when(
            $request->filled('q'),
            fn ($query) => $query->where('name', 'like', '%'.$request->string('q').'%')
        )
            ->orderBy('name')
            ->limit(20)
            ->get(['id', 'name', 'slug']);

        return response()->json($tags);
    }

    /**
     * Create a new tag, or return the existing one if the slug already exists.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $slug = Str::slug($validated['name']);

        $tag = Tag::firstOrCreate(
            ['slug' => $slug],
            ['name' => $validated['name']]
        );

        return response()->json($tag, $tag->wasRecentlyCreated ? 201 : 200);
    }
}
