<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;

/**
 * @OA\Schema(
 *     schema="User",
 *     title="User",
 *     description="User model",
 *     @OA\Property(property="id", type="integer", format="int64", description="User ID"),
 *     @OA\Property(property="name", type="string", description="User name"),
 *     @OA\Property(property="email", type="string", format="email", description="User email"),
 *     @OA\Property(property="phone_number", type="string", description="User phone number"),
 *     @OA\Property(property="role", type="string", enum={"applicant", "company", "job_poster"}, description="User role"),
 *     @OA\Property(property="company_name", type="string", description="Company name"),
 *     @OA\Property(property="company_type", type="string", enum={"startup", "national", "multinational"}, description="Company type"),
 *     @OA\Property(property="bio", type="string", description="User bio"),
 *     @OA\Property(property="profile_picture_url", type="string", format="url", description="Profile picture URL"),
 *     @OA\Property(property="background_image_url", type="string", format="url", description="Background image URL"),
 *     @OA\Property(property="created_at", type="string", format="date-time", description="Creation timestamp"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", description="Update timestamp")
 * )
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Enter token in format (Bearer <token>)"
 * )
 */
class AuthController extends Controller
{
    /**
     * @OA\Post(
     *      path="/api/register",
     *      summary="Register a new user",
     *      tags={"Authentication"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"name", "email", "password", "password_confirmation", "phone_number", "role"},
     *              @OA\Property(property="name", type="string", example="John Doe"),
     *              @OA\Property(property="email", type="string", format="email", example="john.doe@example.com"),
     *              @OA\Property(property="password", type="string", format="password", example="password123"),
     *              @OA\Property(property="password_confirmation", type="string", format="password", example="password123"),
     *              @OA\Property(property="phone_number", type="string", example="1234567890"),
     *              @OA\Property(property="role", type="string", enum={"applicant", "company", "job_poster"}, example="applicant"),
     *              @OA\Property(property="company_name", type="string", example="Example Corp"),
     *              @OA\Property(property="company_type", type="string", enum={"startup", "national", "multinational"}, example="startup")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="User registered successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string"),
     *              @OA\Property(property="access_token", type="string"),
     *              @OA\Property(property="token_type", type="string"),
     *              @OA\Property(property="user", ref="#/components/schemas/User")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error"
     *      )
     * )
     */
    public function register(Request $request)
    {
        // dd('Reached register method'); // Removed temporary debug statement
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone_number' => 'required|string|max:20',
            'role' => 'required|in:applicant,company,job_poster',
            'company_type' => 'nullable|string|in:startup,national,multinational',
            'company_name' => 'nullable|string|max:255',
        ]);

        if ($request->role === 'company' && !$request->company_type) {
            throw ValidationException::withMessages([
                'company_type' => ['The company type is required for company roles.'],
            ]);
        }

        if (($request->role === 'company' || $request->role === 'job_poster') && !$request->company_name) {
            throw ValidationException::withMessages([
                'company_name' => ['The company name is required for company and job poster roles.'],
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'role' => $request->role,
            'company_type' => $request->company_type,
            'company_name' => $request->company_name,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * @OA\Post(
     *      path="/api/login",
     *      summary="Log in a user",
     *      tags={"Authentication"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email", "password"},
     *              @OA\Property(property="email", type="string", format="email", example="john.doe@example.com"),
     *              @OA\Property(property="password", type="string", format="password", example="password123")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Logged in successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string"),
     *              @OA\Property(property="access_token", type="string"),
     *              @OA\Property(property="token_type", type="string"),
     *              @OA\Property(property="user", ref="#/components/schemas/User")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Invalid credentials"
     *      )
     * )
     */
    public function login(Request $request)
    {
        Log::info('Login attempt: Request received', $request->all());

        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('email', 'password');
        Log::info('Login attempt: Credentials', $credentials);

        if (!Auth::attempt($credentials)) {
            Log::info('Login attempt: Auth failed for email: ' . $credentials['email']);
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        Log::info('Login attempt: Auth successful for user ID: ' . $user->id);

        return response()->json([
            'message' => 'Logged in successfully',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * @OA\Post(
     *      path="/api/logout",
     *      summary="Log out the current user",
     *      tags={"Authentication"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Logged out successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * @OA\Post(
     *      path="/api/user/profile",
     *      summary="Update user profile",
     *      tags={"User"},
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          @OA\MediaType(
     *              mediaType="multipart/form-data",
     *              @OA\Schema(
     *                  @OA\Property(property="name", type="string"),
     *                  @OA\Property(property="bio", type="string"),
     *                  @OA\Property(property="profile_picture", type="string", format="binary"),
     *                  @OA\Property(property="background_image", type="string", format="binary")
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Profile updated successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string"),
     *              @OA\Property(property="user", ref="#/components/schemas/User")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated"
     *      )
     * )
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'background_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture_url) {
                // Delete old profile picture if exists
                Storage::disk('public')->delete($user->profile_picture_url);
            }
            $profilePicturePath = $request->file('profile_picture')->store('profile_pictures', 'public');
            $user->profile_picture_url = $profilePicturePath;
        }

        if ($request->hasFile('background_image')) {
            if ($user->background_image_url) {
                // Delete old background image if exists
                Storage::disk('public')->delete($user->background_image_url);
            }
            $backgroundImagePath = $request->file('background_image')->store('background_images', 'public');
            $user->background_image_url = $backgroundImagePath;
        }

        // Update other fields
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('bio')) {
            $user->bio = $request->bio;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * @OA\Post(
     *      path="/api/forgot-password",
     *      summary="Send password reset link",
     *      tags={"Authentication"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email"},
     *              @OA\Property(property="email", type="string", format="email", example="john.doe@example.com")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Password reset link sent",
     *          @OA\JsonContent(@OA\Property(property="message", type="string"))
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="User not found"
     *      )
     * )
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'We can\'t find a user with that email address.'], 404);
        }

        $token = Str::random(60);

        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            [
                'email' => $request->email,
                'token' => Hash::make($token),
                'created_at' => Carbon::now()
            ]
        );

        // The URL should point to your frontend's reset password page
        $resetUrl = 'http://localhost:4200/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        Mail::send('emails.password_reset', ['resetUrl' => $resetUrl], function ($message) use ($request) {
            $message->to($request->email);
            $message->subject('Reset Your Password');
        });

        return response()->json(['message' => 'A password reset link has been sent to your email address.']);
    }

    /**
     * @OA\Post(
     *      path="/api/reset-password",
     *      summary="Reset user password",
     *      tags={"Authentication"},
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email", "token", "password", "password_confirmation"},
     *              @OA\Property(property="email", type="string", format="email", example="john.doe@example.com"),
     *              @OA\Property(property="token", type="string", example="..."),
     *              @OA\Property(property="password", type="string", format="password", example="newpassword123"),
     *              @OA\Property(property="password_confirmation", type="string", format="password", example="newpassword123")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Password has been reset",
     *          @OA\JsonContent(@OA\Property(property="message", type="string"))
     *      ),
     *      @OA\Response(
     *          response=400,
     *          description="Invalid token"
     *      )
     * )
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $passwordReset = DB::table('password_resets')
            ->where('email', $request->email)
            ->first();

        if (!$passwordReset || !Hash::check($request->token, $passwordReset->token)) {
            return response()->json(['message' => 'This password reset token is invalid.'], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'We can\'t find a user with that email address.'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_resets')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Your password has been reset successfully.']);
    }
}
