<?php

use App\Enums\PostVisibility;
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
        Schema::create('blogs', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained()->cascadeOnDelete();

            // Blog details
            $table->string('title');
            $table->string('slug', 120)->unique();
            $table->string('subtitle')->nullable();
            $table->longText('content');    
            $table->string('banner_url')->nullable();
            $table->timestamp('published_at')->nullable(); // This will be used to show draft - if null draft or else it is published >= now or else scheduled <= now
            $table->string('visibility')->default(PostVisibility::PUBLIC->value);

            // Meta
            $table->unsignedInteger('reading_time')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blogs');
    }
};
