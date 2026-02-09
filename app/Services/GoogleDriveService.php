<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;

class GoogleDriveService
{
    protected Drive $drive;

    public function __construct()
    {
        $client = new Client();
        $client->setAuthConfig(config('services.google_drive.credentials'));
        $client->addScope(Drive::DRIVE);

        $this->drive = new Drive($client);
    }

    /**
     * Get or create a folder in Google Drive / Shared Drive
     *
     * @param string $name Folder name
     * @param string|null $parentId Parent folder ID, null = Shared Drive root
     * @return string Folder ID
     */
    public function getOrCreateSubFolder(string $name, ?string $parentId = null): string
    {
        // Use root folder (Shared Drive ID) if parentId not provided
        $parentId = $parentId ?? config('services.google_drive.folder_id');

        // Check if folder already exists
        $response = $this->drive->files->listFiles([
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

        // Folder does not exist, create it
        $folder = new DriveFile([
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
            'parents' => [$parentId],
        ]);

        $created = $this->drive->files->create($folder, [
            'fields' => 'id',
            'supportsAllDrives' => true,
        ]);

        return $created->id;
    }

    /**
     * Upload a file to Shared Drive under ROOT → Campus → pictures/signatures
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $campus
     * @param string $typeFolder (pictures / signatures)
     * @return array
     */
    public function uploadPicture($file, string $campus, string $typeFolder): array
    {
        // 1️⃣ Campus folder
        $campusFolderId = $this->getOrCreateSubFolder($campus);

        // 2️⃣ Type folder inside campus (pictures / signatures)
        $targetFolderId = $this->getOrCreateSubFolder($typeFolder, $campusFolderId);

        // 3️⃣ Upload file
        $fileMetadata = new DriveFile([
            'name' => $file->getClientOriginalName(),
            'parents' => [$targetFolderId],
            'mimeType' => $file->getMimeType(), // important
        ]);

        $content = file_get_contents($file->getRealPath());

        $uploaded = $this->drive->files->create($fileMetadata, [
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
        $response = $this->drive->files->get($fileId, [
            'alt' => 'media',
            'supportsAllDrives' => true,
        ]);

        $stream = $response->getBody(); // 👈 get the stream
        $stream->rewind();              // 👈 rewind the stream

        return $stream->getContents();
    }
}
