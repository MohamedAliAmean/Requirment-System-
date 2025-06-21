<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\JobResource;

class JobApplicationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_id' => $this->job_id,
            'user_id' => $this->user_id,
            'cv_path' => $this->cv_path,
            'status' => $this->status,
            'cover_letter' => $this->cover_letter,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'job' => new JobResource($this->whenLoaded('job')),
            'applicant' => new UserResource($this->whenLoaded('user')),
        ];
    }
} 