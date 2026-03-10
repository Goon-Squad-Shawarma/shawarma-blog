<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Enums\OrganizationRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    /**
     * Display a listing of organizations.
     */
    public function index()
    {
        $organizations = Organization::with('owner', 'users')
            ->latest()
            ->paginate(12);

        return Inertia::render('organizations/index', [
            'organizations' => $organizations,
        ]);
    }

    /**
     * Show the form for creating a new organization.
     */
    public function create()
    {
        $this->authorize('create', Organization::class);

        return Inertia::render('organizations/create');
    }

    /**
     * Store a newly created organization in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Organization::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'logo_url' => 'nullable|url',
        ]);

        $organization = auth()->user()->ownedOrganizations()->create($validated);

        // Add owner as ADMIN member
        $organization->users()->attach(auth()->id(), ['role' => OrganizationRole::ADMIN->value]);

        return redirect()->route('organizations.show', $organization)->with('success', 'Organization created successfully.');
    }

    /**
     * Display the specified organization.
     */
    public function show(Organization $organization)
    {
        $organization->load('owner', 'users', 'blogs');

        $isMember = auth()->check() ? $organization->users()->where('user_id', auth()->id())->exists() : false;
        $userRole = auth()->check() ? $organization->users()->where('user_id', auth()->id())->first()?->pivot?->role : null;

        return Inertia::render('organizations/show', [
            'organization' => $organization,
            'isMember' => $isMember,
            'userRole' => $userRole,
            'canUpdate' => auth()->check() && auth()->user()->can('update', $organization),
            'canDelete' => auth()->check() && auth()->user()->can('delete', $organization),
            'canAddMembers' => auth()->check() && auth()->user()->can('addMember', $organization),
        ]);
    }

    /**
     * Show the form for editing the specified organization.
     */
    public function edit(Organization $organization)
    {
        $this->authorize('update', $organization);

        return Inertia::render('organizations/edit', [
            'organization' => $organization,
        ]);
    }

    /**
     * Update the specified organization in storage.
     */
    public function update(Request $request, Organization $organization)
    {
        $this->authorize('update', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'logo_url' => 'nullable|url',
        ]);

        $organization->update($validated);

        return redirect()->route('organizations.show', $organization)->with('success', 'Organization updated successfully.');
    }

    /**
     * Delete the specified organization.
     */
    public function destroy(Organization $organization)
    {
        $this->authorize('delete', $organization);

        $organization->delete();

        return redirect()->route('organizations.index')->with('success', 'Organization deleted successfully.');
    }

    /**
     * Add a member to the organization.
     */
    public function addMember(Request $request, Organization $organization)
    {
        $this->authorize('addMember', $organization);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:admin,editor,author',
        ]);

        $organization->users()->syncWithoutDetaching([
            $validated['user_id'] => ['role' => $validated['role']],
        ]);

        return redirect()->route('organizations.show', $organization)->with('success', 'Member added successfully.');
    }

    /**
     * Remove a member from the organization.
     */
    public function removeMember(Request $request, Organization $organization)
    {
        $this->authorize('removeMember', $organization);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $organization->users()->detach($validated['user_id']);

        return redirect()->route('organizations.show', $organization)->with('success', 'Member removed successfully.');
    }

    /**
     * Update a member's role.
     */
    public function updateMemberRole(Request $request, Organization $organization)
    {
        $this->authorize('updateMemberRole', $organization);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:admin,editor,author',
        ]);

        $organization->users()->updateExistingPivot($validated['user_id'], ['role' => $validated['role']]);

        return redirect()->route('organizations.show', $organization)->with('success', 'Member role updated successfully.');
    }
}
