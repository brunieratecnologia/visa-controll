<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('routine_id')->constrained()->cascadeOnDelete();
            $table->date('scheduled_date');
            $table->enum('status', ['PENDING', 'COMPLETED', 'LATE'])->default('PENDING');
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('observation')->nullable();
            $table->timestamps();

            $table->unique(['routine_id', 'scheduled_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
