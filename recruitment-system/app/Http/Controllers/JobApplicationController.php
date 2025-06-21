<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\JobApplicationResource;

/**
 * @OA\Schema(
 *     schema="JobApplication",
 *     title="Job Application",
 *     description="Job Application model",
 *     @OA\Property(property="id", type="integer", format="int64", description="Application ID"),
 *     @OA\Property(property="job_id", type="integer", description="ID of the job applied for"),
 *     @OA\Property(property="user_id", type="integer", description="ID of the applicant"),
 *     @OA\Property(property="cv_path", type="string", description="Path to the CV file"),
 *     @OA\Property(property="cover_letter", type="string", description="Cover letter content"),
 *     @OA\Property(property="status", type="string", enum={"pending", "reviewed", "accepted", "rejected"}, description="Application status"),
 *     @OA\Property(property="created_at", type="string", format="date-time", description="Creation timestamp"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", description="Update timestamp"),
 *     @OA\Property(property="job", ref="#/components/schemas/Job"),
 *     @OA\Property(property="user", ref="#/components/schemas/User")
 * )
 */
class JobApplicationController extends Controller
{
    /**
     * @OA\Post(
     *      path="/api/jobs/{job}/apply",
     *      summary="Apply for a job",
     *      tags={"Job Applications"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="job",
     *          in="path",
     *          required=true,
     *          description="ID of the job to apply for",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\MediaType(
     *              mediaType="multipart/form-data",
     *              @OA\Schema(
     *                  required={"cv_file"},
     *                  @OA\Property(property="cv_file", type="string", format="binary", description="CV file (pdf, doc, docx)"),
     *                  @OA\Property(property="cover_letter", type="string", description="Cover letter")
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Application submitted successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string"),
     *              @OA\Property(property="application", ref="#/components/schemas/JobApplication")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Bad request (e.g., already applied, job closed)"
     *      )
     * )
     */
    public function apply(Request $request, Job $job)
    {
        // Only applicants can apply for jobs
        if (!Auth::user()->isApplicant()) {
            return response()->json(['message' => 'Unauthorized to apply for jobs'], 403);
        }

        // Check if the job is active
        if ($job->status === 'closed') {
            return response()->json(['message' => 'Cannot apply to a closed job'], 400);
        }

        // Check if the user has already applied for this job
        if (Auth::user()->jobApplications()->where('job_id', $job->id)->exists()) {
            return response()->json(['message' => 'You have already applied for this job'], 400);
        }

        $request->validate([
            'cv_file' => 'required|file|mimes:pdf,doc,docx|max:2048', // Max 2MB
            'cover_letter' => 'nullable|string',
        ]);

        $cvPath = $request->file('cv_file')->store('cvs', 'public');

        $application = Auth::user()->jobApplications()->create([
            'job_id' => $job->id,
            'cv_path' => $cvPath,
            'cover_letter' => $request->cover_letter,
            'status' => 'pending',
        ]);

        // Increment number of applicants for the job
        $job->incrementApplicants();

        return response()->json([
            'message' => 'Job application submitted successfully',
            'application' => new JobApplicationResource($application->load('job')),
        ], 201);
    }

