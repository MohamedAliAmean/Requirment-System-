<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Job extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'requirements',
        'min_salary',
        'max_salary',
        'number_of_applicants',
        'company_name',
        'status',
    ];

    protected $casts = [
        'number_of_applicants' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function incrementApplicants()
    {
        $this->increment('number_of_applicants');
    }

    public function decrementApplicants()
    {
        $this->decrement('number_of_applicants');
    }
}
