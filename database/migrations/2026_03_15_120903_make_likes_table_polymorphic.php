<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the foreign key and old unique constraint
        Schema::table('likes', function (Blueprint $table) {
            $table->dropForeign(['blog_id']);
            $table->dropUnique('likes_user_id_blog_id_unique');
        });

        // Add new polymorphic + type columns (nullable for existing rows)
        Schema::table('likes', function (Blueprint $table) {
            $table->string('likeable_type')->nullable()->after('blog_id');
            $table->string('type')->default('like')->after('likeable_type');
        });

        // Populate new columns for existing blog likes
        DB::table('likes')->update(['likeable_type' => 'App\\Models\\Blog']);

        // Rename blog_id → likeable_id
        Schema::table('likes', function (Blueprint $table) {
            $table->renameColumn('blog_id', 'likeable_id');
        });

        // Make likeable_type not nullable and add new unique constraint
        Schema::table('likes', function (Blueprint $table) {
            $table->string('likeable_type')->nullable(false)->change();
            $table->unique(['user_id', 'likeable_id', 'likeable_type', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('likes', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'likeable_id', 'likeable_type', 'type']);
        });

        Schema::table('likes', function (Blueprint $table) {
            $table->renameColumn('likeable_id', 'blog_id');
        });

        Schema::table('likes', function (Blueprint $table) {
            $table->dropColumn(['likeable_type', 'type']);
            $table->foreign('blog_id')->references('id')->on('blogs')->cascadeOnDelete();
            $table->unique(['user_id', 'blog_id']);
        });
    }
};
