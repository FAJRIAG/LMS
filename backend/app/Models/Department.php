<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'code'])]
class Department extends Model
{
    use HasFactory;

    public function classrooms(): HasMany
    {
        return $this->hasMany(Classroom::class);
    }
}
