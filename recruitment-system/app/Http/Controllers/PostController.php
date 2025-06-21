<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

/**
 * @OA\Schema(
 *     schema="Post",
 *     title="Post",
 *     description="Post model",
 *     @OA\Property(property="id", type="integer", format="int64", description="Post ID"),
 *     @OA\Property(property="user_id", type="integer", description="ID of the user who created the post"),
 *     @OA\Property(property="content", type="string", description="Text content of the post"),
 *     @OA\Property(property="media_type", type="string", enum={"image", "video"}, description="Type of media attached"),
 *     @OA\Property(property="media_path", type="string", description="Path to the media file"),
 *     @OA\Property(property="created_at", type="string", format="date-time", description="Creation timestamp"),
 *     @OA\Property(property="updated_at", type="string", format="date-time", description="Update timestamp")
 * )
 */
class PostController extends Controller
{
    /**
     * @OA\Post(
     *      path="/api/posts",
     *      summary="Create a new post",
     *      tags={"Posts"},
     *      security={{"bearerAuth":{}}},
     *      @OA\RequestBody(
     *          @OA\MediaType(
     *              mediaType="multipart/form-data",
     *              @OA\Schema(
     *                  @OA\Property(property="content", type="string", description="Text content of the post"),
     *                  @OA\Property(property="media", type="string", format="binary", description="Image or video file")
     *              )
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Post created successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string"),
     *              @OA\Property(property="post", ref="#/components/schemas/Post")
     *          )
     *      )
     * )
     */
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string',
            'media' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,mov,avi|max:10240', // 10MB max
        ]);

        $mediaPath = null;
        $mediaType = null;
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $mediaType = $file->getMimeType();
            $isImage = str_starts_with($mediaType, 'image');
            $isVideo = str_starts_with($mediaType, 'video');
            $mediaType = $isImage ? 'image' : ($isVideo ? 'video' : null);
            $mediaPath = $file->store('posts', 'public');
        }

        $post = Post::create([
            'user_id' => Auth::id(),
            'content' => $request->content,
            'media_type' => $mediaType,
            'media_path' => $mediaPath,
        ]);

        return response()->json(['message' => 'Post created successfully', 'post' => $post], 201);
    }

    /**
     * @OA\Get(
     *      path="/api/posts",
     *      summary="List posts for the authenticated user",
     *      tags={"Posts"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Post")
     *          )
     *      )
     * )
     */
    public function index()
    {
        $posts = Post::where('user_id', Auth::id())->latest()->get();
        return response()->json(['data' => $posts]);
    }

    /**
     * @OA\Get(
     *      path="/api/users/{user}/posts",
     *      summary="List posts for a specific user",
     *      tags={"Posts"},
     *      security={{"bearerAuth":{}}},
     *      @OA\Parameter(
     *          name="user",
     *          in="path",
     *          required=true,
     *          description="ID of the user",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Post")
     *          )
     *      )
     * )
     */
    public function userPosts(User $user)
    {
        $posts = $user->posts()->latest()->get();
        return response()->json(['data' => $posts]);
    }
}
