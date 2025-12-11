<?php

namespace App\Entity;

use App\Repository\MediaObjectRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MediaObjectRepository::class)]
#[ORM\Table(name: 'media_objects')]
#[ORM\Index(columns: ['gedcom_id'], name: 'idx_media_gedcom_id')]
class MediaObject
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 255)]
    private string $fileName;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $title = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $mediaType; // PHOTO, AUDIO, VIDEO, etc.

    #[ORM\Column(type: 'string', length: 32, nullable: true)]
    private ?string $gedcomId = null;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeInterface $createdAt;

    public function __construct(string $id, string $fileName, string $mediaType)
    {
        $this->id = $id;
        $this->fileName = $fileName;
        $this->mediaType = $mediaType;
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string { return $this->id; }
    public function getFileName(): string { return $this->fileName; }
    public function setFileName(string $v): void { $this->fileName = $v; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $v): void { $this->title = $v; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $v): void { $this->description = $v; }
    public function getMediaType(): string { return $this->mediaType; }
    public function setMediaType(string $v): void { $this->mediaType = $v; }
    public function getGedcomId(): ?string { return $this->gedcomId; }
    public function setGedcomId(?string $v): void { $this->gedcomId = $v; }
    public function getCreatedAt(): \DateTimeInterface { return $this->createdAt; }
}
