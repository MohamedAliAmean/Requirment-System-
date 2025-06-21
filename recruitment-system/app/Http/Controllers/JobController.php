<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\JobResource;
use Illuminate\Support\Facades\Log;

/**
 * @OA\Schema(
 *     schema="Job",
 *     title="Job",
 *     description="Job model",
 *     @OA\Property(property="id", type="integer", format="int64", description="Job ID"),
 *     @OA\Property(property="title", type="string", description="Job title"),
 *     @OA\Property(property="description", type="string", description="Job description"),
 *     @OA\Property(property="requirements", type="string", description="Job requirements"),
 *     @OA\Property(property="company_name", type="string", description="Company name"),
 *     @OA\Property(property="min_salary", type="integer", description="Minimum salary"),
 *     @OA\Property(property="max_salary", type="integer", description="Maximum salary"),
 *     @OA\Property(property="status", type="string", enum={"active", "closed"}, description="Job status"),
 *     @OA\Property(property="user_id", type="integer", description="ID of the user who posted the job"),
 *     @OA\Property(property="created_at", type="string", format="date-time", description="Creation timestamp"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", description="Update timestamp")
 * )
 */
class JobController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/jobs",
     *      summary="Get a list of active jobs",
     *      tags={"Jobs"},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Job")
     *          )
     *      )
     * )
     */
    public function index()
    {
        // Anyone can view active jobs
        $jobs = Job::active()->latest()->get();
        return JobResource::collection($jobs);
    }

    /**
     * @OA\Post(
     *      path="/api/jobs",
     *      summary="Create a new job",
     *      tags={"Jobs"},
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"title", "description", "requirements", "company_name"},
     *              @OA\Property(property="title", type="string", example="Software Engineer"),
     *              @OA\Property(property="description", type="string", example="Develop and maintain web applications."),
     *              @OA\Property(property="requirements", type="string", example="PHP, Laravel, Vue.js"),
     *              @OA\Property(property="company_name", type="string", example="Tech Corp"),
     *              @OA\Property(property="min_salary", type="integer", example=80000),
     *              @OA\Property(property="max_salary", type="integer", example=120000)
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Job created successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string"),
     *              @OA\Property(property="job", ref="#/components/schemas/Job")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function store(Request $request)
    {
        // Only 'company' or 'job_poster' can create jobs
        if (!Auth::user()->isCompany() && !Auth::user()->isJobPoster()) {
            return response()->json(['message' => 'Unauthorized to create jobs'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'company_name' => 'required|string|max:255',
            'min_salary' => 'nullable|integer|min:0',
            'max_salary' => 'nullable|integer|min:0|gte:min_salary',
        ]);

        $job = Auth::user()->jobs()->create([
            'title' => $request->title,
            'description' => $request->description,
            'requirements' => $request->requirements,
            'min_salary' => $request->min_salary,
            'max_salary' => $request->max_salary,
            'company_name' => $request->company_name,
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Job posted successfully',
            'job' => new JobResource($job),
        ], 201);
    }

    /**
     * @OA\Get(
     *      path="/api/jobs/{job}",
     *      summary="Get a specific job",
     *      tags={"Jobs"},
     *      @OA\Parameter(
     *          name="job",
     *          in="path",
     *          required=true,
     *          description="ID of the job",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/Job")
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Job not found"
     *      )
     * )
     */
    public function show(Job $job)
    {
        // Anyone can view a specific job, regardless of status
        return new JobResource($job);
    }

    /**
     * @OA\Put(
     *      path="/api/jobs/{job}",
     *      summary="Update a job",
     *      tags={"Jobs"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="job",
     *          in="path",
     *          required=true,
     *          description="ID of the job",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"title", "description", "requirements", "company_name", "status"},
     *              @OA\Property(property="title", type="string"),
     *              @OA\Property(property="description", type="string"),
     *              @OA\Property(property="requirements", type="string"),
     *              @OA\Property(property="company_name", type="string"),
     *              @OA\Property(property="min_salary", type="integer"),
     *              @OA\Property(property="max_salary", type="integer"),
     *              @OA\Property(property="status", type="string", enum={"active", "closed"})
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Job updated successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string"),
     *              @OA\Property(property="job", ref="#/components/schemas/Job")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function update(Request $request, Job $job)
    {
        // Only the owner of the job can update it
        if (Auth::id() !== $job->user_id) {
            return response()->json(['message' => 'Unauthorized to update this job'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'company_name' => 'required|string|max:255',
            'min_salary' => 'nullable|integer|min:0',
            'max_salary' => 'nullable|integer|min:0|gte:min_salary',
            'status' => 'required|in:active,closed',
        ]);

        $job->update($request->all());

        return response()->json([
            'message' => 'Job updated successfully',
            'job' => new JobResource($job),
        ]);
    }

    /**
     * @OA\Delete(
     *      path="/api/jobs/{job}",
     *      summary="Delete a job",
     *      tags={"Jobs"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="job",
     *          in="path",
     *          required=true,
     *          description="ID of the job",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=204,
     *          description="Job deleted successfully"
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function destroy(Job $job)
    {
        // Only the owner of the job can delete it
        if (Auth::id() !== $job->user_id) {
            return response()->json(['message' => 'Unauthorized to delete this job'], 403);
        }

        // You might want to add logic here to prevent deletion if there are active applications
        $job->delete();

        return response()->json(['message' => 'Job deleted successfully'], 204);
    }

    /**
     * @OA\Get(
     *      path="/api/my-posted-jobs",
     *      summary="Get jobs posted by the authenticated user",
     *      tags={"Jobs"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Job")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function myPostedJobs()
    {
        $user = Auth::user();
        \Log::info('myPostedJobs called by user:', [
            'user_id' => $user->id,
            'user_role' => $user->role,
            'user_email' => $user->email
        ]);

        if (!$user->isCompany() && !$user->isJobPoster()) {
            \Log::warning('Unauthorized access attempt to myPostedJobs', [
                'user_id' => $user->id,
                'user_role' => $user->role
            ]);
            return response()->json(['message' => 'Unauthorized to view posted jobs'], 403);
        }

        // Explicitly query jobs with user relationship
        $jobs = Job::where('user_id', $user->id)
                  ->with('applications') // Eager load applications to get count
                  ->latest()
                  ->get();

        \Log::info('Found jobs for user', [
            'user_id' => $user->id,
            'job_count' => $jobs->count(),
            'jobs' => $jobs->map(function($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'company_name' => $job->company_name,
                    'status' => $job->status,
                    'applications_count' => $job->applications->count()
                ];
            })->toArray()
        ]);

        return JobResource::collection($jobs);
    }
}
