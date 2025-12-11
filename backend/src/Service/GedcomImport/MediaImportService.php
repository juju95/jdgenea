<?php

namespace App\Service\GedcomImport;

use App\Entity\MediaObject;
use App\Repository\MediaObjectRepository;
use Doctrine\ORM\EntityManagerInterface;

class MediaImportService
{
    public function __construct(
        private EntityManagerInterface $em,
        private MediaObjectRepository $mediaRepository
    ) {}

    public function import(array $mediaData, string $treeId): array
    {
        $importedMedia = [];
        $batchSize = 20;
        $i = 0;

        foreach ($mediaData as $gedcomId => $data) {
            $numericId = preg_replace('/\D+/', '', $gedcomId);
            
            // Check if exists
            $media = $this->mediaRepository->findByGedcomId($numericId);
            
            // Find FILE tag
            $filePath = $this->findTagValue($data['children'], 'FILE');
            if (!$filePath) {
                // Try finding FORM tag to guess type, or just skip if no file
                // Some GEDCOMs put FILE under OBJE directly, some under a child OBJE
                continue; 
            }

            // Determine type
            $form = $this->findTagValue($data['children'], 'FORM');
            $type = 'PHOTO'; // Default
            if ($form) {
                if (stripos($form, 'jpg') !== false || stripos($form, 'jpeg') !== false || stripos($form, 'png') !== false) {
                    $type = 'PHOTO';
                } elseif (stripos($form, 'pdf') !== false) {
                    $type = 'DOCUMENT';
                }
            }

            if (!$media) {
                $media = new MediaObject($this->uuid(), basename($filePath), $type);
                $media->setGedcomId($numericId);
            }

            $media->setFileName(basename($filePath)); // Or full path if we want to store it, but usually we just want the name
            // Actually, let's store the raw value from GEDCOM in description or title if needed, 
            // but for fileName we usually want a clean name. 
            // However, the user said "C:/Users/..." so maybe we should keep the path reference somewhere?
            // The Entity has `fileName` (255 chars).
            
            $title = $this->findTagValue($data['children'], 'TITL');
            if ($title) $media->setTitle($title);

            $this->em->persist($media);
            $importedMedia[$gedcomId] = $media;

            if (($i++ % $batchSize) === 0) {
                $this->em->flush();
            }
        }
        $this->em->flush();

        return $importedMedia;
    }

    private function findTagValue(array $children, string $tag): ?string
    {
        foreach ($children as $child) {
            if ($child['tag'] === $tag) {
                $value = $child['value'];
                 if (!empty($child['children'])) {
                    foreach ($child['children'] as $sub) {
                        if ($sub['tag'] === 'CONC') $value .= $sub['value'];
                        if ($sub['tag'] === 'CONT') $value .= "\n" . $sub['value'];
                    }
                }
                return $value;
            }
        }
        return null;
    }

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr(ord($d[6]) & 0x0f | 0x40);
        $d[8] = chr(ord($d[8]) & 0x3f | 0x80);
        $h = bin2hex($d);
        return sprintf('%s-%s-%s-%s-%s', substr($h, 0, 8), substr($h, 8, 4), substr($h, 12, 4), substr($h, 16, 4), substr($h, 20));
    }
}
