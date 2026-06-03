<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('issues', function (Blueprint $table) {
            $table->id();
            $table->text('description');
            $table->enum('category', ['EPI', 'EQUIPMENT', 'CLEANING', 'OTHER']);
            $table->text('reason')->nullable();
            $table->text('action')->nullable();
            $table->enum('status', ['OPEN', 'IN_PROGRESS', 'RESOLVED'])->default('OPEN');
            $table->foreignId('reported_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('reported_at');
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('issues');
    }
};
