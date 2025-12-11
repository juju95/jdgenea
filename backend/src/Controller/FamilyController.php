<?php

namespace App\Controller;

use App\Entity\Family;
use App\Repository\FamilyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class FamilyController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly FamilyRepository $families,
    ) {}

    #[Route('/api/families', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        $treeId = $_GET['treeId'] ?? null;
        $items = $treeId ? $this->families->findBy(['treeId' => $treeId]) : $this->families->findAll();
        $out = array_map(fn(Family $f) => [
            'id' => self::get($f,'id'),
            'treeId' => self::get($f,'treeId'),
            'husbandId' => self::get($f,'husbandId'),
            'wifeId' => self::get($f,'wifeId'),
            'marriageDate' => self::get($f,'marriageDate') ? self::get($f,'marriageDate')->format(\DateTime::ATOM) : null,
        ], $items);
        return new JsonResponse($out);
    }

    #[Route('/api/families', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request): JsonResponse
    {
        $d = json_decode($request->getContent(), true) ?? [];
        $treeId = $d['treeId'] ?? null;
        if (!$treeId) { return new JsonResponse(['error' => 'treeId requis'], 400); }
        $f = new Family();
        self::set($f,'id', self::uuid()); self::set($f,'treeId', $treeId);
        foreach (['husbandId','wifeId','marriagePlace'] as $k) { if (array_key_exists($k,$d)) self::set($f,$k,$d[$k]); }
        $this->em->persist($f); $this->em->flush();
        return new JsonResponse(['id' => self::get($f,'id')], 201);
    }

    #[Route('/api/families/{id}', methods: ['PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function patch(string $id, Request $request): JsonResponse
    {
        $f = $this->families->find($id);
        if (!$f) { return new JsonResponse(['error' => 'Famille introuvable'], 404); }
        
        $d = json_decode($request->getContent(), true) ?? [];
        
        foreach (['husbandId', 'wifeId', 'marriagePlace', 'marriageLatitude', 'marriageLongitude'] as $field) {
            if (array_key_exists($field, $d)) {
                self::set($f, $field, $d[$field]);
            }
        }
        
        if (array_key_exists('marriageDate', $d)) {
            $date = $d['marriageDate'] ? new \DateTimeImmutable($d['marriageDate']) : null;
            self::set($f, 'marriageDate', $date);
        }

        $this->em->flush();
        return new JsonResponse(['status' => 'ok']);
    }

    private static function get(object $o, string $p): mixed { $r=new \ReflectionProperty($o,$p); $r->setAccessible(true); return $r->getValue($o);}    
    private static function set(object $o, string $p, mixed $v): void { $r=new \ReflectionProperty($o,$p); $r->setAccessible(true); $r->setValue($o,$v);}   
    private static function uuid(): string { $d=random_bytes(16); $d[6]=chr(ord($d[6])&0x0f|0x40); $d[8]=chr(ord($d[8])&0x3f|0x80); $h=bin2hex($d); return sprintf('%s-%s-%s-%s-%s',substr($h,0,8),substr($h,8,4),substr($h,12,4),substr($h,16,4),substr($h,20)); }
}
