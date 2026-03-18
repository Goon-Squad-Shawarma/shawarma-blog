<?php

use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\User;

test('admin can add a member to an organization', function () {
    $owner = User::factory()->create();
    $organization = Organization::factory()->create(['owner_id' => $owner->id]);
    $organization->users()->attach($owner->id, ['role' => OrganizationRole::ADMIN->value]);

    $newMember = User::factory()->create();

    $this->actingAs($owner)
        ->post(route('organizations.add-member', $organization), [
            'user_id' => $newMember->id,
            'role' => 'editor',
        ])
        ->assertRedirect(route('organizations.show', $organization));

    $this->assertDatabaseHas('organization_user', [
        'organization_id' => $organization->id,
        'user_id' => $newMember->id,
        'role' => 'editor',
    ]);
});

test('non-admin cannot add a member', function () {
    $owner = User::factory()->create();
    $organization = Organization::factory()->create(['owner_id' => $owner->id]);

    $editor = User::factory()->create();
    $organization->users()->attach($editor->id, ['role' => OrganizationRole::EDITOR->value]);

    $newMember = User::factory()->create();

    $this->actingAs($editor)
        ->post(route('organizations.add-member', $organization), [
            'user_id' => $newMember->id,
            'role' => 'author',
        ])
        ->assertForbidden();
});

test('admin can remove a member from an organization', function () {
    $owner = User::factory()->create();
    $organization = Organization::factory()->create(['owner_id' => $owner->id]);
    $organization->users()->attach($owner->id, ['role' => OrganizationRole::ADMIN->value]);

    $member = User::factory()->create();
    $organization->users()->attach($member->id, ['role' => OrganizationRole::AUTHOR->value]);

    $this->actingAs($owner)
        ->delete(route('organizations.remove-member', [$organization, $member]))
        ->assertRedirect(route('organizations.show', $organization));

    $this->assertDatabaseMissing('organization_user', [
        'organization_id' => $organization->id,
        'user_id' => $member->id,
    ]);
});

test('admin can update a member role', function () {
    $owner = User::factory()->create();
    $organization = Organization::factory()->create(['owner_id' => $owner->id]);
    $organization->users()->attach($owner->id, ['role' => OrganizationRole::ADMIN->value]);

    $member = User::factory()->create();
    $organization->users()->attach($member->id, ['role' => OrganizationRole::AUTHOR->value]);

    $this->actingAs($owner)
        ->patch(route('organizations.update-member-role', [$organization, $member]), [
            'user_id' => $member->id,
            'role' => 'editor',
        ])
        ->assertRedirect(route('organizations.show', $organization));

    $this->assertDatabaseHas('organization_user', [
        'organization_id' => $organization->id,
        'user_id' => $member->id,
        'role' => 'editor',
    ]);
});

test('owner can delete an organization', function () {
    $owner = User::factory()->create();
    $organization = Organization::factory()->create(['owner_id' => $owner->id]);

    $this->actingAs($owner)
        ->delete(route('organizations.destroy', $organization))
        ->assertRedirect(route('organizations.index'));

    $this->assertDatabaseMissing('organizations', ['id' => $organization->id]);
});

test('non-owner cannot delete an organization', function () {
    $owner = User::factory()->create();
    $organization = Organization::factory()->create(['owner_id' => $owner->id]);

    $other = User::factory()->create();
    $organization->users()->attach($other->id, ['role' => OrganizationRole::ADMIN->value]);

    $this->actingAs($other)
        ->delete(route('organizations.destroy', $organization))
        ->assertForbidden();
});

test('organization show passes correct permissions to frontend', function () {
    $owner = User::factory()->create();
    $organization = Organization::factory()->create(['owner_id' => $owner->id]);
    $organization->users()->attach($owner->id, ['role' => OrganizationRole::ADMIN->value]);

    $response = $this->actingAs($owner)->get(route('organizations.show', $organization));

    $response->assertInertia(fn ($page) => $page
        ->component('organizations/show')
        ->where('canUpdate', true)
        ->where('canDelete', true)
        ->where('canAddMembers', true),
    );
});
