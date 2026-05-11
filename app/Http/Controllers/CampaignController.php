<?php

namespace App\Http\Controllers;

use App\Enums\CampaignStatus;
use App\Http\Requests\StoreCampaignRequest;
use App\Jobs\SendCampaignJob;
use App\Models\Campaign;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CampaignController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();

        $adminOrgIds = $user->organizations()
            ->wherePivot('role', 'admin')
            ->pluck('organizations.id');

        $campaigns = Campaign::where(function ($q) use ($user, $adminOrgIds) {
            $q->where('user_id', $user->id)
                ->orWhereIn('organization_id', $adminOrgIds);
        })
            ->with(['user', 'organization'])
            ->latest()
            ->paginate(15);

        $followerCount = $user->followers()->count();

        return Inertia::render('campaigns/index', [
            'campaigns' => $campaigns,
            'followerCount' => $followerCount,
        ]);
    }

    public function create()
    {
        $this->authorize('create', Campaign::class);

        $user = auth()->user();
        $followerCount = $user->followers()->count();
        $organizations = $user->organizations()
            ->wherePivotIn('role', ['admin'])
            ->get(['organizations.id', 'organizations.name']);

        return Inertia::render('campaigns/create', [
            'followerCount' => $followerCount,
            'organizations' => $organizations,
        ]);
    }

    public function store(StoreCampaignRequest $request)
    {
        $this->authorize('create', Campaign::class);

        $campaign = Campaign::create(array_merge(
            $request->validated(),
            [
                'user_id' => $request->has('organization_id') ? null : auth()->id(),
                'status' => CampaignStatus::Draft,
            ]
        ));

        if ($request->boolean('send_now')) {
            $this->authorize('send', $campaign);
            $campaign->update(['status' => CampaignStatus::Sending]);
            SendCampaignJob::dispatch($campaign)->onQueue('campaigns');

            return redirect()->route('campaigns.show', $campaign)->with('success', 'Campaign is being sent.');
        }

        return redirect()->route('campaigns.show', $campaign)->with('success', 'Campaign created as draft.');
    }

    public function show(Campaign $campaign)
    {
        $this->authorize('view', $campaign);

        return Inertia::render('campaigns/show', [
            'campaign' => $campaign->load('user', 'organization'),
        ]);
    }

    public function send(Campaign $campaign)
    {
        $this->authorize('send', $campaign);

        abort_if($campaign->status !== CampaignStatus::Draft, 422, 'Campaign already sent.');

        $campaign->update(['status' => CampaignStatus::Sending]);

        SendCampaignJob::dispatch($campaign)->onQueue('campaigns');

        return redirect()->route('campaigns.show', $campaign)->with('success', 'Campaign is being sent.');
    }

    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);

        $campaign->delete();

        return redirect()->route('campaigns.index')->with('success', 'Campaign deleted.');
    }
}
