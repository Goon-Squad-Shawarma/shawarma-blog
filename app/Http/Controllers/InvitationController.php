<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use OffloadProject\InviteOnly\Facades\InviteOnly;
use OffloadProject\InviteOnly\Models\Invitation;

class InvitationController extends Controller
{
    /**
     * Send an invitation to join the organization.
     */
    public function store(Request $request, Organization $organization): RedirectResponse
    {
        $this->authorize('addMember', $organization);

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|in:admin,editor,author',
        ]);

        if ($organization->users()->where('users.email', $validated['email'])->exists()) {
            return back()->withErrors(['email' => 'This user is already a member of this organization.']);
        }

        if ($organization->hasInvitationFor($validated['email'])) {
            return back()->withErrors(['email' => 'A pending invitation has already been sent to this email.']);
        }

        $organization->invite($validated['email'], [
            'role' => $validated['role'],
            'invited_by' => auth()->user(),
            'expires_at' => config('invite-only.expiration.enabled', true)
                ? Carbon::now()->addDays((int) config('invite-only.expiration.days', 7))
                : null,
        ]);

        return redirect()->route('organizations.show', $organization)->with('success', 'Invitation sent successfully.');
    }

    /**
     * Cancel a pending invitation.
     */
    public function cancel(Organization $organization, Invitation $invitation): RedirectResponse
    {
        $this->authorize('addMember', $organization);

        if (! $organization->invitations()->where('id', $invitation->id)->exists()) {
            abort(403);
        }

        InviteOnly::cancel($invitation);

        return redirect()->route('organizations.show', $organization)->with('success', 'Invitation cancelled.');
    }

    /**
     * Resend a pending invitation.
     */
    public function resend(Organization $organization, Invitation $invitation): RedirectResponse
    {
        $this->authorize('addMember', $organization);

        if (! $organization->invitations()->where('id', $invitation->id)->exists()) {
            abort(403);
        }

        InviteOnly::resend($invitation);

        return redirect()->route('organizations.show', $organization)->with('success', 'Invitation resent successfully.');
    }
}
