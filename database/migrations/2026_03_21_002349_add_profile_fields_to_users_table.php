<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('uuid')->after('id')->unique()->nullable();
            $table->string('first_name')->after('uuid')->nullable();
            $table->string('last_name')->after('first_name')->nullable();
            $table->string('username')->after('last_name')->unique()->nullable();
            $table->string('avatar_url')->after('username')->nullable();
            $table->string('background_url')->after('avatar_url')->nullable();
            $table->string('website')->after('background_url')->nullable();
            $table->text('bio')->after('website')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_uuid_unique');
            $table->dropUnique('users_username_unique');
            $table->dropColumn(['uuid', 'first_name', 'last_name', 'username', 'avatar_url', 'background_url', 'website', 'bio']);
        });
    }
};
