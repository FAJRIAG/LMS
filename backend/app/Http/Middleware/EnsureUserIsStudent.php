<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsStudent
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== 'mahasiswa') {
            return response()->json([
                'message' => 'Akses ditolak. Peran Anda bukan mahasiswa.'
            ], 403);
        }

        return $next($request);
    }
}
