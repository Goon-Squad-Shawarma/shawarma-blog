<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\BlogView;
use App\Models\Bookmark;
use App\Models\Campaign;
use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Organization;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\QueryException;
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
            } catch (QueryException $e) {
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

        // Create 3 bookmarks per user (random blogs)
        $allUsers->each(function ($user) use ($blogs) {
            $blogsToBookmark = $blogs->random(min(3, $blogs->count()));
            $blogsToBookmark->each(function ($blog) use ($user) {
                Bookmark::firstOrCreate([
                    'user_id' => $user->id,
                    'blog_id' => $blog->id,
                ]);
            });
        });

        // Create 5-10 blog views per blog (mix of user and guest)
        $blogs->each(function ($blog) use ($allUsers) {
            $viewCount = rand(5, 10);
            $usedUserIds = [];

            for ($i = 0; $i < $viewCount; $i++) {
                if ($i < 3) {
                    // User views
                    $available = $allUsers->whereNotIn('id', $usedUserIds);
                    if ($available->isEmpty()) {
                        break;
                    }
                    $user = $available->random();
                    $usedUserIds[] = $user->id;
                    BlogView::firstOrCreate(
                        ['blog_id' => $blog->id, 'user_id' => $user->id],
                        ['ip_address' => fake()->ipv4(), 'session_id' => fake()->uuid()]
                    );
                } else {
                    // Guest views
                    BlogView::create([
                        'blog_id' => $blog->id,
                        'user_id' => null,
                        'ip_address' => fake()->ipv4(),
                        'session_id' => fake()->uuid(),
                    ]);
                }
            }
        });

        // Create 1 draft campaign for the first test user
        Campaign::factory()->create([
            'user_id' => $testUser->id,
            'subject' => 'Welcome to my newsletter!',
            'body' => '<p>Hello! This is my first email campaign draft.</p>',
        ]);
    }
}