    /**
     * @OA\Get(
     *      path="/api/my-applications",
     *      summary="Get the current user's job applications",
     *      tags={"Job Applications"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/JobApplication")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function myApplications()
    {
        // Applicants can view their own applications
        if (!Auth::user()->isApplicant()) {
            return response()->json(['message' => 'Unauthorized to view your applications'], 403);
        }
        $applications = Auth::user()->jobApplications()->with('job')->latest()->get();
        return JobApplicationResource::collection($applications);
    }

    /**
     * @OA\Get(
     *      path="/api/applications/{application}",
     *      summary="Get a specific job application",
     *      tags={"Job Applications"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="application",
     *          in="path",
     *          required=true,
     *          description="ID of the job application",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/JobApplication")
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function showApplication(JobApplication $application)
    {
        // Job poster can view applications for their jobs
        if (Auth::user()->isCompany() || Auth::user()->isJobPoster()) {
            if (Auth::id() !== $application->job->user_id) {
                return response()->json(['message' => 'Unauthorized to view this application'], 403);
            }
            return new JobApplicationResource($application->load('user', 'job'));
        }

        // Applicant can view their own application
        if (Auth::user()->isApplicant()) {
            if (Auth::id() !== $application->user_id) {
                return response()->json(['message' => 'Unauthorized to view this application'], 403);
            }
            return new JobApplicationResource($application->load('job'));
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    /**
     * @OA\Patch(
     *      path="/api/applications/{application}/status",
     *      summary="Update the status of a job application",
     *      tags={"Job Applications"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="application",
     *          in="path",
     *          required=true,
     *          description="ID of the job application",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"status"},
     *              @OA\Property(property="status", type="string", enum={"pending", "reviewed", "accepted", "rejected"}, example="reviewed")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Application status updated successfully",
     *          @OA\JsonContent(ref="#/components/schemas/JobApplication")
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function updateApplicationStatus(Request $request, JobApplication $application)
    {
        // Only job poster can update status of applications for their jobs
        if (!Auth::user()->isCompany() && !Auth::user()->isJobPoster()) {
            return response()->json(['message' => 'Unauthorized to update application status'], 403);
        }

        if (Auth::id() !== $application->job->user_id) {
            return response()->json(['message' => 'Unauthorized to update this application'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,reviewed,accepted,rejected',
        ]);

        $oldStatus = $application->status;
        $application->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Application status updated successfully',
            'application' => new JobApplicationResource($application->load('job', 'user')),
            'old_status' => $oldStatus,
            'new_status' => $request->status,
            'applicant_name' => $application->user->name,
            'job_title' => $application->job->title,
            'company_name' => $application->job->company_name,
        ]);
    }

    /**
     * @OA\Get(
     *      path="/api/job-poster/applications",
     *      summary="Get all applications for jobs posted by the current user",
     *      tags={"Job Applications"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/JobApplication")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function applicationsForMyJobs()
    {
        // Only job posters can view applications for their jobs
        if (!Auth::user()->isCompany() && !Auth::user()->isJobPoster()) {
            return response()->json(['message' => 'Unauthorized to view applications for your jobs'], 403);
        }

        $userJobs = Auth::user()->jobs->pluck('id');
        $applications = JobApplication::whereIn('job_id', $userJobs)->with('job', 'user.skills')->latest()->get();

        return JobApplicationResource::collection($applications);
    }

    /**
     * @OA\Get(
     *      path="/api/jobs/{job}/applications",
     *      summary="Get all applications for a specific job",
     *      tags={"Job Applications"},
     *      security={{"bearerAuth":{}}},
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
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/JobApplication")
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      )
     * )
     */
    public function applicationsForJob(Job $job)
    {
        // Only job poster can view applications for their specific job
        if (!Auth::user()->isCompany() && !Auth::user()->isJobPoster()) {
            return response()->json(['message' => 'Unauthorized to view applications for this job'], 403);
        }

        if (Auth::id() !== $job->user_id) {
            return response()->json(['message' => 'Unauthorized to view applications for this job'], 403);
        }

        $applications = JobApplication::where('job_id', $job->id)
            ->with('user.skills')
            ->latest()
            ->get();

        return JobApplicationResource::collection($applications);
    }

    /**
     * @OA\Get(
     *      path="/api/applications/{application}/cv",
     *      summary="Download the CV for a job application",
     *      tags={"Job Applications"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="application",
     *          in="path",
     *          required=true,
     *          description="ID of the job application",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="CV file download",
     *          @OA\MediaType(
     *              mediaType="application/octet-stream"
     *          )
     *      ),
     *      @OA\Response(
     *          response=403,
     *          description="Unauthorized"
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="CV not found"
     *      )
     * )
     */
    public function downloadCv(JobApplication $application)
    {
        // Only job poster can download CV for applications to their jobs
        if (!Auth::user()->isCompany() && !Auth::user()->isJobPoster()) {
            return response()->json(['message' => 'Unauthorized to download CV'], 403);
        }

        if (Auth::id() !== $application->job->user_id) {
            return response()->json(['message' => 'Unauthorized to download this CV'], 403);
        }

        if (!Storage::disk('public')->exists($application->cv_path)) {
            return response()->json(['message' => 'CV file not found'], 404);
        }

        return Storage::disk('public')->download($application->cv_path);
    }
}
