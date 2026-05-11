<?php

namespace App\Http\Controllers;

use App\Ai\Agents\BlogDraftAgent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function draft(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => ['required', 'string', 'max:500'],
            'outline' => ['nullable', 'string', 'max:2000'],
        ]);

        $response = (new BlogDraftAgent(
            topic: $validated['topic'],
            outline: $validated['outline'] ?? null,
        ))->prompt("Write a blog post about: {$validated['topic']}");

        return response()->json([
            'title' => $response['title'],
            'content' => $response['content'],
        ]);
    }
}
