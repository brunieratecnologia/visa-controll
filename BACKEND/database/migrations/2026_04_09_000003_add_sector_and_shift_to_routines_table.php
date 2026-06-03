<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('routines', function (Blueprint $table) {
            $table->string('sector')->default('GERAL')->after('category');
            $table->enum('shift', ['ABERTURA', 'PRODUCAO', 'FECHAMENTO'])->default('PRODUCAO')->after('sector');
        });
    }

    public function down(): void
    {
        Schema::table('routines', function (Blueprint $table) {
            $table->dropColumn(['sector', 'shift']);
        });
    }
};
