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
}