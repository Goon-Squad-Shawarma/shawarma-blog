<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/notifications', [
            'preferences' => $request->user()->effectiveEmailPreferences(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'campaigns' => 'required|boolean',
            'daily_digest' => 'required|boolean',
            'digest_frequency' => 'required|string|in:daily,weekly,off',
        ]);

        /** @var User $user */
        $user = $request->user();
        $user->forceFill([
            'email_preferences' => array_merge($user->effectiveEmailPreferences(), $data),
        ])->save();

        return back();
    }
}
