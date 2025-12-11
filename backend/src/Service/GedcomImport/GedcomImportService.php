<?php

namespace App\Service\GedcomImport;

use App\Entity\Tree;
use App\Repository\TreeRepository;
use Doctrine\ORM\EntityManagerInterface;

class GedcomImportService
{
    public function __construct(
        private EntityManagerInterface $em,
        private TreeRepository $treeRepository,
        private GedcomParserService $parser,
        private PersonImportService $personService,
        private FamilyImportService $familyService,
        private MediaImportService $mediaService,
        private SourceImportService $sourceService
    ) {}

    public function import(string $filePath, string $treeId): array
    {
        if (!file_exists($filePath)) {
            return ['status' => 'error', 'errors' => ['File not found']];
        }

        $content = file_get_contents($filePath);
        if ($content === false) {
             return ['status' => 'error', 'errors' => ['Could not read file']];
        }

        // Parse GEDCOM structure
        $parsedData = $this->parser->parse($content);

        // Import in order
        // 1. Sources (SOUR)
        $sourceMap = $this->sourceService->import($parsedData['SOUR'], $treeId);
        
        // 2. Media (OBJE)
        $mediaMap = $this->mediaService->import($parsedData['OBJE'], $treeId);
        
        // 3. Persons (INDI)
        $personMap = $this->personService->import($parsedData['INDI'], $treeId, $sourceMap, $mediaMap);
        
        // 4. Families (FAM)
        $familyMap = $this->familyService->import($parsedData['FAM'], $treeId, $personMap);

        // Set Root Person (if @I1@ exists or just pick the first one)
        $tree = $this->treeRepository->find($treeId);
        if ($tree) {
            // Try @I1@
            if (isset($personMap['@I1@'])) {
                $tree->setRootPersonId($personMap['@I1@']->getId());
            } elseif (!empty($personMap)) {
                // Pick first
                $first = reset($personMap);
                $tree->setRootPersonId($first->getId());
            }
            $this->em->flush();
        }

        return [
            'status' => 'done',
            'sources' => count($sourceMap),
            'media' => count($mediaMap),
            'persons' => count($personMap),
            'families' => count($familyMap)
        ];
    }
}
