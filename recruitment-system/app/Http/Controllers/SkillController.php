<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\SkillResource;

class SkillController extends Controller
{
    public function index()
    {
        $skills = Auth::user()->skills()->get();
        return SkillResource::collection($skills);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'proficiency_level' => 'nullable|integer|min:1|max:5',
        ]);

        $skill = Auth::user()->skills()->create($request->all());

        return response()->json([
            'message' => 'Skill created successfully',
            'skill' => new SkillResource($skill),
        ], 201);
    }

    public function show(Skill $skill)
    {
        if (Auth::id() !== $skill->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return new SkillResource($skill);
    }

    public function update(Request $request, Skill $skill)
    {
        if (Auth::id() !== $skill->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'proficiency_level' => 'nullable|integer|min:1|max:5',
        ]);

        $skill->update($request->all());

        return response()->json([
            'message' => 'Skill updated successfully',
            'skill' => new SkillResource($skill),
        ]);
    }

    public function destroy(Skill $skill)
    {
        if (Auth::id() !== $skill->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $skill->delete();

        return response()->json(['message' => 'Skill deleted successfully'], 204);
    }
} 