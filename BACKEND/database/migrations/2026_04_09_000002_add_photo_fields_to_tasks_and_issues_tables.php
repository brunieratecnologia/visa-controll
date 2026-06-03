<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('observation');
        });

        Schema::table('issues', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('reason');
            $table->string('resolution_photo_path')->nullable()->after('action');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });

        Schema::table('issues', function (Blueprint $table) {
            $table->dropColumn(['photo_path', 'resolution_photo_path']);
        });
    }
};
