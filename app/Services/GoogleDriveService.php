<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;

class GoogleDriveService
{
    protected ?Drive $drive = null;

    // Lazy-load the Drive service
    protected function drive(): Drive
    {
        if ($this->drive) {
            return $this->drive;
        }

        $client = new Client();
        $client->setAuthConfig(config('services.google_drive.credentials'));
        $client->addScope(Drive::DRIVE);

        return $this->drive = new Drive($client);
    }

    public function getOrCreateSubFolder(string $name, ?string $parentId = null): string
    {
        $parentId = $parentId ?? config('services.google_drive.folder_id');

        $response = $this->drive()->files->listFiles([
            'q' => sprintf(
                "mimeType='application/vnd.google-apps.folder' and name='%s' and '%s' in parents and trashed=false",
                $name,
                $parentId
            ),
            'fields' => 'files(id, name)',
            'supportsAllDrives' => true,
            'includeItemsFromAllDrives' => true,
        ]);

        if (count($response->files) > 0) {
            return $response->files[0]->id;
        }

        $folder = new DriveFile([
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId],
        ]);

        $created = $this->drive()->files->create($folder, [
            'fields' => 'id',
            'supportsAllDrives' => true,
        ]);

        return $created->id;
    }

    public function uploadPicture($file, string $campus, string $typeFolder): array
    {
        $campusFolderId = $this->getOrCreateSubFolder($campus);
        $targetFolderId = $this->getOrCreateSubFolder($typeFolder, $campusFolderId);

        $fileMetadata = new DriveFile([
            'name' => $file->getClientOriginalName(),
            'parents' => [$targetFolderId],
            'mimeType' => $file->getMimeType(),
        ]);

        $content = file_get_contents($file->getRealPath());

        $uploaded = $this->drive()->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => $file->getMimeType(),
            'uploadType' => 'multipart',
            'fields' => 'id,name',
            'supportsAllDrives' => true,
        ]);

        return [
            'id' => $uploaded->id,
            'name' => $uploaded->name,
            'campus' => $campus,
            'folder' => $typeFolder,
            'path' => "$campus/$typeFolder/" . $uploaded->name,
            'url' => "https://drive.google.com/file/d/{$uploaded->id}/view",
        ];
    }

    public function getFileContent(string $fileId): string
    {
        $response = $this->drive()->files->get($fileId, [
            'alt' => 'media',
            'supportsAllDrives' => true,
        ]);

        $stream = $response->getBody();
        $stream->rewind();

        return $stream->getContents();
    }

    private function getGoogleAccessToken()
    {
        return \Illuminate\Support\Facades\Cache::remember('google_drive_access_token', 3500, function () {
            $path = storage_path('app/google/service-account.json');
            if (!file_exists($path)) {
                throw new \Exception("Service account credentials file not found at: {$path}");
            }

            $creds = json_decode(file_get_contents($path), true);
            if (!$creds) {
                throw new \Exception("Invalid credentials JSON");
            }

            $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
            $now = time();
            $claims = json_encode([
                'iss' => $creds['client_email'],
                'scope' => 'https://www.googleapis.com/auth/drive.readonly',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now
            ]);

            $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
            $base64UrlClaims = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($claims));

            $signature = '';
            $privateKey = str_replace('\n', "\n", $creds['private_key']);
            $success = openssl_sign(
                $base64UrlHeader . "." . $base64UrlClaims,
                $signature,
                $privateKey,
                'sha256'
            );

            if (!$success) {
                throw new \Exception("Failed to sign JWT with private key");
            }

            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
            $jwt = $base64UrlHeader . "." . $base64UrlClaims . "." . $base64UrlSignature;

            $response = \Illuminate\Support\Facades\Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if (!$response->successful()) {
                throw new \Exception("Failed to obtain OAuth2 token from Google: " . $response->body());
            }

            return $response->json('access_token');
        });
    }

    public function getGDriveImage(string $fileId)
    {
        // Sanitize file ID to prevent path traversal
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $fileId)) {
            return response()->json(['error' => 'Invalid file ID'], 400);
        }

        $cachePath = storage_path("app/google/cache/{$fileId}");

        if (file_exists($cachePath)) {
            $contentType = mime_content_type($cachePath) ?: 'image/jpeg';
            return response()->file($cachePath, [
                'Content-Type' => $contentType,
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }

        try {
            $token = $this->getGoogleAccessToken();

            $response = \Illuminate\Support\Facades\Http::withToken($token)
                ->get("https://www.googleapis.com/drive/v3/files/{$fileId}?alt=media");

            if (!$response->successful()) {
                return response()->json(['error' => 'Failed to fetch file from Google Drive', 'status' => $response->status()], $response->status());
            }

            $content = $response->body();
            $contentType = $response->header('Content-Type') ?: 'image/jpeg';

            // Ensure cache directory exists
            if (!is_dir(dirname($cachePath))) {
                mkdir(dirname($cachePath), 0755, true);
            }

            file_put_contents($cachePath, $content);

            return response($content, 200, [
                'Content-Type' => $contentType,
                'Cache-Control' => 'public, max-age=31536000',
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Google Drive fetch error: " . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error: ' . $e->getMessage()], 500);
        }
    }

    public function uploadChecklist($file, string $campus): array
    {
        $campusFolderId = $this->getOrCreateSubFolder($campus);
        $checklistFolderId = $this->getOrCreateSubFolder('Checklist', $campusFolderId);

        $fileMetadata = new DriveFile([
            'name' => $file->getClientOriginalName(),
            'parents' => [$checklistFolderId],
            'mimeType' => $file->getMimeType(),
        ]);

        $content = file_get_contents($file->getRealPath());

        $uploaded = $this->drive()->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => $file->getMimeType(),
            'uploadType' => 'multipart',
            'fields' => 'id,name',
            'supportsAllDrives' => true,
        ]);

        return [
            'id' => $uploaded->id,
            'name' => $uploaded->name,
            'campus' => $campus,
            'folder' => 'Checklist',
            'path' => "$campus/Checklist/" . $uploaded->name,
            'url' => "https://drive.google.com/file/d/{$uploaded->id}/view",
        ];
    }
}