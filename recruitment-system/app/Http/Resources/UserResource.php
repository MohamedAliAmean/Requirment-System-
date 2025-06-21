<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\SkillResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'phone_number' => $this->phone_number,
            'role' => $this->role,
            'company_type' => $this->company_type,
            'company_name' => $this->company_name,
            'profile_picture_url' => $this->profile_picture_url,
            'bio' => $this->bio,
            'background_image_url' => $this->background_image_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'skills' => SkillResource::collection($this->whenLoaded('skills')),
        ];
    }
}
