<?php

namespace App\Controller;

use App\Entity\Event;
use App\Repository\EventRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class EventController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly EventRepository $events,
    ) {}

    #[Route('/api/persons/{personId}/events', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(string $personId): JsonResponse
    {
        $items = $this->events->findBy(['personId' => $personId]);
        $out = array_map(function(Event $e){
            return [
                'id' => self::get($e,'id'),
                'personId' => self::get($e,'personId'),
                'type' => self::get($e,'type'),
                'date' => self::get($e,'date') ? self::get($e,'date')->format('Y-m-d') : null,
                'time' => self::get($e,'time'),
                'place' => self::get($e,'place'),
                'placeSubdivision' => self::get($e,'placeSubdivision'),
                'description' => self::get($e,'description'),
                'isPrivate' => self::get($e,'isPrivate'),
            ];
        }, $items);
        return new JsonResponse($out);
    }

    #[Route('/api/events', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request): JsonResponse
    {
        $d = json_decode($request->getContent(), true) ?? [];
        $personId = $d['personId'] ?? null; $type = $d['type'] ?? null;
        if (!$personId || !$type) return new JsonResponse(['error'=>'Paramètres requis'], 400);
        $e = new Event(self::uuid(), $personId, $type);
        if (isset($d['date']) && $d['date']) self::set($e,'date', new \DateTimeImmutable($d['date']));
        foreach(['time','place','placeSubdivision','description'] as $k){ if(isset($d[$k])) self::set($e,$k,$d[$k]); }
        if (isset($d['isPrivate'])) self::set($e,'isPrivate',(bool)$d['isPrivate']);
        $this->em->persist($e); $this->em->flush();
        return new JsonResponse(['id'=> self::get($e,'id')], 201);
    }

    #[Route('/api/events/{id}', methods: ['PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function patch(string $id, Request $request): JsonResponse
    {
        $e = $this->events->find($id); if(!$e) return new JsonResponse(['error'=>'Introuvable'],404);
        $d = json_decode($request->getContent(), true) ?? [];
        foreach(['time','place','placeSubdivision','description','type','personId','isPrivate'] as $k){ if(array_key_exists($k,$d)) self::set($e,$k,$d[$k]); }
        if (array_key_exists('date',$d)) self::set($e,'date', $d['date'] ? new \DateTimeImmutable($d['date']) : null);
        $this->em->flush(); return new JsonResponse(['status'=>'ok']);
    }

    #[Route('/api/events/{id}', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(string $id): JsonResponse
    { $e = $this->events->find($id); if(!$e) return new JsonResponse(['error'=>'Introuvable'],404); $this->em->remove($e); $this->em->flush(); return new JsonResponse(['status'=>'ok']); }

    private static function get(object $o, string $p): mixed { $r=new \ReflectionProperty($o,$p); $r->setAccessible(true); return $r->getValue($o);}    
    private static function set(object $o, string $p, mixed $v): void { $r=new \ReflectionProperty($o,$p); $r->setAccessible(true); $r->setValue($o,$v);}   
    private static function uuid(): string { $d=random_bytes(16); $d[6]=chr(ord($d[6])&0x0f|0x40); $d[8]=chr(ord($d[8])&0x3f|0x80); $h=bin2hex($d); return sprintf('%s-%s-%s-%s-%s',substr($h,0,8),substr($h,8,4),substr($h,12,4),substr($h,16,4),substr($h,20)); }
}

