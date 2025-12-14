<?php

namespace App\Controller;

use App\Entity\Person;
use App\Repository\PersonRepository;
use App\Repository\FamilyRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class PersonController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PersonRepository $persons,
        private readonly FamilyRepository $families,
        private readonly \App\Service\SosaCalculatorService $sosaCalculator,
    ) {}

    #[Route('/api/persons', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        $treeId = $_GET['treeId'] ?? null;
        $items = $treeId 
            ? $this->persons->findBy(['treeId' => $treeId], ['lastName' => 'ASC', 'firstName' => 'ASC']) 
            : $this->persons->findBy([], ['lastName' => 'ASC', 'firstName' => 'ASC']);
        $out = array_map(fn(Person $p) => $this->serializePerson($p), $items);
        return new JsonResponse($out);
    }

    #[Route('/api/persons/{id}', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getOne(string $id): JsonResponse
    {
        $p = $this->persons->find($id);
        if (!$p) { return new JsonResponse(['error' => 'Introuvable'], 404); }
        
        $data = $this->serializePerson($p);
        
        // Add Parents details
        if ($data['fatherId']) {
            $f = $this->persons->find($data['fatherId']);
            if ($f) $data['father'] = $this->serializeLightPerson($f);
        }
        if ($data['motherId']) {
            $m = $this->persons->find($data['motherId']);
            if ($m) $data['mother'] = $this->serializeLightPerson($m);
        }
        
        // Add Children
        $children = $this->persons->createQueryBuilder('p')
            ->where('p.fatherId = :pid OR p.motherId = :pid')
            ->setParameter('pid', $id)
            ->getQuery()
            ->getResult();
            
        $data['children'] = array_map(fn($c) => $this->serializeLightPerson($c), $children);
        
        // Add Marriages (Families where this person is spouse)
        $families = $this->families->createQueryBuilder('f')
            ->where('f.husbandId = :pid OR f.wifeId = :pid')
            ->setParameter('pid', $id)
            ->getQuery()
            ->getResult();
            
        $data['marriages'] = array_map(function($f) use ($id) {
            $spouseId = ($f->getHusbandId() === $id) ? $f->getWifeId() : $f->getHusbandId();
            $spouse = $spouseId ? $this->persons->find($spouseId) : null;
            return [
                'id' => $f->getId(),
                'date' => self::formatDate($f->getMarriageDate()),
                'place' => $f->getMarriagePlace(),
                'spouse' => $spouse ? $this->serializeLightPerson($spouse) : null
            ];
        }, $families);
        
        return new JsonResponse($data);
    }

    #[Route('/api/persons/next-id', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getNextId(Request $request): JsonResponse
    {
        $treeId = $request->query->get('treeId');
        if (!$treeId) { return new JsonResponse(['error' => 'Tree ID required'], 400); }
        
        $max = $this->persons->findMaxGedcomIdNumber($treeId);
        return new JsonResponse(['nextId' => 'I' . ($max + 1)]);
    }

    #[Route('/api/persons', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) { return new JsonResponse(['error' => 'Payload invalide'], 400); }
        $treeId = $data['treeId'] ?? null;
        $first = $data['firstName'] ?? null;
        $last = $data['lastName'] ?? null;
        if (!$treeId || !$first || !$last) { return new JsonResponse(['error' => 'Champs requis manquants'], 400); }
        
        // Auto-generate GEDCOM ID if missing
        if (empty($data['gedcomId'])) {
            $max = $this->persons->findMaxGedcomIdNumber($treeId);
            $data['gedcomId'] = 'I' . ($max + 1);
        }

        $p = new Person(self::uuid(), $treeId, $first, $last);
        $this->hydratePerson($p, $data);
        
        $this->em->persist($p);
        $this->em->flush();
        
        // Recalculate Sosa if parents are involved
        // Use strict check
        $hasFather = !empty($data['fatherId']);
        $hasMother = !empty($data['motherId']);
        
        if ($hasFather || $hasMother) {
            $this->sosaCalculator->calculate($treeId);
        }
        
        return new JsonResponse(['id' => self::get($p, 'id')], 201);
    }

    #[Route('/api/persons/{id}', methods: ['PATCH'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function patch(string $id, Request $request): JsonResponse
    {
        $p = $this->persons->find($id);
        if (!$p) { return new JsonResponse(['error' => 'Introuvable'], 404); }
        $data = json_decode($request->getContent(), true) ?? [];
        
        $this->hydratePerson($p, $data);
        
        $this->em->flush();
        
        // Recalculate Sosa if structure changed
        if (array_key_exists('fatherId', $data) || array_key_exists('motherId', $data)) {
            $this->sosaCalculator->calculate(self::get($p, 'treeId'));
        }
        
        return new JsonResponse(['status' => 'ok']);
    }

    private function serializePerson(Person $p): array
    {
        return [
            'id' => self::get($p, 'id'),
            'treeId' => self::get($p, 'treeId'),
            'firstName' => self::get($p, 'firstName'),
            'middleName' => self::get($p, 'middleName'),
            'lastName' => self::get($p, 'lastName'),
            'maidenName' => self::get($p, 'maidenName'),
            'gender' => self::get($p, 'gender'),
            'fatherId' => self::get($p, 'fatherId'),
            'motherId' => self::get($p, 'motherId'),
            'birthDate' => self::formatDate(self::get($p, 'birthDate')),
            'birthDateOriginal' => self::get($p, 'birthDateOriginal'),
            'birthTime' => self::formatTime(self::get($p, 'birthTime')),
            'birthPlace' => self::get($p, 'birthPlace'),
            'birthLatitude' => self::get($p, 'birthLatitude'),
            'birthLongitude' => self::get($p, 'birthLongitude'),
            'baptismDate' => self::formatDate(self::get($p, 'baptismDate')),
            'baptismDateOriginal' => self::get($p, 'baptismDateOriginal'),
            'baptismTime' => self::formatTime(self::get($p, 'baptismTime')),
            'baptismPlace' => self::get($p, 'baptismPlace'),
            'baptismLatitude' => self::get($p, 'baptismLatitude'),
            'baptismLongitude' => self::get($p, 'baptismLongitude'),
            'deathDate' => self::formatDate(self::get($p, 'deathDate')),
            'deathDateOriginal' => self::get($p, 'deathDateOriginal'),
            'deathTime' => self::formatTime(self::get($p, 'deathTime')),
            'deathPlace' => self::get($p, 'deathPlace'),
            'deathLatitude' => self::get($p, 'deathLatitude'),
            'deathLongitude' => self::get($p, 'deathLongitude'),
            'occupation' => self::get($p, 'occupation'),
            'isLiving' => self::get($p, 'isLiving'),
            'notes' => self::get($p, 'notes'),
            'biography' => self::get($p, 'biography'),
            'posX' => self::get($p, 'posX'),
            'posY' => self::get($p, 'posY'),
            'gedcomId' => self::get($p, 'gedcomId'),
            'sosa' => self::get($p, 'sosa'),
        ];
    }

    private function serializeLightPerson(Person $p): array
    {
        return [
            'id' => self::get($p, 'id'),
            'firstName' => self::get($p, 'firstName'),
            'lastName' => self::get($p, 'lastName'),
            'gender' => self::get($p, 'gender'),
            'birthDate' => self::formatDate(self::get($p, 'birthDate')),
            'deathDate' => self::formatDate(self::get($p, 'deathDate')),
        ];
    }

    private function hydratePerson(Person $p, array $data): void
    {
        foreach (['firstName','middleName','lastName','maidenName','gender','fatherId','motherId','birthPlace','deathPlace','occupation','isLiving','notes','biography','posX','posY','birthLatitude','birthLongitude','deathLatitude','deathLongitude','baptismPlace','baptismLatitude','baptismLongitude','gedcomId','birthDateOriginal','baptismDateOriginal','deathDateOriginal'] as $field) {
            if (isset($data[$field])) {
                self::set($p, $field, $data[$field]);
            }
        }
        
        if (array_key_exists('birthDate', $data)) {
            self::set($p, 'birthDate', $data['birthDate'] ? new \DateTimeImmutable($data['birthDate']) : null);
        }
        if (array_key_exists('baptismDate', $data)) {
            self::set($p, 'baptismDate', $data['baptismDate'] ? new \DateTimeImmutable($data['baptismDate']) : null);
        }
        if (array_key_exists('deathDate', $data)) {
            self::set($p, 'deathDate', $data['deathDate'] ? new \DateTimeImmutable($data['deathDate']) : null);
        }
        if (array_key_exists('birthTime', $data)) {
             // Handle time string HH:MM:SS or full ISO
             $t = $data['birthTime'];
             if ($t && strlen($t) > 8) $t = substr($t, 11, 8); // Extract time from ISO if needed
             self::set($p, 'birthTime', $t ? new \DateTimeImmutable($t) : null);
        }
        if (array_key_exists('baptismTime', $data)) {
             $t = $data['baptismTime'];
             if ($t && strlen($t) > 8) $t = substr($t, 11, 8);
             self::set($p, 'baptismTime', $t ? new \DateTimeImmutable($t) : null);
        }
        if (array_key_exists('deathTime', $data)) {
             $t = $data['deathTime'];
             if ($t && strlen($t) > 8) $t = substr($t, 11, 8);
             self::set($p, 'deathTime', $t ? new \DateTimeImmutable($t) : null);
        }
    }

    private static function formatDate(?\DateTimeInterface $d): ?string
    {
        return $d ? $d->format('Y-m-d') : null;
    }
    
    private static function formatTime(?\DateTimeInterface $d): ?string
    {
        return $d ? $d->format('H:i:s') : null;
    }


    private static function get(object $obj, string $prop): mixed
    {
        $rp = new \ReflectionProperty($obj, $prop); $rp->setAccessible(true); return $rp->getValue($obj);
    }
    private static function set(object $obj, string $prop, mixed $val): void
    {
        $rp = new \ReflectionProperty($obj, $prop); $rp->setAccessible(true); $rp->setValue($obj, $val);
    }
    private static function uuid(): string
    {
        $data = random_bytes(16); $data[6] = chr(ord($data[6]) & 0x0f | 0x40); $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        $hex = bin2hex($data); return sprintf('%s-%s-%s-%s-%s', substr($hex,0,8), substr($hex,8,4), substr($hex,12,4), substr($hex,16,4), substr($hex,20));
    }
}
