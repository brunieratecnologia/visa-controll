<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'role',
        'status',
        'last_login_at',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'deleted_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function completedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'completed_by');
    }

    public function reportedIssues(): HasMany
    {
        return $this->hasMany(Issue::class, 'reported_by');
    }

    public function resolvedIssues(): HasMany
    {
        return $this->hasMany(Issue::class, 'resolved_by');
    }

    public function appLogs(): HasMany
    {
        return $this->hasMany(AppLog::class);
    }
}
