<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsLecturer
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== 'dosen') {
            return response()->json([
                'message' => 'Akses ditolak. Peran Anda bukan dosen.'
            ], 403);
        }

        return $next($request);
    }
}
