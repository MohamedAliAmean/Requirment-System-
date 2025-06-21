<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_number',
        'role',
        'company_type',
        'company_name',
        'profile_picture_url',
        'bio',
        'background_image_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Relationships
    public function skills()
    {
        return $this->hasMany(Skill::class);
    }

    public function jobs()
    {
        return $this->hasMany(Job::class);
    }

    public function jobApplications()
    {
        return $this->hasMany(JobApplication::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    // Helper methods
    public function isApplicant()
    {
        return $this->role === 'applicant';
    }

    public function isCompany()
    {
        return $this->role === 'company';
    }

    public function isJobPoster()
    {
        return $this->role === 'job_poster';
    }
}
