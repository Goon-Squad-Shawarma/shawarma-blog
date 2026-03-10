<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('follows', function (Blueprint $table) {
            $table->id();

            // The person doing the following
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // The targets: We use two nullable columns to avoid complex "polymorphic" magic
            $table->foreignId('following_user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('following_organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();

            // Constraints to prevent duplicate follows
            // Since we have two targets, we need two separate unique indexes
            $table->unique(['user_id', 'following_user_id']);
            $table->unique(['user_id', 'following_organization_id']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('follows');
    }
};
