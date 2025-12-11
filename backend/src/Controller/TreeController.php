<?php

namespace App\Controller;

use App\Entity\Tree;
use App\Repository\TreeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Bundle\SecurityBundle\Security;

class TreeController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly TreeRepository $trees,
        private readonly Security $security,
    ) {}

    #[Route('/api/trees', name: 'api_trees_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        $user = $this->security->getUser();
        if (!$user || !method_exists($user, 'getId')) {
            return new JsonResponse([], 200);
        }
        $items = $this->trees->findBy(['userId' => $user->getId()]);
        $out = array_map(fn(Tree $t) => [
            'id' => $t->getId(),
            'name' => $t->getName(),
            'description' => $t->getDescription(),
        ], $items);
        return new JsonResponse($out);
    }

    #[Route('/api/trees', name: 'api_trees_create', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return new JsonResponse(['error' => 'Payload invalide'], 400);
        }
        $name = $data['name'] ?? null;
        $description = $data['description'] ?? null;
        if (!$name) { return new JsonResponse(['error' => 'Nom requis'], 400); }

        $user = $this->security->getUser();
        if (!$user || !method_exists($user, 'getId')) {
            return new JsonResponse(['error' => 'Utilisateur non authentifié'], 401);
        }
        $tree = new Tree(self::uuid(), $user->getId(), $name);
        if ($description) { $tree->setDescription($description); }
        $this->em->persist($tree);
        $this->em->flush();
        return new JsonResponse(['id' => $tree->getId(), 'name' => $name], 201);
    }

    #[Route('/api/trees/{id}', name: 'api_trees_show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(string $id): JsonResponse
    {
        $user = $this->security->getUser();
        if (!$user || !method_exists($user, 'getId')) {
            return new JsonResponse(['error' => 'Utilisateur non authentifié'], 401);
        }
        $tree = $this->trees->findOneBy(['id' => $id, 'userId' => $user->getId()]);
        if (!$tree) { return new JsonResponse(['error' => 'Introuvable'], 404); }
        return new JsonResponse([
            'id' => $tree->getId(),
            'name' => $tree->getName(),
            'description' => $tree->getDescription(),
            'rootPersonId' => (function($t){ $rp = new \ReflectionProperty($t,'rootPersonId'); $rp->setAccessible(true); return $rp->getValue($t); })($tree),
        ]);
    }

    #[Route('/api/trees/{id}', name: 'api_trees_patch', methods: ['PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function patch(string $id, Request $request): JsonResponse
    {
        $user = $this->security->getUser();
        if (!$user || !method_exists($user, 'getId')) { return new JsonResponse(['error'=>'Utilisateur non authentifié'],401); }
        $tree = $this->trees->findOneBy(['id'=>$id,'userId'=>$user->getId()]); if(!$tree) return new JsonResponse(['error'=>'Introuvable'],404);
        $d = json_decode($request->getContent(), true) ?? [];
        if (array_key_exists('rootPersonId',$d)) { $tree->setRootPersonId($d['rootPersonId'] ?: null); }
        $this->em->flush();
        return new JsonResponse(['status'=>'ok']);
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
