<?php

namespace App\Http\Controllers;

use App\Models\CampaignRecipient;
use Illuminate\Http\Response;

class CampaignTrackingController extends Controller
{
    /**
     * 1x1 transparent GIF pixel served for every open. Records the first open
     * timestamp on the recipient row and increments the campaign-level
     * opened_count exactly once per recipient.
     */
    public function open(string $token): Response
    {
        $recipient = CampaignRecipient::query()->where('token', $token)->first();

        if ($recipient) {
            $isFirstOpen = is_null($recipient->opened_at);

            $recipient->forceFill([
                'opened_at' => $recipient->opened_at ?? now(),
            ])->save();

            $recipient->increment('open_count');

            if ($isFirstOpen) {
                $recipient->campaign()->increment('opened_count');
            }
        }

        $pixel = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        return response($pixel, 200, [
            'Content-Type' => 'image/gif',
            'Content-Length' => (string) strlen($pixel),
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }
}
