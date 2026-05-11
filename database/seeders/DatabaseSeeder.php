<?php

namespace Database\Seeders;

use App\Enums\CampaignStatus;
use App\Enums\LikeType;
use App\Enums\OrganizationRole;
use App\Enums\PostVisibility;
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
    public function run(): void
    {
        // ── USERS ────────────────────────────────────────────────────────
        $testUser = User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'testuser',
            'email' => 'test@example.com',
        ]);

        $author = User::factory()->create([
            'first_name' => 'Sarah',
            'last_name' => 'Khan',
            'username' => 'sarahk',
            'email' => 'sarah@example.com',
            'bio' => 'Tech writer, foodie, occasional opinion-haver.',
        ]);

        $users = User::factory(15)->create();
        $allUsers = collect([$testUser, $author])->merge($users);

        // ── TAGS ─────────────────────────────────────────────────────────
        $tagNames = [
            'Laravel', 'PHP', 'JavaScript', 'TypeScript', 'React',
            'Database', 'API', 'Testing', 'DevOps', 'Tutorial',
            'Performance', 'Security', 'AI', 'Open Source', 'Career',
        ];
        $tags = collect($tagNames)->map(fn ($name) => Tag::factory()->withName($name)->create());

        // ── ORGANIZATIONS ────────────────────────────────────────────────
        $org1 = Organization::factory()->create([
            'name' => 'Goon Squad Engineering',
            'slug' => 'goon-squad-eng',
            'owner_id' => $testUser->id,
            'description' => 'We write about building things that scale.',
        ]);

        $org2 = Organization::factory()->create([
            'name' => 'Shawarma Devs',
            'slug' => 'shawarma-devs',
            'owner_id' => $author->id,
            'description' => 'Engineering deep dives, served fresh.',
        ]);

        $org3 = Organization::factory()->create([
            'owner_id' => $allUsers->random()->id,
        ]);

        $organizations = collect([$org1, $org2, $org3]);

        $organizations->each(function (Organization $org) use ($allUsers): void {
            $org->users()->syncWithoutDetaching([
                $org->owner_id => ['role' => OrganizationRole::ADMIN->value],
            ]);

            $members = $allUsers->where('id', '!=', $org->owner_id)->random(4);
            $roles = [OrganizationRole::EDITOR, OrganizationRole::AUTHOR, OrganizationRole::AUTHOR, OrganizationRole::EDITOR];
            foreach ($members as $i => $member) {
                $org->users()->syncWithoutDetaching([
                    $member->id => ['role' => $roles[$i]->value],
                ]);
            }
        });

        // ── BLOGS ────────────────────────────────────────────────────────
        $personalBlogs = Blog::factory(30)
            ->state(fn () => ['user_id' => $allUsers->random()->id])
            ->create();

        Blog::factory(3)
            ->draft()
            ->state(fn () => ['user_id' => $testUser->id])
            ->create();

        Blog::factory()->create([
            'user_id' => $author->id,
            'visibility' => PostVisibility::PRIVATE,
            'title' => 'My private notebook',
        ]);

        $orgBlogs = collect();
        $organizations->each(function (Organization $org) use (&$orgBlogs): void {
            $blogs = Blog::factory(5)
                ->state(fn () => [
                    'organization_id' => $org->id,
                    'user_id' => $org->owner_id,
                ])
                ->create();
            $orgBlogs = $orgBlogs->merge($blogs);
        });

        $allBlogs = $personalBlogs->merge($orgBlogs);

        $allBlogs->each(function (Blog $blog) use ($tags): void {
            $count = rand(1, 4);
            $blog->tags()->syncWithoutDetaching($tags->random($count)->pluck('id')->all());
        });

        // ── LIKES ────────────────────────────────────────────────────────
        $likeCount = 0;
        $attempts = 0;
        while ($likeCount < 150 && $attempts < 400) {
            try {
                Like::factory()
                    ->state(fn () => [
                        'user_id' => $allUsers->random()->id,
                        'likeable_id' => $allBlogs->random()->id,
                        'likeable_type' => Blog::class,
                        'type' => LikeType::Like->value,
                    ])
                    ->create();
                $likeCount++;
            } catch (QueryException) {
                $attempts++;
            }
        }

        // ── COMMENTS ─────────────────────────────────────────────────────
        $comments = Comment::factory(120)
            ->state(fn () => [
                'user_id' => $allUsers->random()->id,
                'blog_id' => $allBlogs->random()->id,
            ])
            ->create();

        $comments->random(30)->each(function (Comment $parent) use ($allUsers): void {
            Comment::factory(rand(1, 3))
                ->asReplyTo($parent)
                ->state(['user_id' => $allUsers->random()->id])
                ->create();
        });

        // ── FOLLOWS ──────────────────────────────────────────────────────
        $allUsers->each(function (User $user) use ($allUsers, $organizations): void {
            $candidates = $allUsers->where('id', '!=', $user->id);
            $followCount = min(rand(3, 8), $candidates->count());
            $candidates->random($followCount)->each(function (User $target) use ($user): void {
                Follow::firstOrCreate([
                    'user_id' => $user->id,
                    'following_user_id' => $target->id,
                ]);
            });

            $organizations->random(rand(1, 3))->each(function (Organization $org) use ($user): void {
                if ($org->owner_id === $user->id) {
                    return;
                }
                Follow::firstOrCreate([
                    'user_id' => $user->id,
                    'following_organization_id' => $org->id,
                ]);
            });
        });

        // ── BOOKMARKS ────────────────────────────────────────────────────
        $allUsers->each(function (User $user) use ($allBlogs): void {
            $allBlogs->random(rand(2, 6))->each(function (Blog $blog) use ($user): void {
                Bookmark::firstOrCreate([
                    'user_id' => $user->id,
                    'blog_id' => $blog->id,
                ]);
            });
        });

        // ── BLOG VIEWS (auth-only after schema simplification) ───────────
        $allBlogs->each(function (Blog $blog) use ($allUsers): void {
            $viewers = $allUsers->random(min(rand(5, 12), $allUsers->count()));
            $viewers->each(function (User $u) use ($blog): void {
                BlogView::firstOrCreate(
                    ['blog_id' => $blog->id, 'user_id' => $u->id],
                    ['created_at' => now()->subMinutes(rand(0, 60 * 24 * 14))]
                );
            });
        });

        // ── CAMPAIGNS ────────────────────────────────────────────────────
        Campaign::create([
            'user_id' => $testUser->id,
            'subject' => 'Welcome to my newsletter!',
            'body' => '<h2>Hello there 👋</h2><p>This is my first newsletter draft.</p><p>I write about Laravel, React, and the weird side of full-stack life. Hit reply with what you want to read about next.</p>',
            'status' => CampaignStatus::Draft,
            'recipient_count' => 0,
        ]);

        Campaign::create([
            'user_id' => $author->id,
            'subject' => 'New post: scaling our database layer',
            'body' => '<p>This week I shipped a redesign of our database access layer. Read the full breakdown on the blog.</p>',
            'status' => CampaignStatus::Sent,
            'recipient_count' => 27,
            'sent_at' => now()->subDays(3),
        ]);

        Campaign::create([
            'organization_id' => $org1->id,
            'user_id' => $org1->owner_id,
            'subject' => '[Goon Squad] Q1 engineering update',
            'body' => '<h2>Q1 wrap-up</h2><p>Hi friends — here is what shipped this quarter.</p><ul><li>New feed</li><li>Bookmarks</li><li>AI draft assistant</li></ul>',
            'status' => CampaignStatus::Draft,
            'recipient_count' => 0,
        ]);

        Campaign::create([
            'user_id' => $allUsers->random()->id,
            'subject' => 'Failed delivery test',
            'body' => '<p>This one should look failed in the UI.</p>',
            'status' => CampaignStatus::Failed,
            'recipient_count' => 12,
            'sent_at' => now()->subDays(1),
        ]);
    }
}
