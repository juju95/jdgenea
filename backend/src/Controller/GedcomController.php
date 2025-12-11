<?php

namespace App\Controller;

use App\Service\GedcomService;
use App\Service\GedcomImport\GedcomImportService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class GedcomController
{
    public function __construct(
        private readonly GedcomService $gedcomExportService,
        private readonly GedcomImportService $gedcomImportService
    ) {}

    #[Route('/api/gedcom/import', name: 'api_gedcom_import', methods: ['POST'])]
    public function import(Request $request): JsonResponse
    {
        $file = $request->files->get('file');
        $treeId = (string)$request->request->get('treeId');
        if (!$file) {
            return new JsonResponse(['error' => 'Aucun fichier'], 400);
        }
        if (!$treeId) { return new JsonResponse(['error' => 'treeId requis'], 400); }
        $result = $this->gedcomImportService->import($file->getRealPath(), $treeId);
        return new JsonResponse(array_merge(['importId' => self::uuid()], $result));
    }

    #[Route('/api/gedcom/export/{treeId}', name: 'api_gedcom_export', methods: ['GET'])]
    public function export(string $treeId): BinaryFileResponse
    {
        $content = $this->gedcomExportService->export($treeId);
        $tmp = tempnam(sys_get_temp_dir(), 'ged');
        file_put_contents($tmp, $content);
        return new BinaryFileResponse($tmp);
    }

    private static function uuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        $hex = bin2hex($data);
        return sprintf('%s-%s-%s-%s-%s', substr($hex,0,8), substr($hex,8,4), substr($hex,12,4), substr($hex,16,4), substr($hex,20));
    }
}
