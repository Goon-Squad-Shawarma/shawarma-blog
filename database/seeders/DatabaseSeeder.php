<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Blog;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Tag;
use App\Models\Organization;
use App\Models\Follow;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create a test user
        $testUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Create additional users
        $users = User::factory(9)->create();
        $allUsers = collect([$testUser])->merge($users);

        // Create organizations
        $organizations = Organization::factory(3)
            ->state(function () use ($allUsers) {
                return [
                    'owner_id' => $allUsers->random()->id,
                ];
            })
            ->create();

        // Create tags
        $tagNames = ['Laravel', 'PHP', 'Database', 'API', 'Testing'];
        $tags = collect();
        foreach ($tagNames as $name) {
            $tags->push(Tag::factory()->withName($name)->create());
        }

        // Create blogs for users
        $blogs = Blog::factory(20)
            ->state(function () use ($allUsers) {
                return [
                    'user_id' => $allUsers->random()->id,
                ];
            })
            ->create()
            ->each(function ($blog) use ($tags) {
                // Attach random tags to each blog
                $randomTags = $tags->random(min(rand(1, 3), $tags->count()))->pluck('id');
                $blog->tags()->attach($randomTags);
            });

        // Create some organization blogs
        $organizations->each(function ($org) use ($tags) {
            Blog::factory(3)
                ->state([
                    'organization_id' => $org->id,
                    'user_id' => $org->owner_id,
                ])
                ->create()
                ->each(function ($blog) use ($tags) {
                    $randomTags = $tags->random(min(rand(1, 3), $tags->count()))->pluck('id');
                    $blog->tags()->attach($randomTags);
                });
        });

        // Create likes (ensure uniqueness)
        $likeCount = 0;
        $maxAttempts = 200;
        $attempts = 0;
        
        while ($likeCount < 50 && $attempts < $maxAttempts) {
            try {
                Like::factory()
                    ->state(function () use ($blogs, $allUsers) {
                        return [
                            'user_id' => $allUsers->random()->id,
                            'blog_id' => $blogs->random()->id,
                        ];
                    })
                    ->create();
                $likeCount++;
            } catch (\Illuminate\Database\QueryException $e) {
                // Skip duplicate likes
                $attempts++;
            }
        }

        // Create comments
        Comment::factory(80)
            ->state(function () use ($blogs, $allUsers) {
                return [
                    'user_id' => $allUsers->random()->id,
                    'blog_id' => $blogs->random()->id,
                ];
            })
            ->create();

        // Create some nested comments (replies)
        Comment::all()->slice(0, 20)->each(function ($comment) use ($allUsers) {
            Comment::factory(rand(1, 3))
                ->asReplyTo($comment)
                ->state(['user_id' => $allUsers->random()->id])
                ->create();
        });

        // Create follows
        $allUsers->each(function ($user) use ($allUsers, $organizations) {
            // Each user follows 2-5 other users
            $usersToFollow = $allUsers->except($user->id)->random(rand(2, 5));
            $usersToFollow->each(function ($followUser) use ($user) {
                Follow::factory()
                    ->byUser($user)
                    ->followingUser($followUser)
                    ->create();
            });

            // Each user follows 1-3 organizations
            $orgsToFollow = $organizations->random(rand(1, 3));
            $orgsToFollow->each(function ($org) use ($user) {
                Follow::factory()
                    ->byUser($user)
                    ->followingOrganization($org)
                    ->create();
            });
        });

        // Add users to organizations
        $organizations->each(function ($org) use ($allUsers) {
            $members = $allUsers->except($org->owner_id)->random(rand(2, 5));
            $members->each(function ($user) use ($org) {
                $org->users()->attach($user->id, ['role' => 'member']);
            });
        });
    }
}
