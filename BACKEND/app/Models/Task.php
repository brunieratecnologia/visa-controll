<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'routine_id',
        'scheduled_date',
        'status',
        'completed_at',
        'completed_by',
        'observation',
        'photo_path',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function routine(): BelongsTo
    {
        return $this->belongsTo(Routine::class);
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
