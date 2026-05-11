<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnsubscribeController extends Controller
{
    public function show(Request $request, string $token): Response
    {
        $user = User::query()->where('unsubscribe_token', $token)->firstOrFail();
        $type = $request->string('type')->toString() ?: 'all';

        return Inertia::render('unsubscribe', [
            'email' => $user->email,
            'type' => $type,
            'token' => $token,
        ]);
    }

    public function update(Request $request, string $token): RedirectResponse
    {
        $user = User::query()->where('unsubscribe_token', $token)->firstOrFail();

        $type = $request->validate([
            'type' => 'required|string|in:campaigns,daily_digest,all',
        ])['type'];

        $prefs = $user->effectiveEmailPreferences();

        if ($type === 'campaigns' || $type === 'all') {
            $prefs['campaigns'] = false;
        }
        if ($type === 'daily_digest' || $type === 'all') {
            $prefs['daily_digest'] = false;
            $prefs['digest_frequency'] = 'off';
        }

        $user->forceFill(['email_preferences' => $prefs])->save();

        return redirect()->route('unsubscribe.show', ['token' => $token, 'type' => $type])
            ->with('success', 'You have been unsubscribed.');
    }
}
