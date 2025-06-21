<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/user/profile', [AuthController::class, 'updateProfile']);

    // Skill management routes
    Route::apiResource('skills', \App\Http\Controllers\SkillController::class);

    // Job management routes (authenticated)
    Route::post('/jobs', [\App\Http\Controllers\JobController::class, 'store']);
    Route::put('/jobs/{job}', [\App\Http\Controllers\JobController::class, 'update']);
    Route::delete('/jobs/{job}', [\App\Http\Controllers\JobController::class, 'destroy']);
    Route::get('/my-posted-jobs', [\App\Http\Controllers\JobController::class, 'myPostedJobs']);

    // Job application routes
    Route::post('/jobs/{job}/apply', [\App\Http\Controllers\JobApplicationController::class, 'apply']);
    Route::get('/my-applications', [\App\Http\Controllers\JobApplicationController::class, 'myApplications']);
    Route::get('/applications/{application}', [\App\Http\Controllers\JobApplicationController::class, 'showApplication']);
    Route::put('/applications/{application}/status', [\App\Http\Controllers\JobApplicationController::class, 'updateApplicationStatus']);
    Route::get('/my-job-applications', [\App\Http\Controllers\JobApplicationController::class, 'applicationsForMyJobs']);
    Route::get('/jobs/{job}/applications', [\App\Http\Controllers\JobApplicationController::class, 'applicationsForJob']);
    Route::get('/applications/{application}/download-cv', [\App\Http\Controllers\JobApplicationController::class, 'downloadCv']);

    // Post management routes
    Route::post('/posts', [\App\Http\Controllers\PostController::class, 'store']);
    Route::get('/my-posts', [\App\Http\Controllers\PostController::class, 'index']);
    Route::get('/users/{user}/posts', [\App\Http\Controllers\PostController::class, 'userPosts']);
});

// Publicly accessible job routes
Route::get('/jobs', [\App\Http\Controllers\JobController::class, 'index']);
Route::get('/jobs/{job}', [\App\Http\Controllers\JobController::class, 'show']);
