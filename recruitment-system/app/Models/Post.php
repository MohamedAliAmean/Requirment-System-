<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = [
        'user_id',
        'content',
        'media_type',
        'media_path',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
