<?php

namespace App\Controller;

use App\Entity\Media;
use App\Repository\MediaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class MediaController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MediaRepository $mediaRepo,
    ) {}

    #[Route('/api/media', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function upload(Request $request): JsonResponse
    {
        $file = $request->files->get('file');
        $personId = $request->request->get('personId');
        $eventId = $request->request->get('eventId');
        if (!$file || !$personId) { return new JsonResponse(['error' => 'Paramètres manquants'], 400); }
        $id = self::uuid();
        $dest = sys_get_temp_dir().DIRECTORY_SEPARATOR.$id.'_'.$file->getClientOriginalName();
        $file->move(dirname($dest), basename($dest));
        $m = new Media();
        self::set($m,'id',$id);
        self::set($m,'personId',$personId);
        if ($eventId) { self::set($m,'eventId',$eventId); }
        self::set($m,'fileName',$file->getClientOriginalName());
        self::set($m,'filePath',$dest);
        self::set($m,'fileType',$file->getClientMimeType());
        self::set($m,'createdAt', new \DateTimeImmutable());
        $this->em->persist($m);
        $this->em->flush();
        return new JsonResponse(['id' => $id], 201);
    }

    private static function set(object $obj, string $prop, mixed $val): void { $rp=new \ReflectionProperty($obj,$prop); $rp->setAccessible(true); $rp->setValue($obj,$val);}   
    private static function uuid(): string { $d=random_bytes(16); $d[6]=chr(ord($d[6])&0x0f|0x40); $d[8]=chr(ord($d[8])&0x3f|0x80); $h=bin2hex($d); return sprintf('%s-%s-%s-%s-%s',substr($h,0,8),substr($h,8,4),substr($h,12,4),substr($h,16,4),substr($h,20)); }
}
