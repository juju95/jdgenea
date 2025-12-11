<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class LocationController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/api/locations/search', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function search(Request $request): JsonResponse
    {
        $q = $request->query->get('q', '');
        if (strlen($q) < 2) {
            return new JsonResponse([]);
        }

        $conn = $this->em->getConnection();
        
        // Search in birth_place, death_place, baptism_place, marriage_place (from families table?)
        // Let's stick to persons table first.
        // Also check families table for marriage_place
        
        $sql = "
            SELECT DISTINCT place FROM (
                SELECT birth_place as place FROM persons WHERE birth_place LIKE :q
                UNION
                SELECT death_place as place FROM persons WHERE death_place LIKE :q
                UNION
                SELECT baptism_place as place FROM persons WHERE baptism_place LIKE :q
                UNION
                SELECT marriage_place as place FROM families WHERE marriage_place LIKE :q
            ) as t
            WHERE place IS NOT NULL AND place != ''
            ORDER BY place ASC
            LIMIT 20
        ";

        $stmt = $conn->executeQuery($sql, ['q' => '%' . $q . '%']);
        $results = $stmt->fetchAllAssociative();

        return new JsonResponse(array_column($results, 'place'));
    }
}
