<?php

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use OffloadProject\InviteOnly\Enums\InvitationStatus;
use OffloadProject\InviteOnly\Events\InvitationAccepted;
use OffloadProject\InviteOnly\Models\Invitation;

test('admin can send invitation to organization', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();
    $organization->users()->attach($admin->id, ['role' => OrganizationRole::ADMIN->value]);

    $response = $this->actingAs($admin)
        ->post(route('organizations.invite', $organization), [
            'email' => 'newmember@example.com',
            'role' => 'editor',
        ]);

    $response->assertRedirect(route('organizations.show', $organization));

    $this->assertDatabaseHas('invitations', [
        'email' => 'newmember@example.com',
        'role' => 'editor',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending->value,
    ]);
});

test('non-admin cannot send invitation', function () {
    $owner = User::factory()->create();
    $editor = User::factory()->create();
    $organization = Organization::factory()->ownedBy($owner)->create();
    $organization->users()->attach($editor->id, ['role' => OrganizationRole::EDITOR->value]);

    $this->actingAs($editor)
        ->post(route('organizations.invite', $organization), [
            'email' => 'someone@example.com',
            'role' => 'author',
        ])
        ->assertForbidden();
});

test('cannot invite email that is already a member', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $existingMember = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();
    $organization->users()->attach($admin->id, ['role' => OrganizationRole::ADMIN->value]);
    $organization->users()->attach($existingMember->id, ['role' => OrganizationRole::AUTHOR->value]);

    $response = $this->actingAs($admin)
        ->post(route('organizations.invite', $organization), [
            'email' => $existingMember->email,
            'role' => 'author',
        ]);

    $response->assertSessionHasErrors('email');

    $this->assertDatabaseMissing('invitations', [
        'email' => $existingMember->email,
        'invitable_id' => $organization->id,
    ]);
});

test('cannot send duplicate pending invitation', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();
    $organization->users()->attach($admin->id, ['role' => OrganizationRole::ADMIN->value]);

    Invitation::factory()->create([
        'email' => 'pending@example.com',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('organizations.invite', $organization), [
            'email' => 'pending@example.com',
            'role' => 'author',
        ]);

    $response->assertSessionHasErrors('email');

    expect(
        Invitation::where('email', 'pending@example.com')
            ->where('invitable_id', $organization->id)
            ->count()
    )->toBe(1);
});

test('admin can cancel a pending invitation', function () {
    $admin = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();
    $organization->users()->attach($admin->id, ['role' => OrganizationRole::ADMIN->value]);

    $invitation = Invitation::factory()->create([
        'email' => 'invited@example.com',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->delete(route('organizations.invitation-cancel', [$organization, $invitation]))
        ->assertRedirect(route('organizations.show', $organization));

    $this->assertDatabaseHas('invitations', [
        'id' => $invitation->id,
        'status' => InvitationStatus::Cancelled->value,
    ]);
});

test('admin can resend a pending invitation', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();
    $organization->users()->attach($admin->id, ['role' => OrganizationRole::ADMIN->value]);

    $invitation = Invitation::factory()->create([
        'email' => 'invited@example.com',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->post(route('organizations.invitation-resend', [$organization, $invitation]))
        ->assertRedirect(route('organizations.show', $organization));
});

test('show page passes pending invitations to admins', function () {
    $admin = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();
    $organization->users()->attach($admin->id, ['role' => OrganizationRole::ADMIN->value]);

    Invitation::factory()->create([
        'email' => 'awaiting@example.com',
        'role' => 'editor',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('organizations.show', $organization));

    $response->assertInertia(fn ($page) => $page
        ->component('organizations/show')
        ->where('canAddMembers', true)
        ->has('pendingInvitations', 1)
        ->where('pendingInvitations.0.email', 'awaiting@example.com')
    );
});

test('show page hides pending invitations from non-admins', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $organization = Organization::factory()->ownedBy($owner)->create();

    Invitation::factory()->create([
        'email' => 'awaiting@example.com',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending,
    ]);

    $response = $this->actingAs($viewer)
        ->get(route('organizations.show', $organization));

    $response->assertInertia(fn ($page) => $page
        ->component('organizations/show')
        ->where('canAddMembers', false)
        ->has('pendingInvitations', 0)
    );
});

test('InvitationAccepted event adds user to organization with invited role', function () {
    $admin = User::factory()->create();
    $invitee = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();
    $organization->users()->attach($admin->id, ['role' => OrganizationRole::ADMIN->value]);

    $invitation = Invitation::factory()->create([
        'email' => $invitee->email,
        'role' => 'editor',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending,
    ]);

    event(new InvitationAccepted($invitation, $invitee));

    $this->assertDatabaseHas('organization_user', [
        'organization_id' => $organization->id,
        'user_id' => $invitee->id,
        'role' => 'editor',
    ]);
});

test('InvitationAccepted with null user does not add member', function () {
    $admin = User::factory()->create();
    $organization = Organization::factory()->ownedBy($admin)->create();

    $invitation = Invitation::factory()->create([
        'email' => 'guest@example.com',
        'role' => 'author',
        'invitable_type' => (new Organization)->getMorphClass(),
        'invitable_id' => $organization->id,
        'status' => InvitationStatus::Pending,
    ]);

    event(new InvitationAccepted($invitation, null));

    expect($organization->users()->count())->toBe(0);
});
