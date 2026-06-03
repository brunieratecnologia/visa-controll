<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class PublicFileStorage
{
    public static function storeEventPhoto(?UploadedFile $file, string $directory = 'uploads/events'): ?string
    {
        if (! $file) {
            return null;
        }

        $relativeDirectory = trim($directory, '/').'/'.now()->format('Y/m');
        $absoluteDirectory = public_path($relativeDirectory);

        if (! File::exists($absoluteDirectory)) {
            File::makeDirectory($absoluteDirectory, 0755, true);
        }

        $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg';
        $filename = now()->format('YmdHis').'-'.Str::random(12).'.'.$extension;
        $file->move($absoluteDirectory, $filename);

        return $relativeDirectory.'/'.$filename;
    }

    public static function delete(?string $path): void
    {
        if (! $path) {
            return;
        }

        $absolutePath = public_path($path);

        if (File::exists($absolutePath)) {
            File::delete($absolutePath);
        }
    }

    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return '/'.ltrim(str_replace('\\', '/', $path), '/');
    }
}
