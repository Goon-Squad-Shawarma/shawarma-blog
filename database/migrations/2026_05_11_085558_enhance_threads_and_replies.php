<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            $table->string('category', 32)->default('community')->after('slug');
            $table->string('status', 32)->nullable()->after('category');
            $table->string('image_url')->nullable()->after('body');
            $table->unsignedInteger('upvotes_count')->default(0)->after('image_url');
            $table->index('category');
            $table->index('status');
        });

        Schema::table('thread_replies', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['status']);
            $table->dropColumn(['category', 'status', 'image_url', 'upvotes_count']);
        });

        Schema::table('thread_replies', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });
    }
};
