<?php

namespace App\Service\GedcomImport;

use App\Entity\Source;
use App\Repository\SourceRepository;
use Doctrine\ORM\EntityManagerInterface;

class SourceImportService
{
    public function __construct(
        private EntityManagerInterface $em,
        private SourceRepository $sourceRepository
    ) {}

    public function import(array $sourcesData, string $treeId): array
    {
        $importedSources = [];
        $batchSize = 20;
        $i = 0;

        foreach ($sourcesData as $gedcomId => $data) {
            $numericId = preg_replace('/\D+/', '', $gedcomId);
            
            // Check if exists
            $source = $this->sourceRepository->findByGedcomId($numericId);
            if (!$source) {
                $source = new Source($this->uuid(), 'Untitled Source');
                $source->setGedcomId($numericId);
            }

            // Extract basic fields
            $title = $this->findTagValue($data['children'], 'TITL');
            if ($title) $source->setTitle($title);
            
            $author = $this->findTagValue($data['children'], 'AUTH');
            if ($author) $source->setAuthor($author);
            
            $pub = $this->findTagValue($data['children'], 'PUBL');
            if ($pub) $source->setPublication($pub);

            $this->em->persist($source);
            $importedSources[$gedcomId] = $source;

            if (($i++ % $batchSize) === 0) {
                $this->em->flush();
            }
        }
        $this->em->flush();

        return $importedSources;
    }

    private function findTagValue(array $children, string $tag): ?string
    {
        foreach ($children as $child) {
            if ($child['tag'] === $tag) {
                $value = $child['value'];
                // Check for CONC/CONT
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
